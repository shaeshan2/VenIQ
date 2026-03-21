"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Camera,
    Play,
    Square,
    SkipForward,
    ListMusic,
    Lock,
    Unlock,
    ChevronLeft,
} from "lucide-react";
import { analyzeFrame, clearHistory, overrideSentiment, type AnalysisEntry, type Track } from "@/lib/api";

const CAPTURE_INTERVAL_MS = 7000;
const QUEUE_PREFILL = 3;
const FADE_SECS = 2.5;

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
    const steps = 30;
    const stepMs = ms / steps;
    const delta = (to - from) / steps;
    let current = from;
    let count = 0;
    const timer = setInterval(() => {
        count++;
        current += delta;
        player.setVolume(Math.max(0, Math.min(100, Math.round(current))));
        if (count >= steps) clearInterval(timer);
    }, stepMs);
}

export default function LiveSessionPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ytPlayerRef = useRef<YTPlayer | null>(null);
    const ytReadyRef = useRef(false);
    const pendingVideoId = useRef<string | null>(null);

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isOverriding, setIsOverriding] = useState(false);
    const [overrideLock, setOverrideLock] = useState<"party" | "calm" | null>(null);

    const [currentMood, setCurrentMood] = useState<string>("None");
    const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
    const [currentEnergy, setCurrentEnergy] = useState<number | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [liveDescription, setLiveDescription] = useState("Start the session to read the room.");
    const [eventLog, setEventLog] = useState<AnalysisEntry[]>([]);
    const [queue, setQueue] = useState<Track[]>([]);

    useEffect(() => {
        if (document.getElementById("yt-api-script")) return;
        const tag = document.createElement("script");
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            ytPlayerRef.current = new window.YT.Player("yt-player", {
                height: "200",
                width: "100%",
                playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, mute: 1 },
                events: {
                    onReady: (e: { target: YTPlayer }) => {
                        e.target.setVolume(80);
                        e.target.setPlaybackRate(1);
                        ytReadyRef.current = true;
                        if (pendingVideoId.current) {
                            e.target.loadVideoById(pendingVideoId.current);
                            pendingVideoId.current = null;
                        }
                    },
                    onStateChange: (e: { data: number; target: YTPlayer }) => {
                        if (e.data === 1) {
                            e.target.unMute();
                            e.target.setVolume(80);
                            e.target.setPlaybackRate(1);
                        }
                    },
                },
            });
        };
    }, []);

    const loadYouTubeTrack = useCallback(async (videoId: string) => {
        const yt = ytPlayerRef.current;
        if (!yt || !ytReadyRef.current) {
            pendingVideoId.current = videoId;
            return;
        }
        rampYTVolume(yt, 80, 0, FADE_SECS * 1000);
        await new Promise((r) => setTimeout(r, FADE_SECS * 1000));
        yt.loadVideoById(videoId);
        yt.setPlaybackRate(1);
        setTimeout(() => rampYTVolume(yt, 0, 80, FADE_SECS * 1000), 500);
    }, []);

    const loadTrack = useCallback(
        async (track: Track) => {
            setCurrentTrack(track);
            if (track.youtube_id) await loadYouTubeTrack(track.youtube_id);
        },
        [loadYouTubeTrack]
    );

    const skipTrack = useCallback(async () => {
        if (queue.length === 0) return;
        const [next, ...rest] = queue;
        setQueue(rest);
        await loadTrack(next);
    }, [queue, loadTrack]);

    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return null;
        canvas.width = 640;
        canvas.height = 480;
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
        setLiveDescription("Analyzing…");
        try {
            const result = await analyzeFrame(frame);
            setCurrentMood(result.sentiment ?? "Unknown");
            setCurrentConfidence(result.confidence ?? null);
            setCurrentEnergy(result.energy);
            setLiveDescription(result.description || "No description returned.");
            setEventLog((prev) => [result, ...prev].slice(0, 50));
            if (result.changed && result.track) {
                await loadTrack(result.track);
                setQueue((prev) => (prev.length < 5 ? prev : prev.slice(0, 4)));
            }
        } catch {
            setLiveDescription("Backend unreachable. Is the Flask server running?");
        } finally {
            setIsAnalyzing(false);
        }
    }, [captureFrame, loadTrack, overrideLock]);

    const startSession = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(mediaStream);
            setIsSessionActive(true);
            setLiveDescription("Camera on. First read in a moment…");
            await clearHistory();
            setEventLog([]);
            setCurrentTrack(null);
            setQueue([]);
            setCurrentMood("Analyzing…");
        } catch {
            alert("Could not access the camera. Please allow camera access.");
        }
    };

    const stopSession = () => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setStream(null);
        setIsSessionActive(false);
        setIsAnalyzing(false);
        setLiveDescription("Session ended.");
        setCurrentMood("None");
        setQueue([]);
        setOverrideLock(null);
    };

    const forceMode = async (mode: "party" | "calm") => {
        setIsOverriding(true);
        try {
            const track = await overrideSentiment(mode);
            if (track) {
                await loadTrack(track);
                setCurrentMood(mode);
                setCurrentEnergy(mode === "party" ? 8 : 3);
                setLiveDescription(`DJ override: ${mode}. Auto picks paused until you resume.`);
                setOverrideLock(mode);
            }
        } finally {
            setIsOverriding(false);
        }
    };

    const clearOverride = () => {
        setOverrideLock(null);
        setLiveDescription("Auto mode resumed.");
    };

    useEffect(() => {
        if (isSessionActive && videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [isSessionActive, stream]);

    useEffect(() => {
        if (!isSessionActive) return;
        runAnalysis();
        intervalRef.current = setInterval(runAnalysis, CAPTURE_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSessionActive, runAnalysis]);

    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [stream]);

    const moodColor =
        currentMood === "party"
            ? "text-fuchsia-400"
            : currentMood === "calm"
              ? "text-sky-400"
              : "text-zinc-400";

    const energy = currentEnergy ?? 0;
    const eqBars = Array.from({ length: 14 }, (_, i) => {
        const base = isSessionActive ? (energy / 10) * 55 : 5;
        const jitter = isSessionActive ? Math.sin(i * 2.1 + Date.now() / 400) * 10 : 0;
        return Math.max(6, Math.min(85, base + jitter));
    });

    return (
        <div className="flex min-h-[100dvh] flex-col">
            <canvas ref={canvasRef} className="hidden" />

            {/* Minimal chrome */}
            <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Home
                </Link>
                <p className="text-center text-sm font-semibold tracking-tight text-zinc-100">Crowd DJ</p>
                <span className="w-14 sm:w-20" aria-hidden />
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pb-10 pt-6 sm:gap-6 sm:px-6">
                {/* Webcam — primary focus */}
                <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl shadow-black/40">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <span
                                className={`h-2 w-2 rounded-full ${isSessionActive ? "animate-pulse bg-red-500" : "bg-zinc-600"}`}
                            />
                            <span className="text-xs font-medium text-zinc-500">
                                {isAnalyzing ? "Reading room…" : isSessionActive ? "Live" : "Camera off"}
                            </span>
                        </div>
                        <Camera className="h-4 w-4 text-zinc-600" />
                    </div>
                    <div className="relative aspect-video w-full bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`absolute inset-0 h-full w-full object-cover ${isSessionActive ? "opacity-100" : "opacity-0"}`}
                        />
                        {!isSessionActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-zinc-500">
                                <Camera className="h-10 w-10 opacity-40" />
                                <p className="max-w-xs text-sm leading-relaxed">Turn on the session to use your webcam.</p>
                            </div>
                        )}
                        {isSessionActive && (
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-16 items-end justify-center gap-0.5 bg-gradient-to-t from-black/70 to-transparent px-6 pb-2">
                                {eqBars.map((h, i) => (
                                    <div
                                        key={i}
                                        className={`w-[5%] max-w-2 rounded-t bg-gradient-to-t ${currentMood === "party" ? "from-fuchsia-600/80 to-pink-500/40" : "from-indigo-600/80 to-violet-500/40"}`}
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Compact status: mood + song (under webcam) */}
                <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 sm:px-5">
                    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Mood</p>
                            <p className={`mt-0.5 text-lg font-semibold capitalize leading-tight ${moodColor}`}>
                                {currentMood}
                            </p>
                            {currentConfidence !== null && (
                                <p className="text-xs text-zinc-500">{Math.round(currentConfidence * 100)}% confidence</p>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Energy</p>
                            <p className="mt-0.5 font-mono text-lg font-medium text-zinc-100 tabular-nums">
                                {currentEnergy !== null ? `${currentEnergy} / 10` : "—"}
                            </p>
                            {isSessionActive && (
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-500"
                                        style={{ width: `${(currentEnergy ?? 0) * 10}%` }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="sm:text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Now playing</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-zinc-100">
                                {currentTrack?.name ?? "—"}
                            </p>
                            <p className="truncate text-xs text-zinc-500">{currentTrack?.artist ?? "Waiting for a track"}</p>
                        </div>
                    </div>
                    <p className="mt-3 border-t border-zinc-800/80 pt-3 text-sm leading-snug text-zinc-400">
                        {isAnalyzing ? <span className="animate-pulse">…</span> : null}
                        {liveDescription}
                    </p>
                </section>

                {/* Player + optional queue */}
                <section className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
                        <div id="yt-player" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {currentTrack?.youtube_url && (
                            <a
                                href={currentTrack.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                            >
                                Open in YouTube
                            </a>
                        )}
                        {currentTrack && !currentTrack.youtube_id && (
                            <span className="text-xs text-amber-200/80">Set YOUTUBE_API_KEY in backend/.env</span>
                        )}
                        {queue.length > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={skipTrack}
                                className="ml-auto border-zinc-700 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800"
                            >
                                <SkipForward className="mr-1.5 h-3.5 w-3.5" />
                                Skip
                            </Button>
                        )}
                    </div>
                    {queue.length > 0 && (
                        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2">
                            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                <ListMusic className="h-3 w-3" />
                                Up next
                            </p>
                            <ul className="space-1.5 text-xs text-zinc-400">
                                {queue.slice(0, QUEUE_PREFILL).map((t, i) => (
                                    <li key={i} className="truncate">
                                        {i + 1}. {t.name} — {t.artist}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* Controls */}
                <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {!isSessionActive ? (
                            <Button
                                onClick={startSession}
                                className="rounded-lg bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500"
                            >
                                <Play className="mr-2 h-4 w-4 fill-current" />
                                Start session
                            </Button>
                        ) : (
                            <Button
                                onClick={stopSession}
                                variant="outline"
                                className="rounded-lg border-red-500/40 bg-red-950/30 font-semibold text-red-200 hover:bg-red-950/50"
                            >
                                <Square className="mr-2 h-4 w-4 fill-current" />
                                End session
                            </Button>
                        )}
                    </div>
                    {isSessionActive && (
                        <div className="flex flex-wrap gap-2">
                            {overrideLock ? (
                                <Button
                                    type="button"
                                    onClick={clearOverride}
                                    className={`rounded-lg font-semibold ${
                                        overrideLock === "party"
                                            ? "bg-fuchsia-950/50 text-fuchsia-200 ring-1 ring-fuchsia-500/40 hover:bg-fuchsia-950/70"
                                            : "bg-sky-950/50 text-sky-200 ring-1 ring-sky-500/40 hover:bg-sky-950/70"
                                    }`}
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Resume auto ({overrideLock})
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        onClick={() => forceMode("calm")}
                                        disabled={isOverriding}
                                        variant="outline"
                                        className="rounded-lg border-sky-500/30 font-semibold text-sky-200 hover:bg-sky-950/40"
                                    >
                                        <Unlock className="mr-2 h-4 w-4" />
                                        Calm
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => forceMode("party")}
                                        disabled={isOverriding}
                                        variant="outline"
                                        className="rounded-lg border-fuchsia-500/30 font-semibold text-fuchsia-200 hover:bg-fuchsia-950/40"
                                    >
                                        <Unlock className="mr-2 h-4 w-4" />
                                        Party
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* Collapsed: session log for debugging */}
                <details className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 text-sm text-zinc-500">
                    <summary className="cursor-pointer px-4 py-2.5 font-medium text-zinc-400 transition hover:text-zinc-300">
                        Session log ({eventLog.length})
                    </summary>
                    <div className="max-h-40 overflow-y-auto border-t border-zinc-800/60 px-4 py-3 font-mono text-xs leading-relaxed">
                        {eventLog.length === 0 ? (
                            <p>No events yet.</p>
                        ) : (
                            eventLog.map((entry, i) => (
                                <div key={i} className="mb-2 border-b border-zinc-800/40 pb-2 last:mb-0 last:border-0">
                                    <span className="text-zinc-600">
                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                    </span>{" "}
                                    <span className={entry.changed ? "text-violet-300/90" : "text-zinc-500"}>
                                        {entry.changed
                                            ? `→ ${entry.sentiment} (${entry.energy})${entry.track ? ` · ${entry.track.name}` : ""}`
                                            : `Stable · ${entry.sentiment} (${entry.energy})`}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </details>
            </main>
        </div>
    );
}
