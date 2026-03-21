"use client";

import { Plus, Search, Filter, LayoutGrid, List, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
    return (
        <div className="h-full flex flex-col select-none">
            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1400px] mx-auto space-y-12 pb-32">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-2 mt-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                                    <Sparkles className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter text-white">WORKSPACE</h1>
                            </div>
                            <p className="text-white/30 text-sm max-w-lg leading-relaxed font-medium">Manage your active sonic experiments, AI collaborations, and multi-track iterations in one creative hub.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    placeholder="Filter sonic projects..."
                                    className="h-12 bg-black/40 border-white/5 px-12 rounded-2xl focus-visible:ring-indigo-500/40 text-sm min-w-[280px] placeholder:text-white/10"
                                />
                            </div>
                            <Button className="h-12 px-8 bg-white text-black hover:bg-indigo-50 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-white/5 group transition-all active:scale-95">
                                <Plus className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                                New Project
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-8 px-2">
                        <div className="flex items-center gap-10">
                            {['All Projects', 'Recent', 'Starred', 'Shared', 'Archived'].map((tab, i) => (
                                <button
                                    key={i}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-white relative pb-3",
                                        i === 0 ? "text-indigo-400" : "text-white/20"
                                    )}
                                >
                                    {tab}
                                    {i === 0 && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-indigo-400 rounded-xl bg-black/40 shadow-xl border border-white/5">
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-white/20 rounded-xl hover:text-white hover:bg-white/5">
                                <List className="w-5 h-5" />
                            </Button>
                            <div className="h-5 w-[1px] bg-white/10 mx-2" />
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-white/20 rounded-xl hover:text-white hover:bg-white/5">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {/* Empty State / Create */}
                        <div className="border-[3px] border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center p-16 hover:border-indigo-500/40 hover:bg-indigo-500/[0.03] transition-all duration-700 group min-h-[460px] cursor-pointer text-center relative overflow-hidden">
                            <div className="w-24 h-24 rounded-[36px] bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/40 transition-all duration-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
                                <Plus className="w-12 h-12 text-white/10 group-hover:text-indigo-400 transition-all duration-500" />
                            </div>
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-3xl font-black text-white/20 group-hover:text-white transition-all duration-700 tracking-tighter uppercase">Sonic Seed</h3>
                                <p className="text-sm text-white/10 max-w-[280px] leading-relaxed group-hover:text-white/30 transition-all duration-700 font-medium mx-auto">Upload stems or start a fresh vibe with a natural language prompt.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
