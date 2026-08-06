"use client";

import * as React from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "scale" | "fade";

// NOTE on responsiveness: "left" and "right" animate via translateX(±32px).
// CSS transforms move the element visually without affecting layout width,
// so if a section using direction="left"/"right" doesn't have overflow-hidden
// somewhere in its parent chain, narrow viewports can get a brief horizontal
// scrollbar/shift while the reveal plays. This file is fine as-is — the fix
// (if needed) belongs on whichever section wraps the reveal, e.g.:
//   <section className="overflow-hidden"> ... <SectionReveal direction="left"> ...
const offset: Record<Direction, { x?: number; y?: number; scale?: number }> = {
  up: { y: 32 },
  down: { y: -32 },
  left: { x: 32 },
  right: { x: -32 },
  scale: { scale: 0.92 },
  fade: {},
};

type SectionRevealProps = {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
};

export function SectionReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.2,
}: SectionRevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, amount });

  const variants: Variants = {
    hidden: { opacity: 0, ...offset[direction] },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      variants={variants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children must use the `staggerItem` variant */
export function StaggerGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  once = true,
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, amount });

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/** A small reusable section heading block */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left"
      )}
    >
      {eyebrow && (
        <SectionReveal direction="up">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {eyebrow}
          </span>
        </SectionReveal>
      )}
      <SectionReveal direction="up" delay={0.06}>
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </SectionReveal>
      {description && (
        <SectionReveal direction="up" delay={0.12}>
          <p
            className={cn(
              "max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        </SectionReveal>
      )}
    </div>
  );
}
