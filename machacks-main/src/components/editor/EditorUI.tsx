"use client";

import { Save, Undo2, Redo2, Download, Share2, Play, Pause, ZoomIn, ZoomOut, Scissors, Copy, Trash2, Mic2, Settings2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function EditorToolbar() {
    return (
        <div className="h-16 border-b border-white/5 bg-[#020202]/80 backdrop-blur-xl flex items-center justify-between px-6 z-30 sticky top-0 w-full shrink-0">
            {/* Project Info */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        Neon Rhapsody
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-white/5 border-white/10 text-white/40 h-4 px-1.5">v2.1</Badge>
                    </h2>
                    <span className="text-[10px] text-white/30 font-medium">Auto-saved just now</span>
                </div>
            </div>

            {/* Transport & Zoom Controls */}
            <div className="flex items-center gap-6">
                <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white rounded-lg"><Undo2 className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white rounded-lg"><Redo2 className="w-4 h-4" /></Button>
                </div>

                <div className="h-4 w-[1px] bg-white/10 mx-2" />

                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-10 w-10 text-white/60 hover:text-white rounded-full bg-white/5 border border-white/10"><Play className="w-5 h-5 fill-current ml-0.5" /></Button>
                    <div className="flex flex-col ml-3 mr-4">
                        <span className="text-xs font-mono font-bold text-white tracking-widest 0">00:42.15</span>
                        <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold">120 BPM</span>
                    </div>
                </div>

                <div className="h-4 w-[1px] bg-white/10 mx-2" />

                <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white rounded-lg"><ZoomOut className="w-4 h-4" /></Button>
                    <div className="w-16 h-1 bg-white/10 rounded-full mx-2 overflow-hidden flex items-center">
                        <div className="w-1/2 h-full bg-indigo-500 rounded-full" />
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white rounded-lg"><ZoomIn className="w-4 h-4" /></Button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-white/10 bg-white/5 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest">
                    <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                </Button>
                <Button size="sm" className="h-9 px-6 rounded-xl bg-white text-black hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-white/5">
                    <Download className="w-3.5 h-3.5 mr-2" /> Export
                </Button>
            </div>
        </div>
    );
}

export function ActionPalette() {
    return (
        <div className="h-14 border-b border-white/5 bg-[#050505] flex items-center px-6 gap-6 overflow-x-auto scrollbar-hide shrink-0 z-20 sticky top-16">
            <span className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">Tools</span>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest bg-white/5 border border-white/5">
                    <Scissors className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Split
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest">
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 text-[10px] uppercase font-bold tracking-widest">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </Button>
            </div>

            <div className="h-4 w-[1px] bg-white/10 mx-2" />

            <span className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">AI Actions</span>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-4 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 text-[10px] uppercase font-bold tracking-widest border border-indigo-500/20">
                    <Sparkles className="w-3.5 h-3.5 mr-2" /> Extract Instrumentals
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-4 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 text-[10px] uppercase font-bold tracking-widest border border-purple-500/20">
                    <Mic2 className="w-3.5 h-3.5 mr-2" /> Isolate Vocals
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-4 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-[10px] uppercase font-bold tracking-widest border border-white/5">
                    <Wand2 className="w-3.5 h-3.5 mr-2" /> Create Variation
                </Button>
            </div>
        </div>
    );
}
