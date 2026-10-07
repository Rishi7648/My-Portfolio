"use client";

import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { SpiderCursor } from "@/components/ui/spider-cursor";

const NAME = "Portfolio";
const LETTER_STAGGER = 0.42;
const LETTER_DURATION = 0.72;
const HOLD_AFTER = 1000;
const ENTRANCE_DELAY = 0.6;

const LETTER_STARTS = [
  { x: -56, y: 94, rotate: -28 },
  { x: 34, y: 112, rotate: 22 },
  { x: -28, y: 86, rotate: -18 },
  { x: 48, y: 104, rotate: 26 },
  { x: -42, y: 118, rotate: -24 },
  { x: 30, y: 92, rotate: 16 },
  { x: -22, y: 108, rotate: -20 },
  { x: 52, y: 88, rotate: 24 },
];

const LETTER_START_DELAY = ENTRANCE_DELAY;
const LAST_LETTER_DELAY = LETTER_START_DELAY + (NAME.length - 1) * LETTER_STAGGER;
const TOTAL_REVEAL_TIME = LAST_LETTER_DELAY + LETTER_DURATION;

const COUNTDOWN_DURATION = TOTAL_REVEAL_TIME - ENTRANCE_DELAY;

const letterVariants = {
  hidden: (i = 0) => {
    const start = LETTER_STARTS[i] ?? LETTER_STARTS[0];

    return {
      opacity: 0.18,
      x: start.x,
      y: start.y,
      rotate: start.rotate,
      scale: 0.72,
      filter: "blur(2px)",
    };
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: LETTER_START_DELAY + i * LETTER_STAGGER,
      duration: LETTER_DURATION,
      type: "spring" as const,
      stiffness: 210,
      damping: 16,
      mass: 0.82,
    },
  }),
};

type LoadingScreenProps = {
  onComplete?: () => void;
};

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = React.useState<"active" | "done">("active");
  const letterRefs = React.useRef<Array<HTMLElement | null>>([]);

  const countMV = useMotionValue(100);
  const rounded = useTransform(countMV, (v) => Math.max(0, Math.round(v)).toString());
  const progressWidth = useTransform(
    countMV,
    (v) => `${Math.min(100, Math.max(0, 100 - v))}%`,
  );

  React.useEffect(() => {
    const controls = animate(countMV, 0, {
      duration: COUNTDOWN_DURATION,
      delay: ENTRANCE_DELAY,
      ease: "linear",
      onComplete: () => {
        setTimeout(() => {
          setPhase("done");
          // Fire onComplete right as the curtain starts lifting, so the Hero
          // section animates into view *as* it's revealed, not after.
          onComplete?.();
        }, HOLD_AFTER);
      },
    });
    return () => controls.stop();
  }, [countMV, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="loader"
          // Dropped `w-[100vw]` — `fixed` + `inset-0` already sizes this to
          // fill the viewport exactly. `100vw` can measure wider than the
          // visible viewport when a scrollbar reserves space, which conflicts
          // with `right: 0` from inset-0 and can trigger a stray horizontal
          // scrollbar on desktop-width browsers while this is mounted.
          role="status"
          aria-label="Loading portfolio"
          className="fixed inset-0 z-[100] flex h-[100dvh] cursor-none items-center justify-center overflow-hidden bg-neutral-950"
          initial={{ y: 0 }}
          exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
        >
          <span className="sr-only">Loading portfolio</span>
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle at 16% 12%, rgba(52,211,153,0.1), transparent 28%), radial-gradient(circle at 84% 78%, rgba(245,158,11,0.07), transparent 30%)",
            }}
          />
          <SpiderCursor
            targets={letterRefs}
            sequenceStart={LETTER_START_DELAY}
            sequenceStep={LETTER_STAGGER}
            className="z-10"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] grid-pattern opacity-20" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-blob opacity-15" />

          <div className="relative z-20 inline-block px-4">
            <motion.h1
              className="relative flex justify-center whitespace-nowrap text-center font-display text-[clamp(2.5rem,15vw,9rem)] font-black tracking-tight text-white"
              animate={{ scale: [1, 1, 1.03], transition: { duration: TOTAL_REVEAL_TIME + (HOLD_AFTER/1000), times: [0, 0.8, 1] } }}
              style={{ textShadow: "0 0 52px rgba(255,255,255,0.12)" }}
            >
              {NAME.split("").map((letter, i) => (
                <span
                  key={i}
                  ref={(node) => {
                    letterRefs.current[i] = node;
                  }}
                  className="inline-block will-change-transform"
                >
                  <motion.span
                    custom={i}
                    variants={letterVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-block"
                  >
                    {letter}
                  </motion.span>
                </span>
              ))}

              <motion.span
                initial={{ opacity: 0, x: "-150%" }}
                animate={{ opacity: [0, 1, 0], x: "150%" }}
                transition={{ duration: 0.9, delay: TOTAL_REVEAL_TIME + 0.15, ease: "easeOut" }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 skew-x-[-20deg]"
                style={{
                  background:
                    "linear-gradient(100deg, transparent 20%, oklch(1 0 0 / 0.85) 50%, transparent 80%)",
                  mixBlendMode: "overlay",
                }}
              />
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-4 h-px w-20 origin-center bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent sm:mt-6 sm:w-28"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: ENTRANCE_DELAY, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[max(1rem,5vw)] right-[max(1rem,5vw)] z-20"
          >
            <motion.span
              aria-hidden="true"
              className="block font-display text-[clamp(1.5rem,8vw,6rem)] font-black leading-none tabular-nums text-white"
              animate={{
                opacity: [1, 1, 0],
                transition: {
                  duration: TOTAL_REVEAL_TIME + HOLD_AFTER / 1000,
                  times: [0, 0.85, 1],
                },
              }}
            >
              {rounded}
            </motion.span>
          </motion.div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-200 to-amber-300 shadow-[0_0_14px_rgba(52,211,153,0.75)]"
              style={{ width: progressWidth }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
