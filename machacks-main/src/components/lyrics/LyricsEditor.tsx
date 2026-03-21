"use client";

import { Sparkles, RefreshCw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LyricLine } from "@/types";

interface LyricsEditorProps {
    lyrics: LyricLine[];
}

export function LyricsEditor({ lyrics }: LyricsEditorProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-bold flex items-center gap-3">
                    <Type className="w-6 h-6 text-indigo-400" />
                    Lyrics Editor
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] text-white/40 hover:text-white uppercase font-black tracking-widest rounded-xl">Auto-Scan</Button>
                    <Button className="h-8 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white uppercase font-black tracking-widest rounded-xl px-4 transition-all shadow-lg shadow-indigo-600/20">
                        Save Lyrics
                    </Button>
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-8 space-y-4">
                    {lyrics.map((line, i) => (
                        <div key={line.id} className="group relative flex gap-8 items-start py-4 px-6 rounded-2xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/5">
                            <span className="w-10 text-[11px] font-mono text-white/10 mt-1.5 group-hover:text-indigo-400/40 transition-colors font-bold tracking-widest">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1 flex flex-col gap-2">
                                <p className="text-xl font-medium text-white/70 group-hover:text-white transition-colors outline-none focus:text-indigo-300 leading-relaxed selection:bg-indigo-500/40" contentEditable spellCheck={false}>
                                    {line.text}
                                </p>
                                {line.isAI && (
                                    <Badge variant="outline" className="w-fit bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] uppercase font-black py-0 h-4 px-2 tracking-[0.1em]">AI Refined</Badge>
                                )}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 translate-x-2 group-hover:translate-x-0">
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all" title="Rewrite Line">
                                    <Sparkles className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <div className="pt-6 px-6">
                        <Button variant="ghost" className="w-full h-16 rounded-2xl border-2 border-dashed border-white/5 text-white/10 hover:text-white/30 hover:bg-white/[0.02] hover:border-white/10 text-sm font-bold uppercase tracking-[0.2em] transition-all">
                            + Add New Stanza
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
