"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Music,
  Activity,
  Sparkles,
  Layers,
  Camera,
  BrainCircuit,
  HeartPulse,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import Hero from "@/components/ui/animated-shader-hero";
import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FeatureAnimationGraphic,
  type FeatureAnimationId,
} from "@/components/landing/FeatureCardAnimations";

const featureTitleFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const WELCOME_DISMISS_KEY = "soundsmith_welcome_dismissed";

const LANDING_FEATURES: {
  title: string;
  label: string;
  description: string;
  icon: LucideIcon;
  animation: FeatureAnimationId;
}[] = [
  {
    title: "Real-time Adaptation",
    label: "DYNAMIC",
    description:
      "Webcam frames are analyzed on a steady cadence; when crowd energy or mood shifts enough, VenIQ surfaces a new Spotify pick automatically so the room never lags behind the moment.",
    icon: Sparkles,
    animation: "clock",
  },
  {
    title: "Emotion Tracking",
    label: "VISION",
    description:
      "Our vision model reads the whole scene—movement, density, and context—not individual faces, and returns structured energy and sentiment that drive which genres and tempos we lean toward.",
    icon: Activity,
    animation: "emotions",
  },
  {
    title: "Therapeutic Layers",
    label: "AUDIO",
    description:
      "Recommendations map calm versus high-energy moods to curated seed genres and pacing, layering a simple therapeutic logic on top of real crowd signal so playback feels intentional, not random.",
    icon: Layers,
    animation: "layers",
  },
  {
    title: "Accessible Design",
    label: "ELDERLY",
    description:
      "The DJ view keeps large type, clear hierarchy, and an obvious override path: you always see what the crowd triggered and can take the deck back in one gesture—built for busy booths and low-friction operation.",
    icon: HeartPulse,
    animation: "access",
  },
];

