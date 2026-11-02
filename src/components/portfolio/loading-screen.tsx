"use client";

import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

const SpiderCursor = React.lazy(() =>
  import("@/components/ui/spider-cursor").then((m) => ({ default: m.SpiderCursor }))
);

const NAME = "Portfolio";

// Desktop timing
const DESKTOP_LETTER_STAGGER = 0.42;
const DESKTOP_LETTER_DURATION = 0.72;
const DESKTOP_HOLD_AFTER = 1000;
const DESKTOP_ENTRANCE_DELAY = 0.6;

// Mobile timing — faster so the user isn't waiting
const MOBILE_LETTER_STAGGER = 0.12;
const MOBILE_LETTER_DURATION = 0.5;
const MOBILE_HOLD_AFTER = 600;
const MOBILE_ENTRANCE_DELAY = 0.3;

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

// Detect mobile at module level for SSR safety — defaults to false,
// corrected in the component's first effect.
function getIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || "ontouchstart" in window;
}

function getTimings(mobile: boolean) {
  const LETTER_STAGGER = mobile ? MOBILE_LETTER_STAGGER : DESKTOP_LETTER_STAGGER;
  const LETTER_DURATION = mobile ? MOBILE_LETTER_DURATION : DESKTOP_LETTER_DURATION;
  const HOLD_AFTER = mobile ? MOBILE_HOLD_AFTER : DESKTOP_HOLD_AFTER;
  const ENTRANCE_DELAY = mobile ? MOBILE_ENTRANCE_DELAY : DESKTOP_ENTRANCE_DELAY;
  const LETTER_START_DELAY = ENTRANCE_DELAY;
  const LAST_LETTER_DELAY = LETTER_START_DELAY + (NAME.length - 1) * LETTER_STAGGER;
  const TOTAL_REVEAL_TIME = LAST_LETTER_DELAY + LETTER_DURATION;
  const COUNTDOWN_DURATION = TOTAL_REVEAL_TIME - ENTRANCE_DELAY;
  return { LETTER_STAGGER, LETTER_DURATION, HOLD_AFTER, ENTRANCE_DELAY, LETTER_START_DELAY, TOTAL_REVEAL_TIME, COUNTDOWN_DURATION };
}

function makeLetterVariants(mobile: boolean) {
  const { LETTER_START_DELAY, LETTER_STAGGER, LETTER_DURATION } = getTimings(mobile);
  // On mobile: smaller scatter offsets, no blur (blur animation kills
  // iOS Safari perf), tween instead of spring for lighter CPU load.
  return {
    hidden: (i = 0) => {
      const start = LETTER_STARTS[i] ?? LETTER_STARTS[0];
      return mobile
        ? { opacity: 0, x: start.x * 0.4, y: start.y * 0.4, rotate: start.rotate * 0.5, scale: 0.85 }
        : { opacity: 0.18, x: start.x, y: start.y, rotate: start.rotate, scale: 0.72, filter: "blur(2px)" };
    },
    visible: (i: number) => mobile
      ? {
          opacity: 1, x: 0, y: 0, rotate: 0, scale: 1,
          transition: {
            delay: LETTER_START_DELAY + i * LETTER_STAGGER,
            duration: LETTER_DURATION,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }
      : {
          opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)",
          transition: {
            delay: LETTER_START_DELAY + i * LETTER_STAGGER,
            duration: LETTER_DURATION,
            type: "spring" as const,
            stiffness: 210,
            damping: 16,
            mass: 0.82,
          },
        },
  };
}

type LoadingScreenProps = {
  onComplete?: () => void;
};

// Maximum time (ms) to wait before force-dismissing the loader,
// regardless of animation state. Prevents the user from being stuck
// forever if an animation callback fails to fire on a slow device.
const MAX_LOADER_TIME = 8000;

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = React.useState<"active" | "done">("active");
  const [isMobile, setIsMobile] = React.useState(false);
  const letterRefs = React.useRef<Array<HTMLElement | null>>([]);
  const hasFired = React.useRef(false);

  // Detect mobile on mount
  React.useEffect(() => {
    setIsMobile(getIsMobile());
  }, []);

  const timings = getTimings(isMobile);
  const variants = React.useMemo(() => makeLetterVariants(isMobile), [isMobile]);

  const countMV = useMotionValue(100);
  const rounded = useTransform(countMV, (v) => Math.max(0, Math.round(v)).toString());
  const progressWidth = useTransform(
    countMV,
    (v) => `${Math.min(100, Math.max(0, 100 - v))}%`,
  );

  const finish = React.useCallback(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    setPhase("done");
    onComplete?.();
  }, [onComplete]);

  // Main countdown animation
  React.useEffect(() => {
    const controls = animate(countMV, 0, {
      duration: timings.COUNTDOWN_DURATION,
      delay: timings.ENTRANCE_DELAY,
      ease: "linear",
      onComplete: () => {
        setTimeout(finish, timings.HOLD_AFTER);
      },
    });
    return () => controls.stop();
  }, [countMV, timings, finish]);

  // Safety timeout — force-dismiss loader if animation gets stuck
  React.useEffect(() => {
    const timer = setTimeout(finish, MAX_LOADER_TIME);
    return () => clearTimeout(timer);
  }, [finish]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="loader"
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

          {/* SpiderCursor: only on desktop — it's a mouse-based interaction
              and its 60fps procedural canvas (spider body + 8 articulated legs
              + silk threads) tanks performance on mobile GPUs, blocking
              framer-motion from running the letter animations. */}
          {!isMobile && (
            <React.Suspense fallback={null}>
              <SpiderCursor
                targets={letterRefs}
                sequenceStart={timings.LETTER_START_DELAY}
                sequenceStep={timings.LETTER_STAGGER}
                className="z-10"
              />
            </React.Suspense>
          )}

          <div className="pointer-events-none absolute inset-0 z-[1] grid-pattern opacity-20" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-blob opacity-15" />

          <div className="relative z-20 inline-block px-4">
            <motion.h1
              className="relative flex justify-center whitespace-nowrap text-center font-display text-[clamp(2.5rem,15vw,9rem)] font-black tracking-tight text-white"
              animate={{ scale: [1, 1, 1.03], transition: { duration: timings.TOTAL_REVEAL_TIME + (timings.HOLD_AFTER/1000), times: [0, 0.8, 1] } }}
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
                    variants={variants}
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
                transition={{ duration: 0.9, delay: timings.TOTAL_REVEAL_TIME + 0.15, ease: "easeOut" }}
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
            transition={{ duration: timings.ENTRANCE_DELAY, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[max(1rem,5vw)] right-[max(1rem,5vw)] z-20"
          >
            <motion.span
              aria-hidden="true"
              className="block font-display text-[clamp(1.5rem,8vw,6rem)] font-black leading-none tabular-nums text-white"
              animate={{
                opacity: [1, 1, 0],
                transition: {
                  duration: timings.TOTAL_REVEAL_TIME + timings.HOLD_AFTER / 1000,
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
