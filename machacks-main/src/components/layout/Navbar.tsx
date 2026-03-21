"use client";

import { Search, Share2, Download, User, LayoutGrid, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Navbar({ onToggleCopilot, isCopilotOpen }: { onToggleCopilot?: () => void, isCopilotOpen?: boolean }) {
    return (
        <nav className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xl uppercase tracking-tighter">S</span>
                    </div>
                    <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">SoundSmith</span>
                </Link>

                <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm text-white/60 hover:bg-white/10 transition-colors cursor-pointer group">
                    <LayoutGrid className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                    <span className="max-w-[120px] truncate">My First Project</span>
                    <span className="text-white/20">/</span>
                    <span className="text-white/80 font-medium truncate">Neon Rhapsody</span>
                </div>
            </div>

            <div className="flex-1 max-w-md mx-8 hidden lg:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                        placeholder="Search sounds, projects, or prompts..."
                        className="w-full bg-white/5 border-white/10 pl-10 h-9 rounded-full focus-visible:ring-indigo-500/50 text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 rounded-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                </Button>
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 rounded-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
                <div className="h-8 w-[1px] bg-white/10 mx-2" />
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onToggleCopilot}
                    className={cn("rounded-full w-8 h-8 transition-colors hover:scale-105 active:scale-95", isCopilotOpen ? "bg-indigo-500 text-white hover:bg-indigo-400" : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10")}
                >
                    <Sparkles className="w-4 h-4" />
                </Button>
                <div className="h-8 w-[1px] bg-white/10 mx-1" />
                <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <User className="w-4 h-4" />
                </Button>
            </div>
        </nav>
    );
}
