"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Camera, Play, Square, SkipForward, ListMusic, Lock, Unlock, ChevronLeft,
} from "lucide-react";
import { analyzeFrame, clearHistory, overrideSentiment, type AnalysisEntry, type Track } from "@/lib/api";
import {
    initFaceLandmarker, initPoseLandmarker,
    analyzeFaceFrame, analyzePoseFrame,
    drawFaceMesh, drawPoseSkeleton,
    type FaceFeatures, type PoseFeatures,
} from "@/lib/mediapipe-analyzer";
import * as Tone from "tone";

const CAPTURE_INTERVAL_MS = 10000;
const QUEUE_PREFILL = 3;

// Emotion → icon + color for Lock In mode
const EMOTION_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    focused:    { emoji: "🎯", color: "text-blue-300",    label: "Locked In"  },
    happy:      { emoji: "😊", color: "text-yellow-300",  label: "Happy"      },
    tired:      { emoji: "😴", color: "text-purple-300",  label: "Tired"      },
    stressed:   { emoji: "😤", color: "text-orange-300",  label: "Stressed"   },
    party:      { emoji: "🔥", color: "text-pink-300",    label: "Party"      },
    calm:       { emoji: "🌊", color: "text-indigo-300",  label: "Calm"       },
    excited:    { emoji: "⚡", color: "text-green-300",   label: "Excited"    },
    melancholic:{ emoji: "🌧️", color: "text-slate-300",  label: "Reflective" },
    anxious:    { emoji: "😰", color: "text-amber-300",   label: "Anxious"    },
    bored:      { emoji: "😑", color: "text-zinc-400",    label: "Bored"      },
};

const XFADE_S = 1.4; // crossfade duration — short enough to feel decisive
type FilterMode = "none" | "lowpass" | "highpass";
function pickFilterMode(): FilterMode {
    return (["none", "lowpass", "highpass"] as FilterMode[])[Math.floor(Math.random() * 3)];
}

