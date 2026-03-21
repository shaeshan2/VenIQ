"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Play, Square, Activity, HeartPulse, BrainCircuit, Mic, Music2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeFrame, clearHistory, type AnalysisEntry, type Track } from "@/lib/api";

const CAPTURE_INTERVAL_MS = 7000; // capture every 7 seconds

export default function LiveSessionPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Live analysis state
    const [currentMood, setCurrentMood] = useState<string>("None");
    const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
    const [currentEnergy, setCurrentEnergy] = useState<number | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [liveDescription, setLiveDescription] = useState("Awaiting session start...");
    const [eventLog, setEventLog] = useState<AnalysisEntry[]>([]);

    /** Capture the current video frame as a base64 JPEG string. */
    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return null;

        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Remove the "data:image/jpeg;base64," prefix — backend expects raw base64
        return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    }, []);

    /** Send one frame to the backend and update UI with the result. */
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
            setEventLog(prev => [result, ...prev].slice(0, 50)); // keep last 50

            if (result.changed && result.track) {
                setCurrentTrack(result.track);
            }
        } catch (err) {
            setLiveDescription("Backend unreachable. Is the Flask server running?");
            console.error("Analysis error:", err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [captureFrame]);

    const startSession = async () => {
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

    const stopSession = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setStream(null);
        setIsSessionActive(false);
        setIsAnalyzing(false);
        setLiveDescription("Session ended. Camera offline.");
        setCurrentMood("None");
    };

    // Attach stream to video element
    useEffect(() => {
        if (isSessionActive && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [isSessionActive, stream]);

    // Start polling when session becomes active
    useEffect(() => {
        if (!isSessionActive) return;

        // Run immediately, then on interval
        runAnalysis();
        intervalRef.current = setInterval(runAnalysis, CAPTURE_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSessionActive, runAnalysis]);

    // Clean up stream on unmount
    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [stream]);

    const moodColor = currentMood === "party"
        ? "text-pink-400"
        : currentMood === "calm"
        ? "text-indigo-400"
        : "text-white/60";

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto w-full gap-8 overflow-y-auto">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Live DJ Session</h1>
                    <p className="text-white/40 mt-2">Crowd mood detection · Spotify recommendations · Real-time adaptation.</p>
                </div>
                <div className="flex gap-4">
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
                {/* Camera Feed & Analysis Text */}
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
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover transition-opacity duration-500 ${isSessionActive ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                            />
                            {!isSessionActive && (
                                <div className="text-center text-white/20 flex flex-col items-center gap-4 relative z-10 p-12">
                                    <Camera className="w-12 h-12 mb-2 opacity-50" />
                                    <p className="text-lg">Click "Start Session" to activate the camera.</p>
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
                    </Card>

                    {/* Live Analysis Feed */}
                    <Card className="bg-[#080808] border-white/5 p-6 rounded-[32px] flex-1 flex flex-col min-h-[160px]">
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Mic className="w-4 h-4" />
                            Live Analysis Feed
                        </h3>
                        <ScrollArea className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 font-mono text-sm text-white/70 max-h-40">
                            <div className="space-y-3">
                                {/* Latest description */}
                                <div className="flex items-start gap-4">
                                    <span className="text-indigo-400 font-bold shrink-0">{'>'}</span>
                                    <p className={`leading-relaxed ${isAnalyzing ? 'animate-pulse' : ''}`}>{liveDescription}</p>
                                </div>
                                {/* History entries */}
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

                {/* Status Panel & Music Player */}
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

                    {/* Now Playing */}
                    <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border-white/10 p-6 rounded-[32px]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                {currentTrack ? (
                                    <Music2 className="w-6 h-6 text-indigo-300" />
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
                            </div>
                        </div>

                        {currentTrack && (
                            <div className="space-y-3">
                                {currentTrack.spotify_url && (
                                    <a
                                        href={currentTrack.spotify_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white border border-white/10 rounded-xl py-2 transition-colors"
                                    >
                                        Open in Spotify
                                    </a>
                                )}
                                {currentTrack.preview_url && (
                                    <audio
                                        key={currentTrack.uri}
                                        controls
                                        autoPlay
                                        className="w-full rounded-xl"
                                        src={currentTrack.preview_url}
                                    />
                                )}
                                {!currentTrack.preview_url && (
                                    <p className="text-xs text-white/30 text-center">No preview available for this track.</p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
