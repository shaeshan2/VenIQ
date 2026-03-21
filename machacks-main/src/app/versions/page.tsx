"use client";

import { MOCK_PROJECTS } from "@/lib/mock-data";
import { ProjectHeader } from "@/components/composer/ProjectHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Play, Share2, MoreHorizontal, Clock, Sparkles, GitBranch, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VersionsPage() {
    const project = MOCK_PROJECTS[0];

    return (
        <div className="h-full flex flex-col select-none">
            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1200px] mx-auto space-y-12 pb-32">
                    {/* Header */}
                    <ProjectHeader project={project} />

                    {/* Versions Title */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold flex items-center gap-3 text-white tracking-tight">
                                <History className="w-8 h-8 text-indigo-400" />
                                Evolution History
                            </h2>
                            <p className="text-white/30 text-sm max-w-md">Every prompt leaves a footprint. Browse, compare, and revert to any stage of your song's creation.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/60 h-12 px-6 font-bold uppercase text-[10px] tracking-widest transition-all">
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Visual Compare
                            </Button>
                            <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 group transition-all">
                                <GitBranch className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                Commit State
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                        {project.versions.map((version) => (
                            <Card key={version.id} className="bg-[#080808] border-white/5 rounded-[40px] overflow-hidden hover:bg-[#0A0A0A] hover:border-indigo-500/30 transition-all duration-500 group flex flex-col shadow-2xl relative">
                                {/* Status Indicator */}
                                <div className="absolute top-0 right-0 p-8 z-10">
                                    <Badge variant="outline" className={cn(
                                        "text-[9px] font-black tracking-widest px-3 h-6 flex items-center rounded-full border-none shadow-lg",
                                        version.status === 'Original' ? "bg-white/5 text-white/40" : "bg-indigo-500 text-white shadow-indigo-500/20"
                                    )}>
                                        {version.status.toUpperCase()}
                                    </Badge>
                                </div>

                                <CardHeader className="p-10 pb-6 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:scale-110 transition-all duration-500 mb-6 shadow-inner">
                                        {version.status === 'Original' ? <History className="w-7 h-7 text-white/30" /> : <Sparkles className="w-7 h-7 text-indigo-400" />}
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors duration-500">{version.title}</CardTitle>
                                        <div className="flex items-center gap-3 text-white/20 text-xs font-bold uppercase tracking-widest font-mono">
                                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {version.date}</div>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <div className="text-indigo-400/60">{version.duration}</div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-10 py-4 flex-1 relative z-10">
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {version.tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="bg-white/5 text-white/30 border border-white/5 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest group-hover:text-white/60 transition-colors">{tag}</Badge>
                                        ))}
                                    </div>

                                    {/* Waveform Preview */}
                                    <div className="h-16 flex items-center gap-[3px] opacity-10 group-hover:opacity-40 transition-all duration-700 hover:opacity-80">
                                        {Array.from({ length: 60 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-white rounded-full group-hover:bg-indigo-400 transition-all"
                                                style={{ height: `${Math.random() * 90 + 10}%`, transitionDelay: `${i * 15}ms` }}
                                            />
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter className="p-10 pt-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01] relative z-10">
                                    <div className="flex items-center gap-3">
                                        <Button size="icon" className="w-12 h-12 rounded-2xl bg-white text-black hover:bg-indigo-50 transition-all shadow-xl active:scale-90 flex items-center justify-center">
                                            <Play className="w-5 h-5 fill-current ml-0.5" />
                                        </Button>
                                        <Button variant="ghost" className="h-12 px-6 rounded-2xl text-white/30 hover:text-indigo-400 uppercase font-black text-[10px] tracking-[0.2em] transition-all hover:bg-indigo-500/5">
                                            Rollback
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className="h-12 w-12 text-white/20 hover:text-white rounded-2xl transition-all hover:bg-white/5 font-bold">
                                            <Share2 className="w-5 h-5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-12 w-12 text-white/20 hover:text-white rounded-2xl transition-all hover:bg-white/5 font-bold">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </CardFooter>

                                {/* Decorative background glow */}
                                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            </Card>
                        ))}

                        {/* New Version Placeholder */}
                        <div className="border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center p-12 hover:bg-indigo-500/[0.03] hover:border-indigo-500/30 transition-all duration-500 group cursor-pointer text-center space-y-6 min-h-[400px]">
                            <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/40 transition-all duration-500 shadow-2xl">
                                <Sparkles className="w-10 h-10 text-white/10 group-hover:text-indigo-400" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-xl font-bold text-white/20 group-hover:text-white transition-colors duration-500 tracking-tight">Generate Alternative Path</h4>
                                <p className="text-sm text-white/10 max-w-[240px] mx-auto leading-relaxed group-hover:text-white/30 transition-colors duration-500">Kick off a new AI generation branch to explore different musical directions.</p>
                            </div>
                            <Button variant="outline" className="rounded-full border-white/10 text-white/20 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all text-[10px] px-8 h-10 font-black uppercase tracking-widest">Start Prompting</Button>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
