"use client";

import {
    Music,
    Layers,
    History,
    FileAudio,
    Settings,
    Plus,
    LayoutDashboard,
    ChevronDown,
    Search,
    Mic2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Layers, label: "Projects", href: "/projects" },
    { icon: Music, label: "Live Session", href: "/editor" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-white/10 bg-[#020202] flex flex-col h-full overflow-y-auto shrink-0 z-40 relative">
            {/* Workspace / Project Switcher Top */}
            <div className="p-4 border-b border-white/5 sticky top-0 bg-[#020202]/90 backdrop-blur-md z-10">
                <button className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all text-left group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <Music className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/90 group-hover:text-white truncate">Neon Rhapsody</span>
                            <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Personal Workspace</span>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white/60" />
                </button>
            </div>

            <div className="p-4 flex flex-col gap-6 flex-1">
                <Button className="w-full bg-white text-black hover:bg-indigo-50 shadow-lg shadow-white/5 rounded-xl border-none font-black uppercase text-[10px] tracking-widest transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="w-full h-8 bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/30 font-medium"
                    />
                </div>

                <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 ml-2 mb-2 block">Menu</span>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                                    isActive
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                )}
                                <item.icon className={cn(
                                    "w-4 h-4 transition-colors",
                                    isActive ? "text-indigo-400" : "text-white/30 group-hover:text-white/70"
                                )} />
                                <span className={cn("font-bold", isActive ? "text-indigo-300" : "")}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Actions & User Profile */}
            <div className="mt-auto p-4 border-t border-white/5 bg-[#050505] flex flex-col gap-2">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                        pathname === "/settings"
                            ? "bg-white/10 text-white"
                            : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </Link>

                {/* User Avatar Area */}
                <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] p-2 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-white/10 group-hover:border-indigo-500/40 transition-colors shadow-lg">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback className="bg-indigo-600 text-xs font-black">HP</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/90 group-hover:text-white">Producer</span>
                            <span className="text-[10px] text-white/40 font-medium">Pro Plan</span>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/20 group-hover:text-white/60" />
                </div>
            </div>
        </aside>
    );
}
