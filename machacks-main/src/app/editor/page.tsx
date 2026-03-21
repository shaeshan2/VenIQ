"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Play, Square, Activity, HeartPulse, BrainCircuit, Mic, Music2, Zap, SkipForward, ListMusic, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeFrame, clearHistory, overrideSentiment, generateComposition, type AnalysisEntry, type Track, type Composition } from "@/lib/api";
import { DJEngine } from "@/lib/dj-engine";

const CAPTURE_INTERVAL_MS = 7000;
const QUEUE_PREFILL = 3;   // songs to pre-fetch on session start
const FADE_SECS     = 2.5; // YouTube volume crossfade duration

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

// Smoothly ramp YouTube volume over ms milliseconds
function rampYTVolume(player: YTPlayer, from: number, to: number, ms: number) {
    const steps    = 30;
    const stepMs   = ms / steps;
    const delta    = (to - from) / steps;
    let   current  = from;
    let   count    = 0;
    const timer    = setInterval(() => {
        count++;
        current += delta;
        player.setVolume(Math.max(0, Math.min(100, Math.round(current))));
        if (count >= steps) clearInterval(timer);
    }, stepMs);
}

export default function LiveSessionPage() {
    // ── Refs ──────────────────────────────────────────────────────────────────
    const videoRef       = useRef<HTMLVideoElement>(null);
    const canvasRef      = useRef<HTMLCanvasElement>(null);
    const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const ytPlayerRef    = useRef<YTPlayer | null>(null);
    const ytReadyRef     = useRef(false);
    const pendingVideoId = useRef<string | null>(null);
    const djEngineRef    = useRef<DJEngine | null>(null);
    const transitioningRef = useRef(false);

    // ── State ─────────────────────────────────────────────────────────────────
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [stream,          setStream]          = useState<MediaStream | null>(null);
    const [isAnalyzing,     setIsAnalyzing]     = useState(false);
    const [isOverriding,    setIsOverriding]    = useState(false);
    const [djMode,          setDjMode]          = useState(false);
    const [isGenerating,    setIsGenerating]    = useState(false);

    const [currentMood,       setCurrentMood]       = useState<string>("None");
    const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
    const [currentEnergy,     setCurrentEnergy]     = useState<number | null>(null);
    const [currentTrack,      setCurrentTrack]      = useState<Track | null>(null);
    const [composition,       setComposition]       = useState<Composition | null>(null);
    const [activeLayers,      setActiveLayers]      = useState<string[]>([]);
    const [liveDescription,   setLiveDescription]   = useState("Awaiting session start...");
    const [eventLog,          setEventLog]          = useState<AnalysisEntry[]>([]);

    // Queue: list of upcoming tracks
    const [queue, setQueue] = useState<Track[]>([]);

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

    // ── Load new YouTube video with crossfade ─────────────────────────────────
    const loadYouTubeTrack = useCallback(async (videoId: string) => {
        const yt = ytPlayerRef.current;
        if (!yt || !ytReadyRef.current) { pendingVideoId.current = videoId; return; }

        // Fade out → swap → fade in
        rampYTVolume(yt, 80, 0, FADE_SECS * 1000);
        await new Promise(r => setTimeout(r, FADE_SECS * 1000));
        yt.loadVideoById(videoId);
        setTimeout(() => rampYTVolume(yt, 0, 80, FADE_SECS * 1000), 500);
    }, []);

    // Adjust YouTube playback rate when energy changes
    useEffect(() => {
        if (currentEnergy === null || !ytReadyRef.current || !ytPlayerRef.current || djMode) return;
        const rate = currentEnergy >= 8 ? 1.25 : currentEnergy <= 3 ? 0.75 : 1.0;
        ytPlayerRef.current.setPlaybackRate(rate);
    }, [currentEnergy, djMode]);

    // ── DJ Engine: generate composition + start synthesizer ──────────────────
    const loadDJComposition = useCallback(async (
        track: Track, energy: number, sentiment: string, description: string
    ) => {
        setIsGenerating(true);
        try {
            const comp = await generateComposition(track, energy, sentiment, description);
            if (!comp) return;

            setComposition(comp);

            if (!djEngineRef.current) djEngineRef.current = new DJEngine();
            const engine = djEngineRef.current;

            if (transitioningRef.current) return;
            transitioningRef.current = true;
            await engine.transitionTo(comp, FADE_SECS);
            transitioningRef.current = false;

            engine.setEnergy(energy);

            // Reflect active layers in UI
            const key = String(Math.max(1, Math.min(10, Math.round(energy))));
            setActiveLayers(comp.energy_layers[key] ?? []);
        } finally {
            setIsGenerating(false);
        }
    }, []);

    // When energy changes in DJ mode, just update layers (no re-generate)
    useEffect(() => {
        if (!djMode || !composition || currentEnergy === null) return;
        djEngineRef.current?.setEnergy(currentEnergy);
        const key = String(Math.max(1, Math.min(10, Math.round(currentEnergy))));
        setActiveLayers(composition.energy_layers[key] ?? []);
    }, [currentEnergy, djMode, composition]);

    // ── Load a track (handles both modes) ────────────────────────────────────
    const loadTrack = useCallback(async (
        track: Track, energy: number, sentiment: string, description: string
    ) => {
        setCurrentTrack(track);

        if (djMode) {
            await loadDJComposition(track, energy, sentiment, description);
        } else if (track.youtube_id) {
            await loadYouTubeTrack(track.youtube_id);
        }
    }, [djMode, loadDJComposition, loadYouTubeTrack]);

    // ── Skip to next song in queue ────────────────────────────────────────────
    const skipTrack = useCallback(async () => {
        if (queue.length === 0) return;
        const [next, ...rest] = queue;
        setQueue(rest);
        await loadTrack(next, currentEnergy ?? 5, currentMood, liveDescription);
    }, [queue, currentEnergy, currentMood, liveDescription, loadTrack]);

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
        const frame = captureFrame();
        if (!frame) return;
        setIsAnalyzing(true);
        setLiveDescription("Analyzing crowd...");
        try {
            const result = await analyzeFrame(frame);
            setCurrentMood(result.sentiment ?? "Unknown");
            setCurrentConfidence(result.confidence ?? null);
            setCurrentEnergy(result.energy);
            setLiveDescription(result.description || "No description returned.");
            setEventLog(prev => [result, ...prev].slice(0, 50));
            if (result.changed && result.track) {
                await loadTrack(result.track, result.energy, result.sentiment, result.description);
                // Add next song to queue when current one changes
                if (result.track) {
                    setQueue(prev => prev.length < 5 ? prev : prev.slice(0, 4));
                }
            }
        } catch {
            setLiveDescription("Backend unreachable. Is the Flask server running?");
        } finally {
            setIsAnalyzing(false);
        }
    }, [captureFrame, loadTrack]);

    // ── Session controls ──────────────────────────────────────────────────────
    const startSession = async () => {
        // Unlock AudioContext for Tone.js
        try {
            if (!djEngineRef.current) djEngineRef.current = new DJEngine();
            await djEngineRef.current.init();
        } catch { /* ok */ }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(mediaStream);
            setIsSessionActive(true);
            setLiveDescription("Camera connected. First analysis in a moment...");
            await clearHistory();
            setEventLog([]);
            setCurrentTrack(null);
            setComposition(null);
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
        djEngineRef.current?.stop();
        setStream(null);
        setIsSessionActive(false);
        setIsAnalyzing(false);
        setLiveDescription("Session ended. Camera offline.");
        setCurrentMood("None");
        setQueue([]);
        setComposition(null);
    };

    const forceMode = async (mode: "party" | "calm") => {
        setIsOverriding(true);
        try {
            const track = await overrideSentiment(mode);
            if (track) {
                await loadTrack(track, mode === "party" ? 8 : 3, mode, `DJ override → ${mode} mode`);
                setCurrentMood(mode);
                setCurrentEnergy(mode === "party" ? 8 : 3);
                setLiveDescription(`DJ override → ${mode} mode`);
            }
        } finally {
            setIsOverriding(false);
        }
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
            djEngineRef.current?.stop();
        };
    }, [stream]);

    // ── Switch DJ mode on/off ─────────────────────────────────────────────────
    const toggleDjMode = useCallback(async () => {
        const next = !djMode;
        setDjMode(next);

        if (!next) {
            // Switching OFF: stop engine, resume YouTube
            djEngineRef.current?.stop();
            setComposition(null);
            setActiveLayers([]);
            if (currentTrack?.youtube_id) loadYouTubeTrack(currentTrack.youtube_id);
        } else {
            // Switching ON: generate composition for current track
            if (currentTrack && currentEnergy !== null) {
                await loadDJComposition(currentTrack, currentEnergy, currentMood, liveDescription);
            }
        }
    }, [djMode, currentTrack, currentEnergy, currentMood, liveDescription, loadYouTubeTrack, loadDJComposition]);

    // ── Derived UI ─────────────────────────────────────────────────────────────
    const moodColor = currentMood === "party" ? "text-pink-400"
                    : currentMood === "calm"  ? "text-indigo-400"
                    : "text-white/60";

    const energy    = currentEnergy ?? 0;
    const eqBars    = Array.from({ length: 12 }, (_, i) => {
        const base   = isSessionActive ? (energy / 10) * 60 : 4;
        const jitter = isSessionActive ? Math.sin(i * 2.3 + Date.now() / 400) * 12 : 0;
        return Math.max(4, Math.min(80, base + jitter));
    });

    const ALL_LAYERS = ["kick", "snare", "hihat_closed", "hihat_open", "bass", "pad", "lead"];

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto w-full gap-8 overflow-y-auto">
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Live DJ Session</h1>
                    <p className="text-white/40 mt-1 text-sm">Crowd analysis · YouTube playback · Gemini AI composition · Tone.js synthesis</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {isSessionActive && (
                        <>
                            {/* DJ Mode toggle */}
                            <Button
                                onClick={toggleDjMode}
                                className={`rounded-xl h-12 px-5 font-bold border transition-all ${
                                    djMode
                                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30"
                                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                                }`}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {djMode ? "AI DJ Mode ON" : "AI DJ Mode"}
                            </Button>
                            <Button onClick={() => forceMode("calm")} disabled={isOverriding}
                                className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl h-12 px-5 font-bold">
                                Force Calm
                            </Button>
                            <Button onClick={() => forceMode("party")} disabled={isOverriding}
                                className="bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl h-12 px-5 font-bold">
                                Force Party
                            </Button>
                        </>
                    )}
                    {!isSessionActive ? (
                        <Button onClick={startSession} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-12 px-8 font-bold text-white shadow-lg shadow-indigo-600/20 text-lg">
                            <Play className="w-5 h-5 mr-2 fill-current" /> Start Session
                        </Button>
                    ) : (
                        <Button onClick={stopSession} variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl h-12 px-8 font-bold text-lg">
                            <Square className="w-5 h-5 mr-2 fill-current" /> End Session
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[500px]">
                {/* Left: Camera + Analysis */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="bg-[#050505] border-white/5 overflow-hidden relative rounded-[32px] flex flex-col min-h-[460px]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
                                    {isAnalyzing ? "Analyzing..." : isSessionActive ? "Live" : "Camera Offline"}
                                </span>
                            </div>
                            <Camera className="w-4 h-4 text-white/20" />
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
                        {/* EQ bars */}
                        {isSessionActive && (
                            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 h-20 px-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                                {eqBars.map((h, i) => (
                                    <div key={i} className={`w-3 rounded-t transition-all duration-200 ${currentMood === "party" ? "bg-pink-500/60" : "bg-indigo-500/60"}`}
                                        style={{ height: `${h}%` }} />
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
                                    <span className="text-indigo-400 font-bold shrink-0">{'>'}</span>
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
                                    <span className="text-white/60">Music State</span>
                                    {isSessionActive ? (
                                        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                            {djMode ? "AI DJ" : "Adapting"}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-white/5 text-white/40 border-white/10">Awaiting Data</Badge>
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
                                    <span className="text-white/60">Current Mood</span>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black capitalize ${moodColor}`}>{currentMood}</span>
                                        {currentConfidence !== null && (
                                            <p className={`text-xs font-bold mt-0.5 ${moodColor} opacity-70`}>
                                                {Math.round(currentConfidence * 100)}% confident
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* DJ Mode: instrument layers display */}
                            {djMode && composition && (
                                <div>
                                    <div className="h-[1px] bg-white/5 mb-4" />
                                    <h4 className="text-xs font-bold text-purple-400/60 uppercase tracking-widest mb-3 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> AI Composition Layers
                                    </h4>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {ALL_LAYERS.map(layer => {
                                            const active = activeLayers.includes(layer);
                                            return (
                                                <div key={layer} className={`text-xs font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-500 ${
                                                    active
                                                    ? "bg-purple-500/20 text-purple-200 border border-purple-500/30"
                                                    : "bg-white/3 text-white/20 border border-white/5"
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-purple-400 animate-pulse" : "bg-white/15"}`} />
                                                    {layer.replace("_", " ")}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {isGenerating && (
                                        <p className="text-xs text-purple-400/60 mt-2 animate-pulse">Generating composition...</p>
                                    )}
                                    {composition && (
                                        <p className="text-xs text-white/30 mt-2">
                                            {composition.key_root} {composition.key_type} · {composition.bpm} BPM
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="h-[1px] bg-white/5" />

                            {/* Event log */}
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
                                                    ? `Mood → ${entry.sentiment} (${entry.energy}/10)${entry.track ? ` · ${entry.track.name}` : ""}`
                                                    : `Stable · ${entry.sentiment} (${entry.energy}/10)`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Now Playing + Queue */}
                    <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border-white/10 p-6 rounded-[32px]">
                        {/* Now Playing header */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                {currentTrack ? <Music2 className={`w-6 h-6 ${moodColor}`} /> : <HeartPulse className="w-6 h-6 text-white/40" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-white font-bold text-base leading-tight truncate">
                                    {currentTrack?.name ?? "Waiting for analysis..."}
                                </h4>
                                <p className="text-white/50 text-sm truncate">
                                    {currentTrack?.artist ?? (isSessionActive ? "Analyzing crowd..." : "Start a session")}
                                </p>
                                {currentTrack && (
                                    <p className="text-white/30 text-xs mt-0.5">{currentTrack.genre} · {currentTrack.bpm} BPM · {currentTrack.key}</p>
                                )}
                            </div>
                            {/* Skip button */}
                            {queue.length > 0 && (
                                <Button onClick={skipTrack} size="icon"
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl w-10 h-10 shrink-0">
                                    <SkipForward className="w-4 h-4 text-white/60" />
                                </Button>
                            )}
                        </div>

                        {/* DJ Mode status strip */}
                        {djMode && isSessionActive && (
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className={`w-3 h-3 ${currentMood === "party" ? "text-pink-400" : "text-purple-400"}`} />
                                <span className="text-xs text-white/40">
                                    {isGenerating ? "Composing..." : "AI composition active"}
                                </span>
                            </div>
                        )}

                        {/* YouTube player (hidden in DJ mode) */}
                        <div className={`rounded-2xl overflow-hidden bg-black transition-all ${djMode ? "h-0 opacity-0 mb-0" : "mb-3"}`}>
                            <div id="yt-player" />
                        </div>

                        {!djMode && currentTrack?.youtube_url && (
                            <a href={currentTrack.youtube_url} target="_blank" rel="noopener noreferrer"
                                className="block w-full text-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white border border-white/10 rounded-xl py-2 mb-3 transition-colors">
                                Open in YouTube
                            </a>
                        )}
                        {!djMode && currentTrack && !currentTrack.youtube_id && (
                            <p className="text-xs text-white/30 text-center mb-3">Add YOUTUBE_API_KEY to backend/.env</p>
                        )}

                        {/* Queue */}
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
