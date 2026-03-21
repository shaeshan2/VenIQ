"use client";

import { MOCK_PROJECTS } from "@/lib/mock-data";
import { ProjectHeader } from "@/components/composer/ProjectHeader";
import { LyricsEditor } from "@/components/lyrics/LyricsEditor";
import { AIComparison } from "@/components/lyrics/AIComparison";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, Mic2, Wand2, History } from "lucide-react";

export default function LyricsPage() {
    const project = MOCK_PROJECTS[0];

    return (
        <div className="h-full flex flex-col select-none">
            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1200px] mx-auto space-y-12 pb-32">
                    {/* Header */}
                    <ProjectHeader project={project} />

                    {/* Intro Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] border border-white/5 rounded-[40px] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
                        <div className="flex-1 space-y-3 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Mic2 className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-white">Lyrics Lab</h1>
                            </div>
                            <p className="text-white/30 max-w-lg text-sm leading-relaxed">
                                Use SoundSmith's AI to refine your message. Write line-by-line or let the AI rewrite entire stanzas in your preferred style.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 group">
                                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                Analyze Sentiment
                            </Button>
                            <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 h-14 w-14 p-0">
                                <History className="w-5 h-5 text-white/40" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-16">
                        <LyricsEditor lyrics={project.lyrics} />

                        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.05)]" />

                        <AIComparison />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
