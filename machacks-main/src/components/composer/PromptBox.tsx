"use client";

import { Sparkles, Paperclip, Send, AudioLines, Music, Mic2, Layers, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SUGGESTIONS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PromptBox() {
    const [prompt, setPrompt] = useState("");
    const [mode, setMode] = useState<'compose' | 'edit' | 'remix' | 'lyrics' | 'master'>('compose');

    const modeIcons = {
        compose: Sparkles,
        edit: Sliders,
        remix: Layers,
        lyrics: Mic2,
        master: AudioLines
    };

    const Icon = modeIcons[mode];

    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group transition-all hover:bg-white/[0.04] hover:shadow-indigo-500/5">
            {/* Background glow effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            <div className="flex flex-wrap gap-2 mb-8 items-center bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
                {(['Compose', 'Edit', 'Remix', 'Lyrics', 'Master'] as const).map((m) => (
                    <Button
                        key={m}
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode(m.toLowerCase() as any)}
                        className={cn(
                            "rounded-xl px-5 h-8 text-[10px] font-bold uppercase tracking-widest transition-all",
                            mode === m.toLowerCase()
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {m}
                    </Button>
                ))}
            </div>

            <div className="relative mb-6">
                <Icon className="absolute left-0 top-1.5 w-8 h-8 text-indigo-400 opacity-40" />
                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Instruct SoundSmith to ${mode}...`}
                    className="w-full bg-transparent border-none text-2xl md:text-3xl font-medium placeholder:text-white/10 focus-visible:ring-0 min-h-[140px] resize-none pl-12 py-1 scrollbar-hide text-white leading-tight"
                />

                <div className="absolute right-0 bottom-0 flex items-center gap-3 bg-gradient-to-l from-black/40 via-black/20 to-transparent pl-8 py-2 rounded-2xl">
                    <Button size="icon" variant="ghost" className="h-12 w-12 text-white/20 hover:text-indigo-400 rounded-2xl hover:bg-white/5 transition-all">
                        <Paperclip className="w-6 h-6" />
                    </Button>
                    <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-600/30 transition-all font-bold group border-t border-indigo-400/20">
                        Generate
                        <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-2 overflow-x-auto scrollbar-hide">
                <span className="text-[10px] uppercase font-bold text-white/20 mr-1 self-center border-r border-white/10 pr-3 h-4 flex items-center">AI Suggestions</span>
                {SUGGESTIONS.filter(s => s.category === mode).map((s) => (
                    <Badge
                        key={s.id}
                        variant="outline"
                        className="bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/5 cursor-pointer rounded-full px-4 py-1.5 font-bold text-[10px] uppercase tracking-wide transition-all border-none"
                        onClick={() => setPrompt(s.text)}
                    >
                        {s.text}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
