"use client";

import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Track } from "@/types";
import { cn } from "@/lib/utils";

interface TimelineProps {
    tracks: Track[];
}

export function Timeline({ tracks }: TimelineProps) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden flex flex-col h-[520px] shadow-2xl backdrop-blur-sm relative group">
            {/* Glow Effect */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />

            {/* Controls Bar */}
            <div className="h-20 border-b border-white/5 bg-white/5 backdrop-blur-xl flex items-center justify-between px-8 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 bg-black/40 rounded-2xl p-1.5 border border-white/10 shadow-inner">
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                            <SkipBack className="w-5 h-5" />
                        </Button>
                        <Button size="icon" className="h-11 w-11 bg-white text-black rounded-xl hover:bg-indigo-50 hover:scale-105 transition-all shadow-xl shadow-white/5 group/play">
                            <Play className="w-5 h-5 fill-current ml-0.5 group-hover/play:scale-110 transition-transform" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                            <SkipForward className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="h-10 w-[1px] bg-white/10 mx-1" />

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Timecode</span>
                        <span className="text-xl font-mono text-white/80 tracking-tight">00:42.15</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 shadow-inner">
                        <Volume2 className="w-4 h-4 text-white/30" />
                        <div className="w-32">
                            <Slider defaultValue={[75]} max={100} step={1} className="h-1 cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Master</span>
                            <div className="flex gap-0.5 h-3 items-end">
                                {[1, 0.8, 1.2, 0.5, 0.9, 0.4, 0.7].map((h, i) => (
                                    <div key={i} className="w-0.5 bg-emerald-400/60 rounded-full" style={{ height: `${h * 100}%` }} />
                                ))}
                            </div>
                        </div>
                        <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white/80 hover:bg-white/10 h-11 px-6 font-bold text-[11px] uppercase tracking-[0.1em]">
                            Mix View
                        </Button>
                    </div>
                </div>
            </div>

            {/* DAW Grid */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Track Heads */}
                <div className="w-56 border-r border-white/10 flex flex-col pt-12 z-10 bg-black/40 backdrop-blur-sm">
                    {tracks.map((track) => (
                        <div key={track.id} className="h-20 border-b border-white/5 flex items-center px-6 gap-4 group cursor-pointer hover:bg-white/[0.03] transition-all">
                            <div className="w-1.5 h-10 rounded-full shadow-lg" style={{ backgroundColor: track.color, boxShadow: `0 0 10px ${track.color}40` }} />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors truncate">{track.name}</span>
                                <span className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-0.5">{track.type}</span>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-indigo-500/40" />
                                <div className="w-2 h-2 rounded-full bg-white/10" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pt-12 relative scrollbar-hide bg-[#050505]">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none opacity-[0.02]">
                        {Array.from({ length: 32 }).map((_, i) => (
                            <div key={i} className="flex-1 border-r border-white h-full" />
                        ))}
                    </div>

                    {/* Time Ruler */}
                    <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/10 flex items-center px-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] font-bold bg-black/20">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex-1">0{i + 1}:00</div>
                        ))}
                    </div>

                    {/* Playhead */}
                    <div className="absolute top-0 bottom-0 left-[42%] w-[1px] bg-indigo-500 z-10 shadow-[0_0_20px_rgba(99,102,241,0.8)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-5 bg-indigo-500 rounded-b-sm border-t-0 shadow-lg" />
                    </div>

                    {/* Tracks Blocks */}
                    <div className="flex flex-col h-full min-w-[1200px]">
                        {tracks.map((track, idx) => (
                            <div key={track.id} className="h-20 border-b border-white/[0.03] flex items-center relative px-6">
                                <div
                                    className="h-12 rounded-2xl border-white/10 flex items-center overflow-hidden group cursor-move hover:border-white/30 transition-all hover:scale-[1.01] hover:shadow-2xl hover:z-20 border shadow-lg"
                                    style={{
                                        background: `linear-gradient(to right, ${track.color}20, ${track.color}05)`,
                                        width: `${Math.random() * 30 + 40}%`,
                                        marginLeft: idx % 2 === 0 ? "2%" : "15%",
                                        borderLeft: `4px solid ${track.color}`
                                    }}
                                >
                                    <div className="flex items-center gap-[3px] h-full w-full px-4 py-3">
                                        {track.waveform.map((v, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-full group-hover:opacity-100 transition-all duration-500"
                                                style={{
                                                    height: `${v * 100}%`,
                                                    backgroundColor: v > 0.7 ? track.color : `${track.color}60`,
                                                    opacity: v > 0.5 ? 0.8 : 0.4
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
