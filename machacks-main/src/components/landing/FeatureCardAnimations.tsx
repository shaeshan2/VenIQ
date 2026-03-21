"use client";

import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const purpleRing = "rgba(167, 139, 250, 0.35)";

function ClockHand({
  angleDeg,
  length,
  stroke,
  strokeWidth,
  reduceMotion,
  transitionMs,
}: {
  angleDeg: number;
  length: number;
  stroke: string;
  strokeWidth: number;
  reduceMotion: boolean;
  transitionMs: number;
}) {
  return (
    <motion.g
      style={{ transformOrigin: "50px 50px" }}
      animate={{ rotate: angleDeg }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "tween" as const, ease: "linear", duration: transitionMs / 1000 }
      }
    >
      <line
        x1="50"
        y1="50"
        x2="50"
        y2={50 - length}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </motion.g>
  );
}

/** Live analog + digital clock — Real-time Adaptation */
export function AdaptationClock({ reduceMotion }: { reduceMotion: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, reduceMotion ? 1000 : 80);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  const smoothSecond = reduceMotion ? s : s + ms / 1000;
  const hourDeg = ((h % 12) + m / 60 + s / 3600) * 30;
  const minuteDeg = (m + smoothSecond / 60) * 6;
  const secondDeg = smoothSecond * 6;

  return (
    <div className="flex h-full min-h-[112px] w-full flex-col items-center justify-center gap-2 py-1">
      <div className="relative h-[5.5rem] w-[5.5rem]">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full drop-shadow-[0_0_14px_rgba(139,92,246,0.4)]"
          aria-hidden
        >
          <defs>
            <linearGradient id="featClockFace" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="featClockHandGrad" x1="50" y1="50" x2="50" y2="32">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#featClockFace)" stroke={purpleRing} strokeWidth="0.8" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const x1 = 50 + 38 * Math.cos(a - Math.PI / 2);
            const y1 = 50 + 38 * Math.sin(a - Math.PI / 2);
            const x2 = 50 + 42 * Math.cos(a - Math.PI / 2);
            const y2 = 50 + 42 * Math.sin(a - Math.PI / 2);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(196,181,253,0.5)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            );
          })}
          <ClockHand
            angleDeg={hourDeg}
            length={18}
            stroke="url(#featClockHandGrad)"
            strokeWidth={2.4}
            reduceMotion={reduceMotion}
            transitionMs={400}
          />
          <ClockHand
            angleDeg={minuteDeg}
            length={24}
            stroke="#a78bfa"
            strokeWidth={1.7}
            reduceMotion={reduceMotion}
            transitionMs={200}
          />
          <ClockHand
            angleDeg={secondDeg}
            length={28}
            stroke="#f5d0fe"
            strokeWidth={1}
            reduceMotion={reduceMotion}
            transitionMs={80}
          />
          <circle cx="50" cy="50" r="3.2" fill="#13101c" stroke="#a78bfa" strokeWidth="0.85" />
        </svg>
      </div>
      <p
        className="font-mono text-[11px] tabular-nums tracking-wider text-violet-200/90"
        aria-live="polite"
        aria-atomic="true"
      >
        {String(h).padStart(2, "0")}
        <span className="mx-0.5 text-violet-500/75">:</span>
        {String(m).padStart(2, "0")}
        <span className="mx-0.5 text-violet-500/75">:</span>
        {String(s).padStart(2, "0")}
      </p>
    </div>
  );
}

const EMOTION_EMOJIS = ["😊", "😐", "😌", "🥹", "🤗", "😮", "💜", "✨", "🌙", "💭"];

/** Emojis drifting right → left on a loop — Emotion Tracking */
export function EmotionEmojiStream({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      className="relative h-[112px] w-full overflow-hidden rounded-xl border border-violet-500/15 bg-gradient-to-b from-violet-950/25 via-transparent to-purple-950/10"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
      {EMOTION_EMOJIS.map((emoji, i) => {
        const row = i % 3;
        const topPct = 14 + row * 26;
        const duration = 8 + (i % 5) * 1.2;
        const delay = i * 0.7;

        return (
          <motion.span
            key={`${emoji}-${i}`}
            className="absolute text-[1.25rem] leading-none will-change-transform"
            style={{
              top: `${topPct}%`,
              left: "100%",
              marginLeft: 8,
              filter: "drop-shadow(0 0 12px rgba(167, 139, 250, 0.55))",
            }}
            initial={false}
            animate={reduceMotion ? { x: -96 } : { x: [0, -340] }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration,
                    repeat: Infinity,
                    ease: "linear",
                    delay,
                  }
            }
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
}

/** Stacked chroma bands that breathe in sequence — Therapeutic Layers */
export function TherapeuticLayersAnim({ reduceMotion }: { reduceMotion: boolean }) {
  const layers = [
    "from-indigo-600/55 via-violet-500/75 to-purple-600/55",
    "from-violet-600/45 via-purple-500/65 to-fuchsia-500/45",
    "from-purple-600/50 via-fuchsia-500/60 to-indigo-600/50",
    "from-fuchsia-600/40 via-indigo-500/55 to-violet-600/40",
  ];

  return (
    <div className="flex h-[112px] w-full flex-col justify-center gap-2.5 px-1 py-2" aria-hidden>
      {layers.map((grad, i) => (
        <motion.div
          key={i}
          className={cn(
            "h-2 w-full rounded-full bg-gradient-to-r shadow-[0_0_18px_rgba(139,92,246,0.3)]",
            grad
          )}
          initial={false}
          animate={
            reduceMotion
              ? { scaleX: 0.82, opacity: 0.7 }
              : {
                  scaleX: [0.32, 1, 0.4, 0.92, 0.32],
                  opacity: [0.3, 0.95, 0.45, 0.88, 0.3],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.45,
                }
          }
          style={{ transformOrigin: "center" }}
        />
      ))}
    </div>
  );
}

/** Care ripples + soft rhythm dots — Accessible Design */
export function AccessibleDesignAnim({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative flex h-[112px] w-full items-center justify-center" aria-hidden>
      <motion.div
        className="absolute flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/[0.14] shadow-[0_0_28px_rgba(139,92,246,0.3)]"
        animate={
          reduceMotion ? undefined : { scale: [1, 1.05, 1], opacity: [0.88, 1, 0.88] }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <HeartPulse className="h-6 w-6 text-violet-200" strokeWidth={1.35} />
      </motion.div>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute h-14 w-14 rounded-full border border-purple-400/30"
          initial={false}
          animate={
            reduceMotion ? { scale: 1.5, opacity: 0 } : { scale: [1, 2.4], opacity: [0.38, 0] }
          }
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.83,
          }}
        />
      ))}
      <div className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5 opacity-70">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="h-1 w-3 rounded-full bg-violet-400/60"
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.2, 1, 0.2], scaleY: [1, 1.8, 1] }
            }
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export type FeatureAnimationId = "clock" | "emotions" | "layers" | "access";

export function FeatureAnimationGraphic({
  id,
  reduceMotion,
}: {
  id: FeatureAnimationId;
  reduceMotion: boolean;
}) {
  switch (id) {
    case "clock":
      return <AdaptationClock reduceMotion={reduceMotion} />;
    case "emotions":
      return <EmotionEmojiStream reduceMotion={reduceMotion} />;
    case "layers":
      return <TherapeuticLayersAnim reduceMotion={reduceMotion} />;
    case "access":
      return <AccessibleDesignAnim reduceMotion={reduceMotion} />;
    default:
      return null;
  }
}
