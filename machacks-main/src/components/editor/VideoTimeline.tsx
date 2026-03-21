"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function VideoTimeline() {
    const sections = [
        { name: "Intro", start: 0, width: 15, color: "bg-white/10", border: "border-white/20" },
        { name: "Verse 1", start: 15, width: 30, color: "bg-indigo-500/20", border: "border-indigo-500/40" },
        { name: "Chorus", start: 45, width: 25, color: "bg-purple-500/20", border: "border-purple-500/40" },
        { name: "Bridge", start: 70, width: 15, color: "bg-fuchsia-500/20", border: "border-fuchsia-500/40" },
        { name: "Outro", start: 85, width: 15, color: "bg-white/10", border: "border-white/20" }
    ];

    const tracks: { name: string; type: string; color: string; clips: { start: number; width: number }[] }[] = [];

    return (
        <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden h-full min-h-[500px]">
            {/* Top Ruler & Sections */}
            <div className="h-16 border-b border-white/5 flex flex-col pt-2 relative shrink-0">
                {/* Sections */}
                <div className="absolute top-2 left-64 right-0 h-6 flex pr-10">
                    {sections.map((sec, i) => (
                        <div
                            key={i}
                            style={{ width: `${sec.width}%`, left: `${sec.start}%` }}
                            className={`absolute h-full rounded-md border text-[9px] font-black uppercase tracking-widest pl-2 flex items-center shadow-inner pt-0.5 ${sec.color} ${sec.border} text-white/80`}
                        >
                            {sec.name}
                        </div>
                    ))}
                </div>
                {/* Ruler markings */}
                <div className="absolute bottom-0 left-64 right-0 h-6 flex border-t border-white/5 opacity-40">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="flex-1 border-l border-white/20 text-[8px] font-mono text-white/30 pl-1 pt-1 h-full">
                            {i % 4 === 0 ? `0:${i * 5}` : ''}
                        </div>
                    ))}
                </div>
            </div>

            {/* Playhead */}
            <div className="absolute top-0 bottom-0 left-[calc(256px+42%)] w-[1px] bg-red-500 z-30 pointer-events-none shadow-[0_0_15px_rgba(239,68,68,1)]">
                <div className="absolute top-0 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500" />
            </div>

            {/* Tracks Container */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
                {tracks.map((track, i) => (
                    <div key={i} className="group border-b border-white/[0.03] flex items-stretch h-24 relative hover:bg-white/[0.02] transition-colors">

                        {/* Track Header (Left Sidebar attached to lane) */}
                        <div className="w-64 border-r border-white/5 bg-[#080808] shrink-0 p-4 flex flex-col justify-center gap-1 z-20 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: track.color }} />
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white/90 truncate">{track.name}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="w-5 h-5 rounded bg-white/5 hover:bg-white/20 text-[9px] font-bold text-white leading-none">M</button>
                                    <button className="w-5 h-5 rounded bg-white/5 hover:bg-white/20 text-[9px] font-bold text-white leading-none">S</button>
                                </div>
                            </div>
                            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{track.type}</span>
                        </div>

                        {/* Track Lane (Timeline Canvas) */}
                        <div className="flex-1 relative mx-6 bg-[repeating-linear-gradient(90deg,transparent,transparent_49px,rgba(255,255,255,0.02)_50px)]">
                            {track.clips.map((clip, j) => (
                                <div
                                    key={j}
                                    className="absolute top-2 bottom-2 rounded-xl border border-white/20 shadow-xl cursor-ew-resize hover:border-white/50 transition-colors group/clip overflow-hidden hover:z-20 hover:scale-y-[1.02]"
                                    style={{
                                        left: `${clip.start}%`,
                                        width: `${clip.width}%`,
                                        background: `linear-gradient(180deg, ${track.color}30, ${track.color}10)`
                                    }}
                                >
                                    {/* Fake Waveform Inside Clip */}
                                    <div className="absolute inset-0 flex items-center gap-[2px] px-2 opacity-60">
                                        {Array.from({ length: Math.floor(clip.width * 2) }).map((_, k) => (
                                            <div
                                                key={k}
                                                className="flex-1 rounded-full group-hover/clip:bg-white transition-colors duration-500"
                                                style={{
                                                    height: `${Math.random() * 80 + 20}%`,
                                                    backgroundColor: track.color
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Clip handles */}
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/10 hover:bg-white/40 opacity-0 group-hover/clip:opacity-100 transition-opacity cursor-col-resize" />
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/10 hover:bg-white/40 opacity-0 group-hover/clip:opacity-100 transition-opacity cursor-col-resize" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ambient Background for Timeline */}
            <div className="absolute bottom-[-20%] left-[30%] w-[50%] h-[50%] bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
        </div>
    );
}
