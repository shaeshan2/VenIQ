"use client";

import {
    Users,
    Clock,
    Music2,
    ChevronDown,
    Share2,
    Download,
    Terminal,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types";

interface ProjectHeaderProps {
    project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white/[0.02] p-8 rounded-[40px] border border-white/5 backdrop-blur-sm relative overflow-hidden group">
            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors" />

            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                    <Music2 className="w-8 h-8 text-white" />
                </div>

                <div className="space-y-1.5 font-sans">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-white">{project.songTitle}</h1>
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white/40 text-[10px] uppercase font-bold py-0 h-5 px-3">
                            {project.status}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/40">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300/80 font-bold uppercase text-[10px] tracking-widest">{project.genre}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {project.bpm} BPM</span>
                        <span className="text-white/20">•</span>
                        <span>Key: <span className="text-white/60 font-medium">{project.key}</span></span>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> 3 collaborators</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
                <div className="flex -space-x-2.5 mr-4 items-center">
                    {project.collaborators.map((c) => (
                        <Avatar key={c.id} className="w-9 h-9 border-2 border-[#050505] shadow-lg hover:z-10 transition-all">
                            <AvatarImage src={c.avatar} />
                            <AvatarFallback className="bg-indigo-600 text-[10px]">{c.name[0]}</AvatarFallback>
                        </Avatar>
                    ))}
                    <Button size="icon" variant="outline" className="w-9 h-9 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white/40">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white/60 px-4 h-10">
                        <Terminal className="w-4 h-4 mr-2" />
                        History
                    </Button>
                    <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 px-6 h-10 font-bold group">
                        Export Mix
                        <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
