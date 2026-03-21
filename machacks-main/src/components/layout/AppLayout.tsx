"use client";

import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { CopilotSidebar } from "./CopilotSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicRoute = pathname === '/' || pathname === '/import';
    /** Live session: full viewport, no sidebar/nav clutter */
    const isLiveSession = pathname === '/editor';
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);

    if (isLiveSession) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-violet-500/25 selection:text-violet-100">
                {children}
            </div>
        );
    }

    if (isPublicRoute) {
        return (
            <div className="min-h-screen bg-[#020202] text-white overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="min-h-screen flex flex-col"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
                {/* Global Ambient Glows for public routes */}
                <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />
                <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#020202] text-white overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative">
            {/* Sidebar - Fixed Left */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Navbar - Fixed Top */}
                <Navbar onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)} isCopilotOpen={isCopilotOpen} />

                {/* Main Content Area */}
                <main className="flex-1 relative overflow-hidden flex">
                    <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <AnimatePresence initial={false}>
                        {isCopilotOpen && <CopilotSidebar />}
                    </AnimatePresence>
                </main>
            </div>

            {/* Global Background Elements */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>
        </div>
    );
}
