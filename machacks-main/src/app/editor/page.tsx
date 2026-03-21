"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Play, Square, Activity, HeartPulse, BrainCircuit, Mic, Music2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeFrame, clearHistory, overrideSentiment, type AnalysisEntry, type Track } from "@/lib/api";

const CAPTURE_INTERVAL_MS = 7000;

// ── YouTube IFrame API types ───────────────────────────────────────────────────
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
    setPlaybackRate(r: number): void;
    getPlaybackRate(): number;
}

export default function LiveSessionPage() {
    const videoRef   = useRef<HTMLVideoElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ytPlayerRef = useRef<YTPlayer | null>(null);
    const ytReadyRef  = useRef(false);
    const beatCleanupRef = useRef<() => void>(() => {});

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isOverriding, setIsOverriding] = useState(false);

    // Live analysis state
    const [currentMood, setCurrentMood] = useState<string>("None");
    const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
    const [currentEnergy, setCurrentEnergy] = useState<number | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [liveDescription, setLiveDescription] = useState("Awaiting session start...");
    const [eventLog, setEventLog] = useState<AnalysisEntry[]>([]);

    // ── YouTube IFrame setup ─────────────────────────────────────────────────

    useEffect(() => {
        // Inject YouTube IFrame API script once
        if (document.getElementById("yt-api-script")) return;
        const tag = document.createElement("script");
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            ytPlayerRef.current = new window.YT.Player("yt-player", {
                height: "180",
                width: "100%",
                playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
                events: {
                    onReady: (e: { target: YTPlayer }) => {
                        e.target.setVolume(80);
                        ytReadyRef.current = true;
                    },
                },
            });
        };
    }, []);

    // Load new video when track changes and adjust playback rate by energy
    useEffect(() => {
        if (!currentTrack?.youtube_id || !ytReadyRef.current) return;
        const yt = ytPlayerRef.current;
        if (!yt) return;

        yt.loadVideoById(currentTrack.youtube_id);

        // Slight tempo nudge: calm slows down, party speeds up
        const energy = currentEnergy ?? 5;
        const rate = energy >= 8 ? 1.25 : energy <= 3 ? 0.75 : 1.0;
        setTimeout(() => yt.setPlaybackRate(rate), 1500);
    }, [currentTrack?.youtube_id, currentEnergy]);

    // ── Tone.js beat overlay ──────────────────────────────────────────────────

    const updateBeatLayer = useCallback(async (mood: string, bpm: number, energy: number) => {
        // Clean up the previous loop
        beatCleanupRef.current();

        const Tone = await import("tone");
        if (Tone.getContext().state !== "running") await Tone.start();

        Tone.getTransport().stop();
        Tone.getTransport().cancel();
        Tone.getTransport().bpm.value = bpm;

        const disposables: { dispose(): void }[] = [];
        let cancelled = false;

        if (mood === "party" && energy >= 6) {
            // Kick drum on 1 and 3, hi-hat on 2 and 4
            const vol  = new Tone.Volume(-15 + Math.min((energy - 6) * 2, 6));
            const kick = new Tone.MembraneSynth({
                pitchDecay: 0.08, octaves: 6,
                envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
            }).connect(vol);
            vol.toDestination();

            const hihatVol = new Tone.Volume(-22);
            const hihat = new Tone.MetalSynth({
                frequency: 400, harmonicity: 5.1, modulationIndex: 32,
                resonance: 4000, octaves: 1.5,
                envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            }).connect(hihatVol);
            hihatVol.toDestination();

            const seq = new Tone.Sequence(
                (time, note) => {
                    if (cancelled) return;
                    if (note === "kick") kick.triggerAttackRelease("C1", "8n", time);
                    if (note === "hat")  hihat.triggerAttackRelease("16n", time);
                },
                ["kick", "hat", null, "hat", "kick", "hat", null, "hat"],
                "8n",
            );
            seq.start(0);
            Tone.getTransport().start();
            disposables.push(kick, hihat, hihatVol, vol, seq);

        } else if (mood === "calm") {
            const reverb = new Tone.Reverb({ decay: 5, wet: 0.75 });
            await reverb.ready;
            const vol   = new Tone.Volume(-20);
            const synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sine" },
                envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 3 },
            });
            synth.connect(vol);
            vol.connect(reverb);
            reverb.toDestination();

            const chords = [["C4","E4","G4"], ["A3","C4","E4"], ["F3","A3","C4"], ["G3","B3","D4"]];
            let i = 0;
            const loop = new Tone.Loop((time) => {
                if (!cancelled) synth.triggerAttackRelease(chords[i++ % chords.length], "2n", time, 0.2);
            }, "2m");
            loop.start(0);
            Tone.getTransport().start();
            disposables.push(synth, vol, reverb, loop);
        }

        beatCleanupRef.current = () => {
            cancelled = true;
            Tone.getTransport().stop();
            Tone.getTransport().cancel();
            disposables.forEach(d => { try { d.dispose(); } catch { /* already disposed */ } });
        };
    }, []);

    // Trigger beat layer whenever track/mood changes
    useEffect(() => {
        if (!isSessionActive || !currentTrack) return;
        const bpm = currentTrack.bpm ?? (currentMood === "party" ? 128 : 80);
        updateBeatLayer(currentMood, bpm, currentEnergy ?? 5);
        return () => { beatCleanupRef.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMood, currentTrack?.youtube_id]);

    // ── Webcam & analysis ─────────────────────────────────────────────────────

    const captureFrame = useCallback((): string | null => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return null;
        canvas.width  = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
            if (result.changed && result.track) setCurrentTrack(result.track);
        } catch {
            setLiveDescription("Backend unreachable. Is the Flask server running?");
        } finally {
            setIsAnalyzing(false);
        }
    }, [captureFrame]);

    const startSession = async () => {
        // Unlock AudioContext on user gesture so Tone.js can play
        try {
            const Tone = await import("tone");
            await Tone.start();
        } catch { /* ok */ }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(mediaStream);
            setIsSessionActive(true);
            setLiveDescription("Camera connected. First analysis in a moment...");
            await clearHistory();
            setEventLog([]);
            setCurrentTrack(null);
            setCurrentMood("Analyzing...");
        } catch {
            alert("Could not access the camera. Please ensure permissions are granted.");
        }
    };

    const forceMode = async (mode: "party" | "calm") => {
        setIsOverriding(true);
        try {
            const track = await overrideSentiment(mode);
            if (track) {
                setCurrentTrack(track);
                setCurrentMood(mode);
                setCurrentEnergy(mode === "party" ? 8 : 3);
                setLiveDescription(`DJ override → ${mode} mode`);
            }
        } finally {
            setIsOverriding(false);
        }
    };

    const stopSession = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        beatCleanupRef.current();
        setStream(null);
        setIsSessionActive(false);
        setIsAnalyzing(false);
        setLiveDescription("Session ended. Camera offline.");
        setCurrentMood("None");
    };

    useEffect(() => {
        if (isSessionActive && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
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
            beatCleanupRef.current();
        };
    }, [stream]);

    // ── Derived UI ────────────────────────────────────────────────────────────

    const moodColor = currentMood === "party"
        ? "text-pink-400"
        : currentMood === "calm"
        ? "text-indigo-400"
        : "text-white/60";

    // Visual EQ bars — 12 bars, heights driven by energy level
    const energy = currentEnergy ?? 0;
    const eqBars = Array.from({ length: 12 }, (_, i) => {
        const base = isSessionActive ? (energy / 10) * 60 : 4;
        const jitter = isSessionActive ? Math.sin(i * 2.3 + Date.now() / 400) * 12 : 0;
        return Math.max(4, Math.min(80, base + jitter));
    });

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto w-full gap-8 overflow-y-auto">
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Live DJ Session</h1>
                    <p className="text-white/40 mt-2">Crowd mood detection · YouTube playback · Tone.js beat layer · Real-time adaptation.</p>
                </div>
                <div className="flex gap-3">
                    {isSessionActive && (
                        <>
                            <Button
                                onClick={() => forceMode("calm")}
                                disabled={isOverriding}
                                className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl h-12 px-6 font-bold"
                            >
                                Force Calm
                            </Button>
                            <Button
                                onClick={() => forceMode("party")}
                                disabled={isOverriding}
                                className="bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl h-12 px-6 font-bold"
                            >
                                Force Party
                            </Button>
                        </>
                    )}
                    {!isSessionActive ? (
                        <Button onClick={startSession} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-12 px-8 font-bold text-white shadow-lg shadow-indigo-600/20 text-lg">
                            <Play className="w-5 h-5 mr-2 fill-current" />
                            Start Session
                        </Button>
                    ) : (
                        <Button onClick={stopSession} variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl h-12 px-8 font-bold text-lg">
                            <Square className="w-5 h-5 mr-2 fill-current" />
                            End Session
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[500px]">
                {/* Camera Feed & Analysis */}
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
                            <video
                                ref={videoRef}
                                autoPlay playsInline muted
                                className={`w-full h-full object-cover transition-opacity duration-500 ${isSessionActive ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                            />
                            {!isSessionActive && (
                                <div className="text-center text-white/20 flex flex-col items-center gap-4 relative z-10 p-12">
                                    <Camera className="w-12 h-12 mb-2 opacity-50" />
                                    <p className="text-lg">Click &quot;Start Session&quot; to activate the camera.</p>
                                </div>
                            )}
                            {isSessionActive && (
                                <div className="absolute top-20 right-6 flex items-center gap-2">
                                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                                        <BrainCircuit className="w-4 h-4 text-white/40" />
                                        <span className="text-xs text-white/60 font-medium">Gemini Vision Connected</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Visual EQ bars */}
                        {isSessionActive && (
                            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 h-20 px-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                                {eqBars.map((h, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 rounded-t transition-all duration-200 ${currentMood === "party" ? "bg-pink-500/60" : "bg-indigo-500/60"}`}
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Live Analysis Feed */}
                    <Card className="bg-[#080808] border-white/5 p-6 rounded-[32px] flex-1 flex flex-col min-h-[160px]">
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Mic className="w-4 h-4" />
                            Live Analysis Feed
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

                {/* Right panel */}
                <div className="flex flex-col gap-6">
                    <Card className="bg-[#080808] border-white/5 p-6 rounded-[32px] flex-1">
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            System Activity
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Music State</span>
                                    {isSessionActive ? (
                                        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Adapting</Badge>
                                    ) : (
                                        <Badge className="bg-white/5 text-white/40 border-white/10">Awaiting Data</Badge>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Energy Level</span>
                                    <span className="text-white font-mono">
                                        {currentEnergy !== null ? `${currentEnergy} / 10` : "—"}
                                    </span>
                                </div>
                                {currentTrack && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">BPM / Key</span>
                                        <span className="text-white font-mono text-xs">{currentTrack.bpm} BPM · {currentTrack.key}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm items-center pt-4">
                                    <span className="text-white/60">Current Mood</span>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black capitalize ${moodColor}`}>
                                            {currentMood}
                                        </span>
                                        {currentConfidence !== null && (
                                            <p className={`text-xs font-bold mt-0.5 ${moodColor} opacity-70`}>
                                                {Math.round(currentConfidence * 100)}% confident
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/5 w-full" />

                            <div>
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Event Log</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {eventLog.length === 0 ? (
                                        <div className="text-xs text-white/30 font-medium flex gap-3">
                                            <span className="text-white/20 font-mono">System</span>
                                            Initialized. Waiting for session.
                                        </div>
                                    ) : (
                                        eventLog.map((entry, i) => (
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
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Now Playing + YouTube player */}
                    <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border-white/10 p-6 rounded-[32px]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                {currentTrack ? (
                                    <Music2 className={`w-6 h-6 ${moodColor}`} />
                                ) : (
                                    <HeartPulse className="w-6 h-6 text-white/40" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-white font-bold text-lg leading-tight truncate">
                                    {currentTrack?.name ?? "Waiting for analysis..."}
                                </h4>
                                <p className="text-white/50 text-sm truncate">
                                    {currentTrack?.artist ?? (isSessionActive ? "Analyzing crowd..." : "Start a session")}
                                </p>
                                {currentTrack && (
                                    <p className="text-white/30 text-xs mt-0.5">
                                        {currentTrack.genre} · {currentTrack.bpm} BPM · {currentTrack.key}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tone.js beat layer indicator */}
                        {currentTrack && isSessionActive && (
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className={`w-3 h-3 ${currentMood === "party" ? "text-pink-400" : "text-indigo-400"}`} />
                                <span className="text-xs text-white/40 font-medium">
                                    {currentMood === "party"
                                        ? `Beat layer active · ${currentTrack.bpm} BPM · ${currentEnergy && currentEnergy >= 8 ? "1.25×" : "1.0×"} tempo`
                                        : "Ambient pad layer active · Reverb 5s"}
                                </span>
                            </div>
                        )}

                        {/* YouTube IFrame player */}
                        <div className="rounded-2xl overflow-hidden bg-black">
                            <div id="yt-player" />
                        </div>

                        {currentTrack?.youtube_url && (
                            <a
                                href={currentTrack.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white border border-white/10 rounded-xl py-2 mt-3 transition-colors"
                            >
                                Open in YouTube
                            </a>
                        )}
                        {currentTrack && !currentTrack.youtube_id && (
                            <p className="text-xs text-white/30 text-center mt-2">
                                YouTube API key not set — add YOUTUBE_API_KEY to backend/.env
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
