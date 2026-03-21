"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bell, Shield, Keyboard, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
    return (
        <div className="h-full flex flex-col select-none">
            <ScrollArea className="flex-1">
                <div className="p-8 max-w-[1000px] mx-auto space-y-12 pb-32">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter text-white">SETTINGS</h1>
                        <p className="text-white/30 text-sm font-medium">Configure your AI workspace and account preferences.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="space-y-2">
                            {[
                                { icon: User, label: "Account" },
                                { icon: Sparkles, label: "AI Preferences", active: true },
                                { icon: Zap, label: "Billing & Plan" },
                                { icon: Bell, label: "Notifications" },
                                { icon: Shield, label: "Security" },
                                { icon: Keyboard, label: "Shortcuts" },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${item.active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="md:col-span-3 space-y-8">
                            <Card className="bg-[#080808] border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                                <CardHeader className="p-10 pb-6 border-b border-white/5">
                                    <CardTitle className="text-xl font-bold text-white tracking-tight">AI Model Configuration</CardTitle>
                                    <CardDescription className="text-white/30 mt-1">Select the default AI behavior for music generation and lyric refinement.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    {[
                                        { title: "Ultra-Creative Mode", desc: "Allows the AI to take more risks with harmony and structure.", icon: Sparkles },
                                        { title: "Direct Instruction", desc: "Strictly follows your prompts without adding creative flair.", icon: Keyboard },
                                        { title: "Real-time Copilot", desc: "AI suggests improvements as you build your track.", icon: Zap },
                                    ].map((pref, i) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight text-sm">{pref.title}</h4>
                                                <p className="text-xs text-white/20 font-medium">{pref.desc}</p>
                                            </div>
                                            <Switch defaultChecked={i === 0} />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Button variant="ghost" className="rounded-2xl text-white/30 hover:text-white h-12 px-8 font-black uppercase text-[10px] tracking-widest transition-all">
                                    Reset Defaults
                                </Button>
                                <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 border-t border-indigo-400/20">
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
