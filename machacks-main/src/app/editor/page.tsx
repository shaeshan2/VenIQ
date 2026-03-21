"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Play, Square, Activity, HeartPulse, BrainCircuit, Mic, Music2, SkipForward, ListMusic, Lock, Unlock, BookOpen, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeFrame, clearHistory, overrideSentiment, type AnalysisEntry, type Track } from "@/lib/api";

const CAPTURE_INTERVAL_MS = 7000;
const QUEUE_PREFILL = 3;
const FADE_SECS     = 2.5;

// Emotion → icon + color for Lock In mode
const EMOTION_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    focused:  { emoji: "🎯", color: "text-blue-300",   label: "Locked In"  },
    happy:    { emoji: "😊", color: "text-yellow-300",  label: "Happy"      },
    tired:    { emoji: "😴", color: "text-purple-300",  label: "Tired"      },
    stressed: { emoji: "😤", color: "text-orange-300",  label: "Stressed"   },
    // club mode fallbacks
    party:    { emoji: "🔥", color: "text-pink-300",    label: "Party"      },
    calm:     { emoji: "🌊", color: "text-indigo-300",  label: "Calm"       },
};

declare global {
    interface Window {
        YT: { Player: new (id: string, opts: object) => YTPlayer };
        onYouTubeIframeAPIReady: () => void;
    }
}
interface YTPlayer {
    loadVideoById(id: string): void;
    playVideo(): void;
    pauseVideo(): void;
    setVolume(v: number): void;
    unMute(): void;
    setPlaybackRate(r: number): void;
}

function rampYTVolume(player: YTPlayer, from: number, to: number, ms: number) {
    const steps  = 30;
    const stepMs = ms / steps;
    const delta  = (to - from) / steps;
    let current  = from;
    let count    = 0;
    const timer  = setInterval(() => {
        count++;
        current += delta;
        player.setVolume(Math.max(0, Math.min(100, Math.round(current))));
        if (count >= steps) clearInterval(timer);
    }, stepMs);
}

