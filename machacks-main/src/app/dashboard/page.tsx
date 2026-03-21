"use client";

import { Plus, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
                        Welcome back, Artist
                    </h1>
                    <p className="text-white/40 text-sm mt-2">
                        Your workspace is clean and ready.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 h-11 px-6">
                        Import Audio
                    </Button>
                    <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 h-11 px-6 font-semibold">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Project
                    </Button>
                </div>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-white/5 bg-white/[0.02] mt-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Music2 className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
                <p className="text-white/40 text-sm max-w-sm text-center mb-8">
                    Get started by importing an audio URL or dropping stems into a fresh editor.
                </p>
                <Button className="rounded-xl bg-white text-black hover:bg-gray-100 h-12 px-8 font-black uppercase text-[10px] tracking-widest">
                    Create New Project
                </Button>
            </div>
        </div>
    );
}