export default function LiveSessionPage() {
    const videoRef       = useRef<HTMLVideoElement>(null);
    const canvasRef      = useRef<HTMLCanvasElement>(null);
    const overlayRef     = useRef<HTMLCanvasElement>(null);  // MediaPipe overlay
    const rafRef         = useRef<number | null>(null);      // requestAnimationFrame id
    const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const mpFeaturesRef  = useRef<FaceFeatures | PoseFeatures | null>(null);

    // Tone.js refs — created once, reused across tracks
    const toneReadyRef = useRef(false);
    const playerA = useRef<Tone.Player | null>(null);
    const playerB = useRef<Tone.Player | null>(null);
    const filterA = useRef<Tone.Filter | null>(null);
    const filterB = useRef<Tone.Filter | null>(null);
    const volA = useRef<Tone.Volume | null>(null);
    const volB = useRef<Tone.Volume | null>(null);
    // 0 = A is audible, 1 = B is audible
    const activeSide = useRef<0 | 1>(0);
    const hasPlayedRef = useRef(false);

    // Auto-advance: track current mood + schedule next song when preview ends
    const currentMoodRef   = useRef<string>("None");
    const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadTrackRef     = useRef<((t: Track) => Promise<void>) | null>(null);
    // Frame diff: store previous 32×32 frame to skip Gemini when scene hasn't changed
    const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

    // "auto" = Gemini decides each frame; "club"/"study" = user locked it
    const [appMode,         setAppMode]         = useState<"auto" | "club" | "study">("auto");
    const [detectedMode,    setDetectedMode]    = useState<"club" | "study" | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isOverriding, setIsOverriding] = useState(false);
    const [overrideLock, setOverrideLock] = useState<"party" | "calm" | "focused" | "happy" | null>(null);

    const [currentMood,       setCurrentMood]       = useState<string>("None");
    const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
    const [currentEnergy,     setCurrentEnergy]     = useState<number | null>(null);
    const [currentTrack,      setCurrentTrack]      = useState<Track | null>(null);
    const [coachMessage,      setCoachMessage]      = useState<string | null>(null);
    const [mpPersonCount,     setMpPersonCount]     = useState<number | null>(null);
    const [mpHandsRaised,     setMpHandsRaised]     = useState<number>(0);
    const [mpReady,           setMpReady]           = useState(false);
    const [showMesh,          setShowMesh]          = useState(true);

    // Derived: explicit lock takes priority over auto-detected mode
    const effectiveMode = appMode === "auto" ? (detectedMode ?? "club") : appMode;
    const isStudy       = effectiveMode === "study";

    const [liveDescription, setLiveDescription] = useState("Ready to read the room.");
    const [eventLog,        setEventLog]        = useState<AnalysisEntry[]>([]);
    const [queue,           setQueue]           = useState<Track[]>([]);

    // Genre preferences — persisted in localStorage, bias song selection
    const [genrePrefs, setGenrePrefs] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem("veniq_genre_prefs") || "[]"); }
        catch { return []; }
    });
    const genrePrefsRef = useRef<string[]>(genrePrefs);
    useEffect(() => { genrePrefsRef.current = genrePrefs; }, [genrePrefs]);

    const toggleGenre = (id: string) => {
        setGenrePrefs(prev => {
            const next = prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id];
            localStorage.setItem("veniq_genre_prefs", JSON.stringify(next));
            return next;
        });
    };

    // Countdown to next analysis (seconds)
    const [countdown, setCountdown] = useState(CAPTURE_INTERVAL_MS / 1000);
    useEffect(() => {
        if (!isSessionActive || isAnalyzing) { setCountdown(CAPTURE_INTERVAL_MS / 1000); return; }
        setCountdown(CAPTURE_INTERVAL_MS / 1000);
        const tick = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
        return () => clearInterval(tick);
    }, [isAnalyzing, isSessionActive]);

    // Keep currentMoodRef, currentTrackRef, isAnalyzingRef in sync for timer/interval callbacks
    useEffect(() => { currentMoodRef.current = currentMood; }, [currentMood]);
    const isAnalyzingRef = useRef(false);
    useEffect(() => { isAnalyzingRef.current = isAnalyzing; }, [isAnalyzing]);
    const currentTrackRef = useRef<Track | null>(null);
    useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

    // Flash when mood changes
    const prevMoodRef = useRef(currentMood);
    const [moodFlash, setMoodFlash] = useState(false);
    useEffect(() => {
        if (prevMoodRef.current === currentMood) return;
        prevMoodRef.current = currentMood;
        if (currentMood === "None" || currentMood === "Scanning…") return;
        setMoodFlash(true);
        const t = setTimeout(() => setMoodFlash(false), 700);
        return () => clearTimeout(t);
    }, [currentMood]);

    // ── MediaPipe real-time loop ──────────────────────────────────────────────
    const startMpLoop = useCallback((mode: "study" | "club") => {
        const video   = videoRef.current;
        const overlay = overlayRef.current;
        if (!video || !overlay) return;

        const loop = (ts: number) => {
            if (video.readyState < 2) { rafRef.current = requestAnimationFrame(loop); return; }

            overlay.width  = video.videoWidth  || 640;
            overlay.height = video.videoHeight || 480;

            if (mode === "study") {
                const { result, features } = analyzeFaceFrame(video, ts);
                drawFaceMesh(overlay, result, features.suggestedEmotion);
                mpFeaturesRef.current = features;
            } else {
                const { result, features } = analyzePoseFrame(video, ts);
                drawPoseSkeleton(overlay, result, "party");
                mpFeaturesRef.current = features;
                setMpPersonCount(features.personCount);
                setMpHandsRaised(features.handsRaisedCount);
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
    }, []);

    const stopMpLoop = useCallback(() => {
        if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        const overlay = overlayRef.current;
        if (overlay) overlay.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
    }, []);

    // ── Tone.js setup ──────────────────────────────────────────────────────────
    // Must be called inside a click handler (user gesture) so the AudioContext
    // is allowed to start. We call it in startSession().
    async function initTone() {
        if (toneReadyRef.current) return;
        await Tone.start();

        const pA = new Tone.Player();
        const pB = new Tone.Player();
        const fA = new Tone.Filter(20000, "lowpass");
        const fB = new Tone.Filter(20000, "lowpass");
        const vA = new Tone.Volume(0);   // A starts audible
        const vB = new Tone.Volume(-80); // B starts silent

        pA.connect(fA); fA.connect(vA); vA.toDestination();
        pB.connect(fB); fB.connect(vB); vB.toDestination();

        playerA.current = pA;
        playerB.current = pB;
        filterA.current = fA;
        filterB.current = fB;
        volA.current = vA;
        volB.current = vB;
        toneReadyRef.current = true;
    }

    const loadDeezerTrack = useCallback(async (previewUrl: string) => {
        await initTone();

        const side = activeSide.current;

        const incoming       = side === 0 ? playerB.current! : playerA.current!;
        const incomingVol    = side === 0 ? volB.current!    : volA.current!;
        const incomingFilter = side === 0 ? filterB.current! : filterA.current!;
        const outgoing       = side === 0 ? playerA.current! : playerB.current!;
        const outgoingVol    = side === 0 ? volA.current!    : volB.current!;
        const outgoingFilter = side === 0 ? filterA.current! : filterB.current!;

        await incoming.load(previewUrl);
        incoming.loop = false;

        // Reset incoming: start at −18 dB so both tracks are audible from the first moment
        incomingVol.volume.value = -18;
        incomingFilter.type = "lowpass";
        incomingFilter.frequency.value = 20000;

        if (!hasPlayedRef.current) {
            incomingVol.volume.value = 0;
            incoming.start();
            hasPlayedRef.current = true;
            activeSide.current = side === 0 ? 1 : 0;
            return;
        }

        // Filter sweep on outgoing — runs in first 60% of the fade so it's
        // clearly audible while the song still has volume
        const filterMode = pickFilterMode();
        if (filterMode === "lowpass") {
            outgoingFilter.type = "lowpass";
            outgoingFilter.frequency.value = 18000;
            outgoingFilter.frequency.rampTo(180, XFADE_S * 0.6);   // muffle outgoing
        } else if (filterMode === "highpass") {
            outgoingFilter.type = "highpass";
            outgoingFilter.frequency.value = 20;
            outgoingFilter.frequency.rampTo(4500, XFADE_S * 0.6);  // thin out bass
        }

        // True crossfade: both players overlap; incoming already at −18 dB
        incoming.start();
        incomingVol.volume.rampTo(0, XFADE_S);
        outgoingVol.volume.rampTo(-80, XFADE_S);

        activeSide.current = side === 0 ? 1 : 0;

        setTimeout(() => {
            try { outgoing.stop(); } catch { /* already stopped */ }
            outgoingVol.volume.value = -80;
            outgoingFilter.type = "lowpass";
            outgoingFilter.frequency.value = 20000;
        }, (XFADE_S + 0.3) * 1000);
    }, []);

    const loadTrack = useCallback(async (track: Track) => {
        setCurrentTrack(track);
        if (autoNextTimerRef.current) { clearTimeout(autoNextTimerRef.current); autoNextTimerRef.current = null; }
        if (track.preview_url) {
            await loadDeezerTrack(track.preview_url);
            // Auto-advance ~2s before the 30s Deezer preview ends
            autoNextTimerRef.current = setTimeout(async () => {
                const mood = currentMoodRef.current;
                if (!mood || mood === "None" || mood === "Scanning…") return;
                try {
                    const excludeId = currentTrackRef.current?.deezer_id ?? currentTrackRef.current?.preview_url ?? undefined;
                    const next = await overrideSentiment(mood, excludeId, genrePrefsRef.current);
                    if (next) await loadTrackRef.current?.(next);
                } catch { /* ignore — next interval will retry */ }
            }, 28000);
        }
    }, [loadDeezerTrack]);

    // Keep ref in sync so the timer callback always calls the latest loadTrack
    useEffect(() => { loadTrackRef.current = loadTrack; }, [loadTrack]);

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

        // Frame diff pre-check: skip Gemini when the scene hasn't changed
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
            const sc = document.createElement("canvas");
            sc.width = 32; sc.height = 32;
            const sctx = sc.getContext("2d");
            if (sctx) {
                sctx.drawImage(video, 0, 0, 32, 32);
                const newData = sctx.getImageData(0, 0, 32, 32).data;
                const prev = prevFrameDataRef.current;
                if (prev) {
                    let diffPixels = 0;
                    for (let i = 0; i < newData.length; i += 4) {
                        if (Math.abs(newData[i] - prev[i]) + Math.abs(newData[i + 1] - prev[i + 1]) + Math.abs(newData[i + 2] - prev[i + 2]) > 30) diffPixels++;
                    }
                    // < 5% of 32×32 pixels changed → scene is stable, skip API call
                    const mood = currentMoodRef.current;
                    if (diffPixels / 1024 < 0.05 && mood !== "None" && mood !== "Scanning…") return;
                }
                prevFrameDataRef.current = newData;
            }
        }

        setIsAnalyzing(true);
        setLiveDescription("Scanning…");
        try {
            // Map camelCase FaceFeatures / PoseFeatures to snake_case MediaPipeContext
            let mpCtx: import("@/lib/api").MediaPipeContext | undefined;
            if (mpFeaturesRef.current) {
                const mp = mpFeaturesRef.current;
                if ("eyeOpenness" in mp) {
                    const f = mp as FaceFeatures;
                    mpCtx = { face_detected: f.detected, eye_openness: f.eyeOpenness, smile_score: f.smileScore, brow_furrow: f.browFurrow, suggested_emotion: f.suggestedEmotion };
                } else {
                    const p = mp as PoseFeatures;
                    mpCtx = { person_count: p.personCount, hands_raised: p.handsRaisedCount, suggested_mode: p.suggestedMode };
                }
            }
            const result = await analyzeFrame(frame, appMode, mpCtx, genrePrefsRef.current);
            setCurrentMood(result.sentiment ?? "Unknown");
            setCurrentConfidence(result.confidence ?? null);
            setCurrentEnergy(result.energy);
            setLiveDescription(result.description || "No description returned.");
            if (result.coach_message) setCoachMessage(result.coach_message);
            if (appMode === "auto" && result.detected_mode) setDetectedMode(result.detected_mode);
            setEventLog((prev) => [result, ...prev].slice(0, 50));
            if (result.changed && result.track) {
                await loadTrack(result.track);
                setQueue((prev) => (prev.length < 5 ? prev : prev.slice(0, 4)));
            }
        } catch {
            setLiveDescription("No server signal. Check your connection.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [captureFrame, loadTrack, overrideLock, appMode]);

    const startSession = async () => {
        await Tone.start();
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(mediaStream);
            setIsSessionActive(true);
            setLiveDescription("Live. First scan incoming.");
            await clearHistory();
            setEventLog([]);
            setCurrentTrack(null);
            setCoachMessage(null);
            setQueue([]);
            setCurrentMood("Scanning…");
            hasPlayedRef.current = false;

            // Load MediaPipe model for current mode (non-blocking)
            const loadMode = appMode === "study" ? "study" : "club";
            const loader   = loadMode === "study" ? initFaceLandmarker : initPoseLandmarker;
            loader().then(() => {
                setMpReady(true);
                startMpLoop(loadMode);
            }).catch(() => { /* MediaPipe unavailable — overlay just won't show */ });
        } catch {
            alert("Could not access the camera. Please allow camera access.");
        }
    };

    const stopSession = () => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (autoNextTimerRef.current) { clearTimeout(autoNextTimerRef.current); autoNextTimerRef.current = null; }
        prevFrameDataRef.current = null;

        try { playerA.current?.stop(); } catch { /* already stopped */ }
        try { playerB.current?.stop(); } catch { /* already stopped */ }
        if (volA.current) volA.current.volume.value = -80;
        if (volB.current) volB.current.volume.value = -80;
        hasPlayedRef.current = false;
        activeSide.current = 0;

        setStream(null);
        setIsSessionActive(false);
        setIsAnalyzing(false);
        setLiveDescription("Session closed.");
        setCurrentMood("None");
        setQueue([]);
        setOverrideLock(null);
        setCoachMessage(null);
        setDetectedMode(null);
        setMpReady(false);
        setMpPersonCount(null);
        setMpHandsRaised(0);
        stopMpLoop();
    };

    const forceMode = async (mode: "party" | "calm" | "focused" | "happy") => {
        if (autoNextTimerRef.current) { clearTimeout(autoNextTimerRef.current); autoNextTimerRef.current = null; }
        setIsOverriding(true);
        try {
            const track = await overrideSentiment(mode, undefined, genrePrefsRef.current);
            if (track) {
                await loadTrack(track);
                setCurrentMood(mode);
                setCurrentEnergy(mode === "party" ? 8 : 3);
                setLiveDescription(`Override: ${mode} locked. Auto paused.`);
                setOverrideLock(mode);
            }
        } finally {
            setIsOverriding(false);
        }
    };

    const clearOverride = () => {
        setOverrideLock(null);
        setLiveDescription("Auto resumed. VenIQ has the wheel.");
    };

    useEffect(() => {
        if (isSessionActive && videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [isSessionActive, stream]);

    // Restart MediaPipe loop when effective mode changes mid-session
    useEffect(() => {
        if (!isSessionActive) return;
        stopMpLoop();
        setMpReady(false);
        const loader = isStudy ? initFaceLandmarker : initPoseLandmarker;
        loader().then(() => {
            setMpReady(true);
            startMpLoop(isStudy ? "study" : "club");
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStudy, isSessionActive]);

    useEffect(() => {
        if (!isSessionActive) return;
        // Delay first analysis slightly so webcam has time to initialise
        const first = setTimeout(runAnalysis, 1500);
        intervalRef.current = setInterval(runAnalysis, CAPTURE_INTERVAL_MS);

        // Fast scene-change detector: checks every 2s, triggers immediate analysis
        // when ≥20% of pixels shift (person enters/leaves, lights change, etc.)
        const fastCheck = setInterval(() => {
            if (isAnalyzingRef.current) return;
            const video = videoRef.current;
            if (!video || video.readyState < 2) return;
            const sc = document.createElement("canvas");
            sc.width = 32; sc.height = 32;
            const ctx = sc.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, 32, 32);
            const newData = ctx.getImageData(0, 0, 32, 32).data;
            const prev = prevFrameDataRef.current;
            if (!prev) return;
            let diff = 0;
            for (let i = 0; i < newData.length; i += 4) {
                if (Math.abs(newData[i] - prev[i]) + Math.abs(newData[i+1] - prev[i+1]) + Math.abs(newData[i+2] - prev[i+2]) > 30) diff++;
            }
            if (diff / 1024 >= 0.20) {
                // Significant scene change — analyse now, then reset the regular interval
                runAnalysis();
                clearInterval(intervalRef.current!);
                intervalRef.current = setInterval(runAnalysis, CAPTURE_INTERVAL_MS);
            }
        }, 2000);

        return () => {
            clearTimeout(first);
            if (intervalRef.current) clearInterval(intervalRef.current);
            clearInterval(fastCheck);
        };
    }, [isSessionActive, runAnalysis]);

    // Warm up Render on mount so it's ready before the user hits Start Session
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"}/api/playback/current`)
            .catch(() => { /* backend asleep or unreachable — that's fine */ });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
            stopMpLoop();
            try { playerA.current?.stop(); } catch { /* ok */ }
            try { playerB.current?.stop(); } catch { /* ok */ }
            volA.current?.dispose();
            volB.current?.dispose();
            filterA.current?.dispose();
            filterB.current?.dispose();
        };
    }, [stream, stopMpLoop]);

    // ── Derived UI ────────────────────────────────────────────────────────────
    const emotionCfg = EMOTION_CONFIG[currentMood] ?? { emoji: "🎵", color: "text-white/60", label: currentMood };

    const energy = currentEnergy ?? 0;

    return (
        <div className="flex min-h-[100dvh] flex-col bg-zinc-950">
            <canvas ref={canvasRef} className="hidden" />

            {/* Ambient background glow — mood-reactive */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-950/50 blur-3xl" />
                <div
                    className="absolute bottom-10 right-0 h-72 w-72 rounded-full blur-3xl transition-colors duration-1000"
                    style={{ background: currentMood === "party" ? "rgba(134,25,143,0.12)" : isStudy ? "rgba(37,99,235,0.10)" : "rgba(49,46,129,0.12)" }}
                />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-10 relative flex shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/75 px-4 py-3 backdrop-blur-md sm:px-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Home
                </Link>
                <span className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-base font-black tracking-tight text-transparent">
                    Ven<span className="text-white">IQ</span>
                </span>
                {/* Mode selector */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5 select-none">
                    <button
                        onClick={() => setAppMode("auto")}
                        className={`touch-manipulation px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            appMode === "auto" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"
                        }`}
                    >
                        ✦ Auto
                    </button>
                    <button
                        onClick={() => setAppMode(appMode === "club" ? "auto" : "club")}
                        className={`touch-manipulation px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            appMode === "club" ? "bg-pink-500/20 text-pink-300" : "text-white/40 hover:text-white/60"
                        }`}
                    >
                        {appMode === "club" ? "🔒 Crowd" : "Crowd"}
                    </button>
                    <button
                        onClick={() => setAppMode(appMode === "study" ? "auto" : "study")}
                        className={`touch-manipulation px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            appMode === "study" ? "bg-blue-500/20 text-blue-300" : "text-white/40 hover:text-white/60"
                        }`}
                    >
                        {appMode === "study" ? "🔒 Solo" : "Solo"}
                    </button>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pb-10 pt-6 sm:gap-6 sm:px-6">
                {/* Webcam — primary focus */}
                <section
                    className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/50 shadow-2xl transition-shadow duration-1000"
                    style={{
                        boxShadow: isSessionActive
                            ? currentMood === "party"
                                ? "0 0 60px -12px rgba(192,38,211,0.3), 0 25px 50px -12px rgba(0,0,0,0.6)"
                                : isStudy
                                ? "0 0 60px -12px rgba(37,99,235,0.25), 0 25px 50px -12px rgba(0,0,0,0.6)"
                                : "0 0 60px -12px rgba(99,102,241,0.25), 0 25px 50px -12px rgba(0,0,0,0.6)"
                            : "0 25px 50px -12px rgba(0,0,0,0.5)",
                    }}
                >
                    <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <span
                                className={`h-2 w-2 rounded-full ${isSessionActive ? "animate-pulse bg-red-500" : "bg-zinc-600"}`}
                            />
                            <span className="text-xs font-medium text-zinc-500">
                                {isAnalyzing ? "Scanning…" : isSessionActive ? (isStudy ? "Lock In · Live" : "Club · Live") : "Standby"}
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
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isSessionActive ? "opacity-100" : "opacity-0"}`}
                            style={{ transform: "scaleX(-1)" }}
                        />
                        {/* MediaPipe overlay — drawn in real-time via rAF */}
                        <canvas
                            ref={overlayRef}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{ mixBlendMode: "screen", opacity: (mpReady && showMesh) ? 1 : 0, transition: "opacity 0.5s", transform: "scaleX(-1)" }}
                        />
                        {!isSessionActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-zinc-500">
                                <Camera className="h-10 w-10 opacity-40" />
                                <p className="max-w-xs text-sm leading-relaxed">Hit Start to read the room.</p>
                            </div>
                        )}
                        {/* Countdown ring — top-left, very subtle */}
                        {isSessionActive && !isAnalyzing && (
                            <div className="absolute top-3 left-3 opacity-40 pointer-events-none">
                                <svg width="22" height="22" viewBox="0 0 22 22">
                                    <circle cx="11" cy="11" r="9" fill="none" stroke="white" strokeWidth="1.5" opacity="0.2" />
                                    <circle
                                        cx="11" cy="11" r="9"
                                        fill="none" stroke="white" strokeWidth="1.5"
                                        strokeDasharray="56.55"
                                        strokeDashoffset={56.55 * (1 - countdown / (CAPTURE_INTERVAL_MS / 1000))}
                                        strokeLinecap="round"
                                        transform="rotate(-90 11 11)"
                                        style={{ transition: "stroke-dashoffset 1s linear" }}
                                    />
                                </svg>
                            </div>
                        )}

                        {/* MediaPipe mesh toggle badge */}
                        {isSessionActive && mpReady && (
                            <button
                                onClick={() => setShowMesh(v => !v)}
                                className={`touch-manipulation absolute top-3 right-3 bg-black/60 backdrop-blur-md border px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95 ${
                                    isStudy ? "border-blue-500/30 hover:border-blue-500/60" : "border-pink-500/30 hover:border-pink-500/60"
                                } ${!showMesh ? "opacity-50" : ""}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${showMesh ? "animate-pulse" : ""} ${isStudy ? "bg-blue-400" : "bg-pink-400"}`} />
                                <span className={`text-xs font-medium ${isStudy ? "text-blue-300" : "text-pink-300"}`}>
                                    {isStudy
                                        ? (showMesh ? "Face Mesh ON" : "Face Mesh OFF")
                                        : `${showMesh ? "Pose ON" : "Pose OFF"} · ${mpPersonCount ?? 0}p${mpHandsRaised > 0 ? ` · ✋ ${mpHandsRaised}` : ""}`}
                                </span>
                            </button>
                        )}
                        {isSessionActive && (
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-16 items-end justify-center gap-0.5 bg-gradient-to-t from-black/70 to-transparent px-6 pb-2">
                                {Array.from({ length: 14 }).map((_, i) => {
                                    const base = Math.max(8, (energy / 10) * 55);
                                    const lo = Math.max(5, base - 20);
                                    const hi = Math.min(88, base + 22);
                                    return (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [`${lo}%`, `${hi}%`] }}
                                            transition={{ duration: 0.8 + (i % 5) * 0.26, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.07 }}
                                            className={`w-[5%] max-w-2 rounded-t bg-gradient-to-t ${
                                                isStudy ? "from-blue-600/80 to-blue-500/40" :
                                                currentMood === "party" ? "from-fuchsia-600/80 to-pink-500/40" : "from-indigo-600/80 to-violet-500/40"
                                            }`}
                                            style={{
                                                filter: isStudy
                                                    ? "drop-shadow(0 0 4px rgba(96,165,250,0.6))"
                                                    : currentMood === "party"
                                                    ? "drop-shadow(0 0 4px rgba(217,70,239,0.7))"
                                                    : "drop-shadow(0 0 4px rgba(129,140,248,0.6))",
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Lock In: Coach Message banner */}
                {isStudy && isSessionActive && coachMessage && (
                    <section className={`rounded-xl border p-4 transition-all duration-700 ${
                        currentMood === "stressed" ? "bg-orange-950/40 border-orange-500/20" :
                        currentMood === "tired"    ? "bg-purple-950/40 border-purple-500/20" :
                        currentMood === "happy"    ? "bg-yellow-950/40 border-yellow-500/20" :
                                                     "bg-blue-950/40 border-blue-500/20"
                    }`}>
                        <div className="flex items-start gap-4">
                            <span className="text-3xl select-none shrink-0">{emotionCfg.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${emotionCfg.color}`}>
                                    {emotionCfg.label}
                                    {currentConfidence !== null && (
                                        <span className="opacity-50 ml-2 normal-case font-normal">
                                            {Math.round(currentConfidence * 100)}% confident
                                        </span>
                                    )}
                                </p>
                                <p className="text-zinc-100 text-sm font-medium leading-relaxed">
                                    {coachMessage}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Compact status: mood + energy + now playing */}
                <section className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-5">
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                {isStudy ? "State" : "Mood"}
                            </p>
                            <p className={`mt-0.5 text-lg font-semibold capitalize leading-tight transition-all duration-300 ${emotionCfg.color} ${moodFlash ? "brightness-150 drop-shadow-[0_0_6px_currentColor]" : ""}`}>
                                {emotionCfg.emoji} {emotionCfg.label}
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
                                        style={{
                                            width: `${(currentEnergy ?? 0) * 10}%`,
                                            boxShadow: "0 0 8px rgba(139,92,246,0.6)",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5 border-t border-zinc-800/50 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
                            {currentTrack?.cover_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={currentTrack.cover_url}
                                    alt=""
                                    className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                                />
                            )}
                            <div className="min-w-0 sm:text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Now playing</p>
                                <p className="mt-0.5 truncate text-sm font-semibold text-zinc-100">
                                    {currentTrack?.name ?? "—"}
                                </p>
                                <p className="truncate text-xs text-zinc-500">{currentTrack?.artist ?? "On deck soon."}</p>
                            </div>
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={liveDescription}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-3 border-t border-zinc-800/80 pt-3 text-sm leading-snug text-zinc-400"
                        >
                            {isAnalyzing ? <span className="animate-pulse">…</span> : null}
                            {liveDescription}
                        </motion.p>
                    </AnimatePresence>
                </section>

                {/* Player row — cover art + queue */}
                <section className="space-y-3">
                    {currentTrack && (
                        <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/40 px-4 py-3 shadow-lg backdrop-blur-sm">
                            {currentTrack.cover_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={currentTrack.cover_url}
                                    alt={`${currentTrack.name} cover`}
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                                    style={{ boxShadow: "0 0 12px rgba(139,92,246,0.3)" }}
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-zinc-100">{currentTrack.name}</p>
                                <p className="truncate text-xs text-zinc-500">{currentTrack.artist}</p>
                                {currentTrack.bpm && (
                                    <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                                        {currentTrack.bpm} BPM · {currentTrack.key}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                {currentTrack.deezer_url && (
                                    <a
                                        href={currentTrack.deezer_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                                    >
                                        Deezer
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        {queue.length > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={skipTrack}
                                className="touch-manipulation ml-auto border-zinc-700 bg-zinc-900/50 text-zinc-200 active:scale-95 hover:bg-zinc-800"
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
                            <ul className="space-y-1.5 text-xs text-zinc-400">
                                {queue.slice(0, QUEUE_PREFILL).map((t, i) => (
                                    <li key={i} className="truncate">
                                        {i + 1}. {t.name} — {t.artist}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* Pre-session: taste + big centred Go Live */}
                {!isSessionActive && (
                    <section className="flex flex-col items-center gap-6 py-4">
                        {/* Taste pills — always visible before starting */}
                        <div className="w-full">
                            <p className="mb-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Your taste
                                {genrePrefs.length > 0 && <span className="ml-1.5 text-violet-400">· {genrePrefs.length} selected</span>}
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {([
                                    { id: "electronic", label: "⚡ Electronic" },
                                    { id: "hip-hop",    label: "🎤 Hip-Hop"   },
                                    { id: "pop",        label: "🎵 Pop"       },
                                    { id: "r-n-b",      label: "🎷 R&B"       },
                                    { id: "rock",       label: "🎸 Rock"      },
                                    { id: "classical",  label: "🎹 Classical"  },
                                ] as const).map(({ id, label }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => toggleGenre(id)}
                                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                                            genrePrefs.includes(id)
                                                ? "border-violet-500 bg-violet-950/60 text-violet-200"
                                                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Big centred Go Live */}
                        <div className="relative">
                            <span className="absolute -inset-2 rounded-2xl bg-violet-500/20 animate-ping" />
                            <Button
                                onClick={startSession}
                                className="relative touch-manipulation rounded-2xl bg-violet-600 px-12 py-4 text-lg font-bold text-white shadow-xl shadow-violet-900/50 active:scale-95 hover:bg-violet-500 hover:shadow-violet-700/60 transition-all"
                            >
                                <Play className="mr-2.5 h-6 w-6 fill-current" />
                                Go live
                            </Button>
                        </div>
                    </section>
                )}

                {/* Active session controls */}
                {isSessionActive && (
                <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={stopSession}
                            variant="outline"
                            className="w-full touch-manipulation rounded-lg border-red-500/40 bg-red-950/30 font-semibold text-red-200 active:scale-95 hover:bg-red-950/50 sm:w-auto"
                        >
                            <Square className="mr-2 h-4 w-4 fill-current" />
                            End session
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {overrideLock ? (
                            <>
                                <Button
                                    type="button"
                                    onClick={clearOverride}
                                    className="touch-manipulation rounded-lg bg-white/10 font-semibold text-white/80 ring-1 ring-white/20 active:scale-95 hover:bg-white/15"
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Release · {overrideLock}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => forceMode(overrideLock)}
                                    disabled={isOverriding}
                                    variant="outline"
                                    className="touch-manipulation rounded-lg border-zinc-600 font-semibold text-zinc-300 active:scale-95 hover:bg-zinc-800"
                                >
                                    <SkipForward className="mr-1.5 h-4 w-4" />
                                    Next track
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {([
                                    { mode: "calm",    label: "🌊 Calm",  cls: "border-sky-500/30 text-sky-200 hover:bg-sky-950/40" },
                                    { mode: "focused", label: "🎯 Focus", cls: "border-blue-500/30 text-blue-200 hover:bg-blue-950/40" },
                                    { mode: "happy",   label: "😊 Happy", cls: "border-yellow-500/30 text-yellow-200 hover:bg-yellow-950/40" },
                                    { mode: "party",   label: "🔥 Party", cls: "border-fuchsia-500/30 text-fuchsia-200 hover:bg-fuchsia-950/40" },
                                ] as const).map(({ mode, label, cls }) => (
                                    <Button
                                        key={mode}
                                        type="button"
                                        onClick={() => forceMode(mode)}
                                        disabled={isOverriding}
                                        variant="outline"
                                        className={`touch-manipulation rounded-lg font-semibold active:scale-95 ${cls}`}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                )}

                {/* Genre preferences — collapsed during active session */}
                {isSessionActive && (
                <><details className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 text-sm text-zinc-500">
                    <summary className="cursor-pointer px-4 py-2.5 font-medium text-zinc-400 transition hover:text-zinc-300">
                        Your taste {genrePrefs.length > 0 && <span className="ml-1 text-violet-400">· {genrePrefs.length} selected</span>}
                    </summary>
                    <div className="border-t border-zinc-800/60 px-4 py-3">
                        <p className="mb-2.5 text-xs text-zinc-500">Select genres you enjoy — VenIQ will bias recommendations toward them.</p>
                        <div className="flex flex-wrap gap-2">
                            {([
                                { id: "electronic", label: "⚡ Electronic" },
                                { id: "hip-hop",    label: "🎤 Hip-Hop"   },
                                { id: "pop",        label: "🎵 Pop"       },
                                { id: "r-n-b",      label: "🎷 R&B"       },
                                { id: "rock",       label: "🎸 Rock"      },
                                { id: "classical",  label: "🎹 Classical"  },
                            ] as const).map(({ id, label }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggleGenre(id)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                        genrePrefs.includes(id)
                                            ? "border-violet-500 bg-violet-950/60 text-violet-200"
                                            : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </details>

                {/* Collapsed: session log */}
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
                </>
                )}
            </main>
        </div>
    );
}