export default function LiveSessionPage() {
    const videoRef       = useRef<HTMLVideoElement>(null);
    const canvasRef      = useRef<HTMLCanvasElement>(null);
    const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const ytPlayerRef    = useRef<YTPlayer | null>(null);
    const ytReadyRef     = useRef(false);
    const pendingVideoId = useRef<string | null>(null);

    const [appMode,         setAppMode]         = useState<"club" | "study">("club");
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [stream,          setStream]          = useState<MediaStream | null>(null);
    const [isAnalyzing,     setIsAnalyzing]     = useState(false);
    const [isOverriding,    setIsOverriding]    = useState(false);
    const [overrideLock,    setOverrideLock]    = useState<"party" | "calm" | null>(null);

    const [currentMood,       setCurrentMood]       = useState<string>("None");
    const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
    const [currentEnergy,     setCurrentEnergy]     = useState<number | null>(null);
    const [currentTrack,      setCurrentTrack]      = useState<Track | null>(null);
    const [coachMessage,      setCoachMessage]      = useState<string | null>(null);
    const [liveDescription,   setLiveDescription]   = useState("Awaiting session start...");
    const [eventLog,          setEventLog]          = useState<AnalysisEntry[]>([]);
    const [queue,             setQueue]             = useState<Track[]>([]);

    // ── YouTube IFrame setup ──────────────────────────────────────────────────
    useEffect(() => {
        if (document.getElementById("yt-api-script")) return;
        const tag = document.createElement("script");
        tag.id  = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            ytPlayerRef.current = new window.YT.Player("yt-player", {
                height: "180", width: "100%",
                playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, mute: 1 },
                events: {
                    onReady: (e: { target: YTPlayer }) => {
                        e.target.setVolume(80);
                        ytReadyRef.current = true;
                        if (pendingVideoId.current) {
                            e.target.loadVideoById(pendingVideoId.current);
                            pendingVideoId.current = null;
                        }
                    },
                    onStateChange: (e: { data: number; target: YTPlayer }) => {
                        if (e.data === 1) { e.target.unMute(); e.target.setVolume(80); }
                    },
                },
            });
        };
    }, []);

    const loadYouTubeTrack = useCallback(async (videoId: string) => {
        const yt = ytPlayerRef.current;
        if (!yt || !ytReadyRef.current) { pendingVideoId.current = videoId; return; }
        rampYTVolume(yt, 80, 0, FADE_SECS * 1000);
        await new Promise(r => setTimeout(r, FADE_SECS * 1000));
        yt.loadVideoById(videoId);
        setTimeout(() => rampYTVolume(yt, 0, 80, FADE_SECS * 1000), 500);
    }, []);

    useEffect(() => {
        if (currentEnergy === null || !ytReadyRef.current || !ytPlayerRef.current) return;
        const rate = currentEnergy >= 8 ? 1.25 : currentEnergy <= 3 ? 0.75 : 1.0;
        ytPlayerRef.current.setPlaybackRate(rate);
    }, [currentEnergy]);

    const loadTrack = useCallback(async (track: Track) => {
        setCurrentTrack(track);
        if (track.youtube_id) await loadYouTubeTrack(track.youtube_id);
    }, [loadYouTubeTrack]);

    const skipTrack = useCallback(async () => {
        if (queue.length === 0) return;
        const [next, ...rest] = queue;
        setQueue(rest);
        await loadTrack(next);
    }, [queue, loadTrack]);

    // ── Webcam & analysis ─────────────────────────────────────────────────────
    const captureFrame = useCallback((): string | null => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return null;
        canvas.width = 640; canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, 640, 480);
        return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    }, []);

    const runAnalysis = useCallback(async () => {
        if (overrideLock) return;
        const frame = captureFrame();
        if (!frame) return;
        setIsAnalyzing(true);
        setLiveDescription("Analyzing...");
        try {
            const result = await analyzeFrame(frame, appMode);
            setCurrentMood(result.sentiment ?? "Unknown");
            setCurrentConfidence(result.confidence ?? null);
            setCurrentEnergy(result.energy);
            setLiveDescription(result.description || "No description returned.");
            if (result.coach_message) setCoachMessage(result.coach_message);
            setEventLog(prev => [result, ...prev].slice(0, 50));
            if (result.changed && result.track) {
                await loadTrack(result.track);
                setQueue(prev => prev.length < 5 ? prev : prev.slice(0, 4));
            }
        } catch {
            setLiveDescription("Backend unreachable. Is the Flask server running?");
        } finally {
            setIsAnalyzing(false);
        }
    }, [captureFrame, loadTrack, overrideLock, appMode]);

    // ── Session controls ──────────────────────────────────────────────────────
    const startSession = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(mediaStream);
            setIsSessionActive(true);
            setLiveDescription("Camera connected. First analysis in a moment...");
            await clearHistory();
            setEventLog([]);
            setCurrentTrack(null);
            setCoachMessage(null);
            setQueue([]);
            setCurrentMood("Analyzing...");
        } catch {
            alert("Could not access the camera. Please ensure permissions are granted.");
        }
    };

    const stopSession = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setStream(null);
        setIsSessionActive(false);
        setIsAnalyzing(false);
        setLiveDescription("Session ended. Camera offline.");
        setCurrentMood("None");
        setQueue([]);
        setOverrideLock(null);
        setCoachMessage(null);
    };

    const forceMode = async (mode: "party" | "calm") => {
        setIsOverriding(true);
        try {
            const track = await overrideSentiment(mode);
            if (track) {
                await loadTrack(track);
                setCurrentMood(mode);
                setCurrentEnergy(mode === "party" ? 8 : 3);
                setLiveDescription(`Override active → ${mode} mode. Algorithm paused.`);
                setOverrideLock(mode);
            }
        } finally {
            setIsOverriding(false);
        }
    };

    const clearOverride = () => {
        setOverrideLock(null);
        setLiveDescription("Override cleared. Algorithm resumed.");
    };

    useEffect(() => {
        if (isSessionActive && videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [isSessionActive, stream]);

    useEffect(() => {
        if (!isSessionActive) return;
        runAnalysis();
        intervalRef.current = setInterval(runAnalysis, CAPTURE_INTERVAL_MS);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isSessionActive, runAnalysis]);

    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [stream]);

    // ── Derived UI ────────────────────────────────────────────────────────────
    const emotionCfg = EMOTION_CONFIG[currentMood] ?? { emoji: "🎵", color: "text-white/60", label: currentMood };
    const isStudy    = appMode === "study";

    const energy = currentEnergy ?? 0;
    const eqBars = Array.from({ length: 12 }, (_, i) => {
        const base   = isSessionActive ? (energy / 10) * 60 : 4;
        const jitter = isSessionActive ? Math.sin(i * 2.3 + Date.now() / 400) * 12 : 0;
        return Math.max(4, Math.min(80, base + jitter));
    });

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto w-full gap-8 overflow-y-auto">
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        {isStudy ? "Study Buddy" : "Live DJ Session"}
                    </h1>
                    <p className="text-white/40 mt-1 text-sm">
                        {isStudy
                            ? "Lock In mode · Personal focus assistant · Gemini Vision"
                            : "Crowd analysis · YouTube playback · Gemini Vision"}
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                    {/* Mode toggle — only before session starts */}
                    {!isSessionActive && (
                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setAppMode("club")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    appMode === "club"
                                    ? "bg-pink-500/20 text-pink-300"
                                    : "text-white/40 hover:text-white/70"
                                }`}
                            >
                                <Users className="w-4 h-4" /> Club Mode
                            </button>
                            <button
                                onClick={() => setAppMode("study")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    appMode === "study"
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "text-white/40 hover:text-white/70"
                                }`}
                            >
                                <BookOpen className="w-4 h-4" /> Lock In
                            </button>
                        </div>
                    )}

                    {isSessionActive && !isStudy && (
                        <>
                            {overrideLock ? (
                                <Button onClick={clearOverride}
                                    className={`rounded-xl h-12 px-5 font-bold border animate-pulse ${
                                        overrideLock === "party"
                                        ? "bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30"
                                        : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30"
                                    }`}>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Override ON: {overrideLock} — click to resume
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={() => forceMode("calm")} disabled={isOverriding}
                                        className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl h-12 px-5 font-bold">
                                        <Unlock className="w-4 h-4 mr-2" /> Force Calm
                                    </Button>
                                    <Button onClick={() => forceMode("party")} disabled={isOverriding}
                                        className="bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl h-12 px-5 font-bold">
                                        <Unlock className="w-4 h-4 mr-2" /> Force Party
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {!isSessionActive ? (
                        <Button onClick={startSession} className={`rounded-xl h-12 px-8 font-bold text-white shadow-lg text-lg ${
                            isStudy
                            ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                        }`}>
                            <Play className="w-5 h-5 mr-2 fill-current" /> Start Session
                        </Button>
                    ) : (
                        <Button onClick={stopSession} variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl h-12 px-8 font-bold text-lg">
                            <Square className="w-5 h-5 mr-2 fill-current" /> End Session
                        </Button>
                    )}
                </div>
            </div>

            {/* ── LOCK IN: Coach Message banner (study mode only) ── */}
            {isStudy && isSessionActive && coachMessage && (
                <Card className={`border p-6 rounded-[32px] transition-all duration-700 ${
                    currentMood === "stressed" ? "bg-orange-950/40 border-orange-500/20" :
                    currentMood === "tired"    ? "bg-purple-950/40 border-purple-500/20" :
                    currentMood === "happy"    ? "bg-yellow-950/40 border-yellow-500/20" :
                                                 "bg-blue-950/40 border-blue-500/20"
                }`}>
                    <div className="flex items-start gap-5">
                        <div className="text-5xl select-none shrink-0 mt-1">{emotionCfg.emoji}</div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black uppercase tracking-widest mb-2 ${emotionCfg.color}`}>
                                {emotionCfg.label}
                                {currentConfidence !== null && (
                                    <span className="opacity-50 ml-2 normal-case font-normal">
                                        {Math.round(currentConfidence * 100)}% confident
                                    </span>
                                )}
                            </p>
                            <p className="text-white text-xl font-semibold leading-relaxed">
                                {coachMessage}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[500px]">
                {/* Left: Camera + Feed */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="bg-[#050505] border-white/5 overflow-hidden relative rounded-[32px] flex flex-col min-h-[460px]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
                                    {isAnalyzing ? "Analyzing..." : isSessionActive ? "Live" : "Camera Offline"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isStudy && isSessionActive && (
                                    <span className="text-xs font-bold text-blue-400/60 uppercase tracking-widest">Lock In</span>
                                )}
                                <Camera className="w-4 h-4 text-white/20" />
                            </div>
                        </div>
                        <div className="flex-1 relative bg-black/50 flex items-center justify-center pt-16">
                            <video ref={videoRef} autoPlay playsInline muted
                                className={`w-full h-full object-cover transition-opacity duration-500 ${isSessionActive ? 'opacity-100' : 'opacity-0 absolute inset-0'}`} />
                            {!isSessionActive && (
                                <div className="text-center text-white/20 flex flex-col items-center gap-4 relative z-10 p-12">
                                    <Camera className="w-12 h-12 mb-2 opacity-50" />
                                    <p className="text-lg">Click &quot;Start Session&quot; to activate the camera.</p>
                                </div>
                            )}
                            {isSessionActive && (
                                <div className="absolute top-20 right-6">
                                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                                        <BrainCircuit className="w-4 h-4 text-white/40" />
                                        <span className="text-xs text-white/60 font-medium">Gemini Vision</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {isSessionActive && (
                            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 h-20 px-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                                {eqBars.map((h, i) => (
                                    <div key={i} className={`w-3 rounded-t transition-all duration-200 ${
                                        isStudy ? "bg-blue-500/60" :
                                        currentMood === "party" ? "bg-pink-500/60" : "bg-indigo-500/60"
                                    }`} style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Live Analysis Feed */}
                    <Card className="bg-[#080808] border-white/5 p-6 rounded-[32px] flex flex-col min-h-[160px]">
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Mic className="w-4 h-4" /> Live Analysis Feed
                        </h3>
                        <ScrollArea className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 font-mono text-sm text-white/70 max-h-40">
                            <div className="space-y-3">
                                <div className="flex items-start gap-4">
                                    <span className={`font-bold shrink-0 ${isStudy ? "text-blue-400" : "text-indigo-400"}`}>{'>'}</span>
                                    <p className={`leading-relaxed ${isAnalyzing ? 'animate-pulse' : ''}`}>{liveDescription}</p>
                                </div>
                                {eventLog.slice(1).map((entry, i) => (
                                    <div key={i} className="flex items-start gap-4 opacity-40">
                                        <span className="text-white/30 font-bold shrink-0">{'>'}</span>
                                        <p className="leading-relaxed text-xs">{entry.description}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* Right: System + Now Playing */}
                <div className="flex flex-col gap-6">
                    <Card className="bg-[#080808] border-white/5 p-6 rounded-[32px] flex-1">
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> System Activity
                        </h3>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Mode</span>
                                    <Badge className={isStudy
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-pink-500/10 text-pink-400 border-pink-500/20"}>
                                        {isStudy ? "🔒 Lock In" : "🎵 Club"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Music State</span>
                                    {!isSessionActive ? (
                                        <Badge className="bg-white/5 text-white/40 border-white/10">Awaiting Data</Badge>
                                    ) : !isStudy && overrideLock ? (
                                        <Badge className={overrideLock === "party" ? "bg-pink-500/20 text-pink-300 border-pink-500/30" : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"}>
                                            <Lock className="w-3 h-3 mr-1" /> Locked: {overrideLock}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Adapting</Badge>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Energy Level</span>
                                    <span className="text-white font-mono">{currentEnergy !== null ? `${currentEnergy} / 10` : "—"}</span>
                                </div>
                                {currentTrack && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">BPM / Key</span>
                                        <span className="text-white font-mono text-xs">{currentTrack.bpm} · {currentTrack.key}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm items-center pt-2">
                                    <span className="text-white/60">{isStudy ? "State" : "Mood"}</span>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black capitalize ${emotionCfg.color}`}>
                                            {emotionCfg.emoji} {emotionCfg.label}
                                        </span>
                                        {currentConfidence !== null && (
                                            <p className={`text-xs font-bold mt-0.5 ${emotionCfg.color} opacity-70`}>
                                                {Math.round(currentConfidence * 100)}% confident
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/5" />

                            <div>
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Event Log</h4>
                                <div className="space-y-2 max-h-36 overflow-y-auto">
                                    {eventLog.length === 0 ? (
                                        <div className="text-xs text-white/30 font-medium flex gap-3">
                                            <span className="text-white/20 font-mono">System</span>
                                            Initialized. Waiting for session.
                                        </div>
                                    ) : eventLog.map((entry, i) => (
                                        <div key={i} className="text-xs font-medium flex gap-3">
                                            <span className="text-white/20 font-mono shrink-0">
                                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                            </span>
                                            <span className={entry.changed ? "text-indigo-300/80" : "text-white/30"}>
                                                {entry.changed
                                                    ? `${entry.sentiment} (${entry.energy}/10)${entry.track ? ` · ${entry.track.name}` : ""}`
                                                    : `Stable · ${entry.sentiment} (${entry.energy}/10)`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Now Playing + Queue */}
                    <Card className={`border p-6 rounded-[32px] ${
                        isStudy
                        ? "bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border-white/10"
                        : "bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border-white/10"
                    }`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                {currentTrack ? <Music2 className={`w-6 h-6 ${emotionCfg.color}`} /> : <HeartPulse className="w-6 h-6 text-white/40" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-white font-bold text-base leading-tight truncate">
                                    {currentTrack?.name ?? "Waiting for analysis..."}
                                </h4>
                                <p className="text-white/50 text-sm truncate">
                                    {currentTrack?.artist ?? (isSessionActive ? "Analyzing..." : "Start a session")}
                                </p>
                                {currentTrack && (
                                    <p className="text-white/30 text-xs mt-0.5">{currentTrack.genre} · {currentTrack.bpm} BPM · {currentTrack.key}</p>
                                )}
                            </div>
                            {queue.length > 0 && (
                                <Button onClick={skipTrack} size="icon"
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl w-10 h-10 shrink-0">
                                    <SkipForward className="w-4 h-4 text-white/60" />
                                </Button>
                            )}
                        </div>

                        <div className="rounded-2xl overflow-hidden bg-black mb-3">
                            <div id="yt-player" />
                        </div>

                        {currentTrack?.youtube_url && (
                            <a href={currentTrack.youtube_url} target="_blank" rel="noopener noreferrer"
                                className="block w-full text-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white border border-white/10 rounded-xl py-2 mb-3 transition-colors">
                                Open in YouTube
                            </a>
                        )}
                        {currentTrack && !currentTrack.youtube_id && (
                            <p className="text-xs text-white/30 text-center mb-3">Add YOUTUBE_API_KEY to backend/.env</p>
                        )}

                        {queue.length > 0 && (
                            <div>
                                <div className="h-[1px] bg-white/5 mb-3" />
                                <h5 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <ListMusic className="w-3 h-3" /> Up Next
                                </h5>
                                <div className="space-y-2">
                                    {queue.slice(0, QUEUE_PREFILL).map((t, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs">
                                            <span className="text-white/20 font-mono w-4 shrink-0">{i + 1}</span>
                                            <div className="min-w-0">
                                                <p className="text-white/60 truncate font-medium">{t.name}</p>
                                                <p className="text-white/30 truncate">{t.artist} · {t.bpm} BPM</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
