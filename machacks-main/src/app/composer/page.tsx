"use client";

import { MOCK_PROJECTS } from "@/lib/mock-data";
import { ProjectHeader } from "@/components/composer/ProjectHeader";
import { PromptBox } from "@/components/composer/PromptBox";
import { Timeline } from "@/components/composer/Timeline";
import { TrackList } from "@/components/composer/TrackList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, History, Info, Music2 } from "lucide-react";

export default function ComposerPage() {
    const project = MOCK_PROJECTS[0];

    return (
        <div className="h-full flex flex-col select-none">
            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1400px] mx-auto space-y-8 pb-32">
                    {/* Header */}
                    <ProjectHeader project={project} />

                    {/* Prompt Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                                <div className="w-8 h-[1px] bg-indigo-500/40" />
                                AI Command Input
                            </h2>
                            <div className="flex items-center gap-4 text-[10px] text-white/20 uppercase font-black tracking-widest">
                                <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-400" /> Mode: Music-v3</span>
                                <span className="flex items-center gap-1.5"><Info className="w-3 h-3" /> Context: Full Track</span>
                            </div>
                        </div>
                        <PromptBox />
                    </section>

                    {/* IDE Tabs */}
                    <Tabs defaultValue="timeline" className="space-y-8">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <TabsList className="bg-white/5 border border-white/10 p-1 h-12 rounded-2xl shadow-inner">
                                <TabsTrigger value="timeline" className="rounded-xl px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-indigo-600/20 text-[11px] font-black uppercase tracking-widest h-full transition-all">
                                    <Music2 className="w-4 h-4 mr-2" />
                                    Timeline
                                </TabsTrigger>
                                <TabsTrigger value="history" className="rounded-xl px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-indigo-600/20 text-[11px] font-black uppercase tracking-widest h-full transition-all">
                                    <History className="w-4 h-4 mr-2" />
                                    Diff Engine
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Version Control</span>
                                    <span className="text-xs text-indigo-400 font-bold">Midnight_Remix_v4.2</span>
                                </div>
                            </div>
                        </div>

                        <TabsContent value="timeline" className="space-y-10 mt-0 focus-visible:ring-0">
                            <Timeline tracks={project.tracks} />
                            <TrackList tracks={project.tracks} />
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 focus-visible:ring-0">
                            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] p-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-[32px] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4 scale-150">
                                    <History className="w-10 h-10 text-indigo-400 opacity-40" />
                                </div>
                                <h3 className="text-2xl font-bold text-white/80">Visual Diff Engine</h3>
                                <p className="text-white/30 max-w-sm text-sm leading-relaxed">
                                    Compare song versions visually and see AI modifications track by track. Coming soon in v0.5.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>
        </div>
    );
}
