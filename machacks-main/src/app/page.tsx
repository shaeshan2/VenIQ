"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Music, Activity, Sparkles, Layers, Camera, BrainCircuit, HeartPulse, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Hero from "@/components/ui/animated-shader-hero";
import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const WELCOME_DISMISS_KEY = "soundsmith_welcome_dismissed";

export default function LandingPage() {
  const router = useRouter();
  const { user, isReady, logout, openSignIn } = useAuth();
  const [welcomeOpen, setWelcomeOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setWelcomeOpen(false);
      return;
    }
    if (typeof window !== "undefined" && sessionStorage.getItem(WELCOME_DISMISS_KEY) === "1") {
      setWelcomeOpen(false);
      return;
    }
    setWelcomeOpen(true);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#020202] text-white overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Nav inside generic page layout */}
      <nav className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-[#020202]/50 backdrop-blur-2xl z-50 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-2xl uppercase tracking-tighter">S</span>
          </div>
          <span className="font-black text-2xl tracking-tight text-white group-hover:text-indigo-200 transition-colors">SoundSmith</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-white/50">
          <span className="hover:text-white cursor-pointer transition-colors">Features</span>
          <span className="hover:text-white cursor-pointer transition-colors">Use Cases</span>
          <span className="hover:text-white cursor-pointer transition-colors">Pricing</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          {!isReady ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="hidden h-10 w-28 animate-pulse rounded-full bg-white/10 sm:block" />
            </div>
          ) : user ? (
            <>
              <span className="hidden min-w-0 sm:block">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-400/90">
                  Welcome
                </span>
                <span className="block truncate font-mono text-sm font-semibold text-white/90">
                  {user.username}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  logout();
                  setWelcomeOpen(false);
                  toast.message("Signed out", { description: "See you next time." });
                }}
                className="h-9 rounded-full px-4 text-xs font-bold uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={openSignIn}
              className="h-9 rounded-full px-3 text-xs font-bold uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
            >
              Sign in
            </Button>
          )}
          <Button
            onClick={() => router.push('/editor')}
            className="rounded-full bg-white text-black hover:bg-gray-100 font-black uppercase text-[10px] tracking-widest h-10 px-6 transition-all hover:scale-105 active:scale-95"
          >
            Get Started
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {user && welcomeOpen && isReady ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-none fixed top-20 left-0 right-0 z-40 flex justify-center px-4"
          >
            <div className="pointer-events-auto mt-3 flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-black/70 py-2.5 pl-5 pr-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)] shadow-indigo-500/10 backdrop-blur-xl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/20 ring-1 ring-indigo-500/30">
                <Sparkles className="h-5 w-5 text-indigo-300" />
              </div>
              <p className="min-w-0 flex-1 text-sm leading-snug text-white/90">
                <span className="font-bold text-white">Welcome!</span>{" "}
                <span className="text-white/50">You&apos;re signed in as</span>{" "}
                <span className="font-mono text-indigo-300">{user.username}</span>
                <span className="text-white/40"> — start a session when you&apos;re ready.</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(WELCOME_DISMISS_KEY, "1");
                  setWelcomeOpen(false);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/35 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Dismiss welcome message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="flex-1 w-full flex flex-col items-center">
        <Hero
          headline={{
            line1: "Music that",
            line2: "understands you."
          }}
          subtitle="SoundSmith is an adaptive music therapy system that listens to your emotions and reshapes music in real time to heal, calm, and support."
          buttons={{
            primary: {
              text: "Start Session",
              onClick: () => router.push('/editor')
            },
            secondary: {
              text: "Learn More",
              onClick: () => console.log("Watch Demo")
            }
          }}
        />

        {/* Steps Section with Equalizer Background */}
        <section className="w-full relative overflow-hidden border-t border-white/5">
          <AnimatedEqualizer />
          <div className="w-full max-w-[1200px] mx-auto px-6 py-24 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">Heal in 3 Steps</h2>
              <p className="text-white/40 max-w-[500px] mx-auto">An accessible, privacy-first system designed to comfort you when you need it most.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "01", title: "Start Session", desc: "Open the camera. The system begins safely analyzing your mood without storing facial data.", icon: Camera },
                { step: "02", title: "AI Analysis", desc: "Our Gemini-powered engine classifies your mood into emotional archetypes in real-time.", icon: BrainCircuit },
                { step: "03", title: "Adaptive Playback", desc: "Tempo shifts, warm instruments fade in, and music adapts dynamically.", icon: Music }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-6 p-8 rounded-[32px] bg-black/80 backdrop-blur-2xl border border-white/10 hover:border-indigo-500/30 hover:bg-black/90 transition-all shadow-2xl relative z-20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-4xl font-black text-white/10 font-mono tracking-tighter">{item.step}</h3>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <item.icon className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-[1200px] px-6 py-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Real-time Adaptation", label: "DYNAMIC", icon: Sparkles },
              { title: "Emotion Tracking", label: "VISION", icon: Activity },
              { title: "Therapeutic Layers", label: "AUDIO", icon: Layers },
              { title: "Accessible Design", label: "ELDERLY", icon: HeartPulse }
            ].map((feat, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-black border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between min-h-[220px] group">
                <div className="flex justify-between items-start">
                  <feat.icon className="w-6 h-6 text-white/30 group-hover:text-white transition-colors" />
                  <span className="text-[9px] font-black tracking-widest uppercase text-white/20 bg-white/5 px-2 py-1 rounded-sm">{feat.label}</span>
                </div>
                <h4 className="text-xl font-bold text-white tracking-tight">{feat.title}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-40 flex flex-col items-center text-center border-t border-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)] relative z-10">
          <h2 className="text-5xl font-black tracking-tighter text-white mb-8">Ready to feel better?</h2>
          <Button
            onClick={() => router.push('/editor')}
            className="h-16 px-10 rounded-full bg-white text-black hover:bg-gray-100 font-black uppercase text-sm tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
          >
            Start Session
          </Button>
        </section>
      </main>
    </div>
  );
}

const AnimatedEqualizer = () => {
  // Use a stable state to prevent hydration mismatches with random heights
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-between px-2 opacity-60 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2%] mx-[0.5%] bg-gradient-to-t from-indigo-500 via-purple-500 to-fuchsia-500 rounded-t-full shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          animate={{
            height: ["20%", `${Math.random() * 60 + 40}%`, "10%", `${Math.random() * 80 + 20}%`, "30%"],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
          style={{
            height: "20%"
          }}
        />
      ))}
    </div>
  );
};
