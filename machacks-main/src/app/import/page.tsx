"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Youtube, Search, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ImportPage() {
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading'>('idle');
    const [loadingStage, setLoadingStage] = useState(0);

    const loadingStages = [
        "Establishing connection...",
        "Analyzing track structure...",
        "Separating stems (Vocals, Drums, Bass)...",
        "Generating waveform data...",
        "Detecting musical sections...",
        "Building AI Editor workspace..."
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setStatus('loading');

        // Mock loading sequence
        let currentStage = 0;
        const interval = setInterval(() => {
            currentStage++;
            setLoadingStage(currentStage);

            if (currentStage >= loadingStages.length - 1) {
                clearInterval(interval);
                setTimeout(() => {
                    router.push('/editor');
                }, 800);
            }
        }, 1200);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative p-6">
            <Link href="/" className="absolute top-8 left-8 text-white/40 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back
            </Link>

            <AnimatePresence mode="wait">
                {status === 'idle' ? (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-[540px] flex flex-col items-center text-center space-y-10"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.15)] mb-2">
                            <Youtube className="w-8 h-8 text-red-500" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-black tracking-tighter text-white">Import from YouTube</h1>
                            <p className="text-white/40 font-medium text-lg max-w-[400px] mx-auto leading-relaxed">
                                Paste a YouTube URL to instantly import, stem-separate, and start editing your track.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-red-400 transition-colors" />
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full h-16 bg-white/[0.03] border-white/10 rounded-2xl pl-16 pr-6 text-lg placeholder:text-white/20 focus-visible:ring-red-500/30 transition-all font-medium"
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={!url}
                                className="w-full h-16 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                Import Track
                                <Sparkles className="w-5 h-5 ml-2" />
                            </Button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-[400px] flex flex-col items-center text-center"
                    >
                        <div className="relative mb-12">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-32 h-32 rounded-full border border-indigo-500/30 border-t-indigo-400 border-l-transparent border-r-transparent"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            </div>
                            {/* Inner pulse */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"
                            />
                        </div>

                        <div className="space-y-4 h-20 relative w-full">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={loadingStage}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20, position: "absolute", left: 0, right: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                >
                                    <h3 className="text-xl font-bold text-white tracking-tight">{loadingStages[loadingStage]}</h3>
                                    <p className="text-indigo-400/60 text-xs font-mono mt-2">{Math.min(100, Math.round((loadingStage / (loadingStages.length - 1)) * 100))}% COMPLETE</p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="w-full h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500"
                                animate={{ width: `${(loadingStage / (loadingStages.length - 1)) * 100}%` }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