function FeaturesSection() {
  const reduceMotion = useReducedMotion();
  const [openLabel, setOpenLabel] = React.useState<string | null>(null);

  function toggleFeature(label: string) {
    setOpenLabel((prev) => (prev === label ? null : label));
  }

  return (
    <section
      id="features"
      className="relative z-10 w-full scroll-mt-24 border-t border-white/[0.06] bg-black py-28"
      aria-labelledby="features-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,rgba(99,102,241,0.055),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-6">
        <div className="mb-14 text-center md:mb-16">
          <p
            id="features-heading"
            className="text-[2.5rem] font-black uppercase leading-tight tracking-[0.35em] text-violet-300 antialiased md:text-[3rem] lg:text-[3.75rem]"
          >
            Features
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {LANDING_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            const isOpen = openLabel === feat.label;
            return (
              <motion.article
                key={feat.label}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={`feature-detail-${feat.label}`}
                onClick={() => toggleFeature(feat.label)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleFeature(feat.label);
                  }
                }}
                initial={
                  reduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 32 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-48px" }}
                transition={{
                  duration: 0.6,
                  delay: reduceMotion ? 0 : 0.08 + i * 0.11,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "group relative flex min-h-[340px] cursor-pointer flex-col overflow-hidden rounded-[28px] text-left outline-none",
                  "border border-white/[0.07] bg-[#0a0a0a] p-8",
                  "transition-[transform,border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "hover:-translate-y-1.5 hover:border-violet-500/25 hover:bg-[#0e0e0e]",
                  "hover:shadow-[0_28px_56px_rgba(0,0,0,0.6),0_0_0_1px_rgba(139,92,246,0.12),0_0_48px_-8px_rgba(124,58,237,0.2)]",
                  "focus-visible:border-violet-500/35 focus-visible:ring-2 focus-visible:ring-violet-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  isOpen &&
                    "border-violet-500/30 bg-[#0c0c0c] shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_0_40px_-12px_rgba(124,58,237,0.25)]"
                )}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(109,40,217,0.12) 0%, transparent 48%, rgba(124,58,237,0.08) 100%)",
                  }}
                  aria-hidden
                />
                <div className="relative flex shrink-0 items-start justify-between gap-4">
                  <Icon
                    className={cn(
                      "h-6 w-6 shrink-0 stroke-[1.35] text-violet-300/60 transition-all duration-500 ease-out",
                      "group-hover:translate-y-px group-hover:scale-110 group-hover:text-violet-200"
                    )}
                    strokeWidth={1.35}
                    aria-hidden
                  />
                  <span className="shrink-0 rounded-full border border-violet-500/20 bg-violet-950/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-violet-300/45">
                    {feat.label}
                  </span>
                </div>
                <div className="relative z-[1] my-4 min-h-[120px] w-full flex-1 overflow-hidden rounded-2xl border border-violet-500/12 bg-gradient-to-b from-violet-950/15 to-black/20">
                  <FeatureAnimationGraphic
                    id={feat.animation}
                    reduceMotion={!!reduceMotion}
                  />
                </div>
                <div className="relative z-[1] mt-auto flex shrink-0 items-start justify-between gap-3 pt-1">
                  <h4
                    className={cn(
                      featureTitleFont.className,
                      "min-w-0 flex-1 text-[1.15rem] leading-snug tracking-[-0.01em] text-white md:text-[1.35rem]"
                    )}
                  >
                    {feat.title}
                  </h4>
                  <ChevronDown
                    className={cn(
                      "mt-1 h-5 w-5 shrink-0 text-violet-400/70 transition-transform duration-300 ease-out",
                      isOpen && "rotate-180 text-violet-300"
                    )}
                    aria-hidden
                  />
                </div>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={`feature-detail-${feat.label}`}
                      key="detail"
                      role="region"
                      aria-label={`About ${feat.title}`}
                      initial={
                        reduceMotion
                          ? { height: "auto", opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      animate={{ height: "auto", opacity: 1 }}
                      exit={
                        reduceMotion
                          ? { height: "auto", opacity: 0 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{
                        duration: reduceMotion ? 0 : 0.32,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="relative z-[1] overflow-hidden"
                    >
                      <p
                        className={cn(
                          featureTitleFont.className,
                          "border-t border-violet-500/15 pb-1 pt-4 text-[0.9rem] leading-relaxed text-white/55 md:text-[0.95rem]"
                        )}
                      >
                        {feat.description}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <span
                  className="absolute bottom-8 left-8 h-px w-[calc(100%-4rem)] origin-left scale-x-0 bg-gradient-to-r from-white/45 via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100"
                  aria-hidden
                />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const AnimatedEqualizer = () => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-between px-2 opacity-60 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2%] mx-[0.5%] bg-gradient-to-t from-indigo-500 via-purple-500 to-fuchsia-500 rounded-t-full shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          animate={{ height: ["20%", `${40 + (i * 37 + 13) % 60}%`, "10%", `${20 + (i * 53 + 7) % 70}%`, "30%"] }}
          transition={{ duration: 2 + (i % 5) * 0.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: (i % 7) * 0.28 }}
          style={{ height: "20%" }}
        />
      ))}
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
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
      <nav className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-[#020202]/50 backdrop-blur-2xl z-50 flex items-center px-6 md:px-12">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-2xl uppercase tracking-tighter">V</span>
          </div>
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">Ven<span className="text-white">IQ</span></span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-white/50">
          <a
            href="#features"
            className="hover:text-white cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Features
          </a>
          <a
            href="#use-cases"
            className="hover:text-white cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("use-cases")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Use Cases
          </a>
        </div>
      </nav>

      <AnimatePresence>
        {user && welcomeOpen ? (
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
                <span className="font-mono text-indigo-300">{user.email ?? user.username}</span>
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
          subtitle="VenIQ is a crowd-aware DJ system that reads the room in real time and adapts the music to match the energy of the moment."
          buttons={{
            primary: {
              text: "Start Session",
              onClick: () => router.push('/editor')
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

        {/* Features — dark cards, serif titles, staggered motion */}
        <FeaturesSection />

        {/* Use Cases */}
        <section id="use-cases" className="w-full border-t border-white/5 bg-black scroll-mt-20">
          <div className="w-full max-w-[1200px] mx-auto px-6 py-28">
            <div className="text-center mb-16">
              <p className="text-[2.5rem] font-black uppercase leading-tight tracking-[0.35em] text-violet-300 antialiased md:text-[3rem] lg:text-[3.75rem]">
                Use Cases
              </p>
              <p className="mt-4 text-white/40 max-w-[520px] mx-auto text-base">
                VenIQ adapts to the room — whether that&apos;s a crowded dance floor or a quiet study hall.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Live Events & Clubs",
                  desc: "Track the energy of a crowd in real time. When the room heats up or cools down, VenIQ queues the right track automatically — so the DJ never loses the vibe.",
                  icon: "🎧",
                  tag: "CLUB MODE",
                },
                {
                  title: "Study & Focus Sessions",
                  desc: "Lock In mode watches a single person's posture and expression via face mesh. Tired? Get a calm ambient track. Focused? Stay in flow state with steady lo-fi beats.",
                  icon: "📚",
                  tag: "STUDY MODE",
                },
                {
                  title: "Wellness & Therapy",
                  desc: "Therapeutic audio layers map emotional states to curated genres and tempos — providing gentle, context-aware music that supports mood without overwhelming the senses.",
                  icon: "🌿",
                  tag: "THERAPEUTIC",
                },
                {
                  title: "Accessible Venues",
                  desc: "Built for busy booths and low-friction operation. Large type, clear hierarchy, and a one-tap override so staff can always take control — no training required.",
                  icon: "♿",
                  tag: "ACCESSIBLE",
                },
              ].map((item) => (
                <div
                  key={item.tag}
                  className="flex flex-col gap-4 p-8 rounded-[28px] border border-white/[0.07] bg-[#0a0a0a] hover:border-violet-500/25 hover:bg-[#0e0e0e] transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="rounded-full border border-violet-500/20 bg-violet-950/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-violet-300/45">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
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

