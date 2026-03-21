"use client";

import { Mic2, Music2, Drum, Wind, AudioLines, MoreHorizontal, Activity, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Track } from "@/types";
import { cn } from "@/lib/utils";

interface TrackListProps {
    tracks: Track[];
}

export function TrackList({ tracks }: TrackListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    Active Layers
                </h3>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] text-white/40 hover:text-indigo-400 uppercase font-black tracking-widest rounded-xl transition-all">Solo Off</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 uppercase font-black tracking-widest rounded-xl px-4 transition-all">
                        Add Layer
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {tracks.map((track) => (
                    <div key={track.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 group hover:bg-white/[0.04] hover:border-white/10 transition-all relative overflow-hidden">
                        {/* Active Glow */}
                        <div className="absolute top-0 left-0 w-1 h-full opacity-60" style={{ backgroundColor: track.color }} />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all relative shadow-inner">
                                    <div className="absolute inset-0 blur-lg opacity-20" style={{ backgroundColor: track.color }} />
                                    {track.type === 'vocals' && <Mic2 className="w-6 h-6 text-indigo-400 relative z-10" />}
                                    {track.type === 'drums' && <Drum className="w-6 h-6 text-blue-400 relative z-10" />}
                                    {track.type === 'bass' && <Wind className="w-6 h-6 text-emerald-400 relative z-10" />}
                                    {track.type === 'melody' && <Music2 className="w-6 h-6 text-amber-400 relative z-10" />}
                                    {track.type === 'fx' && <Sparkles className="w-6 h-6 text-purple-400 relative z-10" />}
                                    {track.type === 'pad' && <AudioLines className="w-6 h-6 text-pink-400 relative z-10" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors uppercase tracking-tight">{track.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-white/20 uppercase font-black tracking-[0.1em]">{track.type}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-[10px] text-indigo-400/60 font-mono tracking-tighter">STEREO</span>
                                    </div>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-10 w-10 text-white/20 hover:text-white rounded-2xl hover:bg-white/5 transition-all">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                    <Volume2 className="w-4 h-4 text-white/40" />
                                </div>
                                <Slider defaultValue={[80]} max={100} className="flex-1" />
                                <span className="text-[10px] text-white/40 font-mono w-10 text-right bg-white/5 px-2 py-1 rounded-lg border border-white/5 font-bold">-2.4dB</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="flex-1 h-9 text-[10px] font-black uppercase rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white/40 tracking-widest transition-all">Mute</Button>
                                <Button variant="outline" className="flex-1 h-9 text-[10px] font-black uppercase rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white/40 tracking-widest transition-all">Solo</Button>
                                <Button className="flex-[1.5] h-9 text-[10px] font-black uppercase rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 tracking-widest transition-all shadow-lg shadow-indigo-500/5">AI Effects (3)</Button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Placeholder Track */}
                <div className="border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 hover:bg-white/[0.02] transition-all group cursor-pointer h-full min-h-[160px]">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Activity className="w-5 h-5 text-white/10 group-hover:text-indigo-400/60" />
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">Generate Layer</p>
                </div>
            </div>
        </div>
    );
}
