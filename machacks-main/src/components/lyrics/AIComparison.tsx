"use client";

import { Sparkles, Wand2, ArrowRight, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AIComparison() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                    <Wand2 className="w-4 h-4 text-purple-400" />
                    AI Rewrite Engine
                </h2>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] font-black tracking-widest px-3 py-1 rounded-full">OPTIMIZED</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="bg-[#080808] border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative group/card hover:border-indigo-500/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-8 flex flex-col gap-2 opacity-5 pointer-events-none group-hover/card:opacity-10 transition-opacity">
                        <MessageSquareQuote className="w-32 h-32 text-indigo-500" />
                    </div>

                    <CardHeader className="p-10 pb-6 relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-white tracking-tight">Creative Rewrite: Emotional Context</CardTitle>
                                <CardDescription className="text-white/30 mt-0.5">High-fidelity lyric transformation with GEN-2 model.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-10 pt-4 space-y-10 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
                            {/* Original */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/20">Source Text</span>
                                </div>
                                <div className="text-base leading-relaxed text-white/30 italic font-medium p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-inner">
                                    "Under the neon lights we fade<br />
                                    Chasing shadows that we made<br />
                                    Electronic dreams in the rain"
                                </div>
                            </div>

                            {/* Separator / Arrow */}
                            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-14 h-14 rounded-[20px] bg-[#0A0A0A] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 group-hover/card:border-indigo-500/40 transition-all duration-500 group-hover/card:scale-110">
                                <ArrowRight className="w-6 h-6 text-white/40 group-hover/card:text-indigo-400 group-hover/card:translate-x-0.5 transition-all" />
                            </div>

                            {/* AI Rewrite */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400">AI Suggested Alternative</span>
                                    </div>
                                    <Badge className="bg-indigo-500 text-white rounded-full text-[9px] px-2 h-4 border-none shadow-lg shadow-indigo-500/20 font-black">98% QUALITY</Badge>
                                </div>
                                <div className="text-base leading-relaxed text-indigo-100 font-bold p-8 rounded-3xl bg-indigo-500/[0.07] border border-indigo-500/20 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group/text active:scale-[0.99] transition-transform">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                                    "Beneath the neon glow we dissolve<br />
                                    Hunting ghosts we can't resolve<br />
                                    Digital pulse through the silver rain"
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between pt-8 border-t border-white/5 gap-6">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">Similarity Index</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full w-[84%] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                        </div>
                                        <span className="text-xs text-white/60 font-mono font-bold">84%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">Tone Analysis</span>
                                    <span className="text-[11px] text-indigo-300 font-bold bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest">Atmospheric / Noir</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button variant="ghost" className="rounded-2xl text-white/40 hover:text-white h-12 px-8 font-black uppercase text-[10px] tracking-widest transition-all">
                                    Discard
                                </Button>
                                <Button className="rounded-2xl bg-white text-black h-12 px-10 font-black uppercase text-[10px] tracking-[0.15em] shadow-xl shadow-white/5 transition-all hover:scale-105 active:scale-95">
                                    Merge Suggestion
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-2.5 px-4 justify-center">
                    {[
                        "More Poetic",
                        "Add Metaphors",
                        "Darker Tone",
                        "Cyberpunk Style",
                        "Rhythmic",
                        "Abstract"
                    ].map((chip, i) => (
                        <Button key={i} variant="outline" size="sm" className="h-10 px-6 rounded-full border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-[10px] font-black uppercase tracking-widest">
                            {chip}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
