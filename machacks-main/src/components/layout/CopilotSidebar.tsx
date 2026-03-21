"use client";

import { Sparkles, Send, Paperclip, MoreHorizontal, Bot, Type } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function CopilotSidebar() {
    return (
        <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="border-l border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-full overflow-hidden shrink-0"
        >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 px-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest">
                        Copilot
                    </div>
                    <span className="font-semibold text-sm text-white/90 tracking-tight">AI Assistant</span>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 rounded-full hover:bg-white/5">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-32">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Bot className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-white/80 text-sm font-bold mt-4">I am VenIQ Copilot.</p>
                        <p className="text-white/40 text-[11px] mt-2 max-w-[200px] leading-relaxed mx-auto">Ask me to generate stems, edit tracks, or rewrite lyrics.</p>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="relative flex items-end shadow-2xl shadow-indigo-500/5">
                    <Input
                        placeholder="Ask Copilot anything..."
                        className="w-full bg-white/5 border-white/10 pl-4 pr-20 py-6 rounded-2xl focus-visible:ring-indigo-500/50 text-xs text-white placeholder:text-white/20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-white/30 hover:text-white hover:bg-white/10">
                            <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button size="icon" className="h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20">
                            <Send className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white/20 hover:text-white/40 cursor-pointer transition-colors">
                        <Sparkles className="w-3 h-3" />
                        Track Assistant
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white/20 hover:text-white/40 cursor-pointer transition-colors">
                        <Type className="w-3 h-3" />
                        Lyrics Lab
                    </span>
                </div>
            </div>
        </motion.aside>
    );
}
