"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { SectionReveal } from "./section-reveal";
import { Globe } from "@/components/ui/globe";

/* ---------- AnimatedParagraph ---------- */
interface AnimatedParagraphProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedParagraph: React.FC<AnimatedParagraphProps> = ({ text, className, style }) => {
  const ref = React.useRef<HTMLParagraphElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const words = text.split(" ");

  return (
    <p ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.5,
            delay: i * 0.04,
            ease: [0.22, 1, 0.36, 1],
          }}
          // break-words prevents long/unbroken words from overflowing
          // the container on very narrow (<360px) screens
          className="inline-block whitespace-pre break-words"
        >
          {word}{" "}
        </motion.span>
      ))}
    </p>
  );
};

/* ---------- About section ---------- */
export function About() {
  return (
    <section id="about" className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      {/* px-4 on the smallest screens instead of a flat px-6 */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-12 lg:items-start lg:gap-4">
          {/* LEFT: Text + Stats — negative right margin pulls text INTO the gap toward globe (lg+ only) */}
          <div className="lg:col-span-8 lg:-mr-8">
            <AnimatedParagraph
              className="text-lg leading-relaxed text-pretty sm:text-xl md:text-2xl text-neutral-950"
              style={{
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 700,
              }}
              text="I'm Rishi Silwal — a Front-End Developer at WildStone Solution, focused on creating modern, high-performing websites that help businesses establish a strong digital presence. I specialize in building business websites, portfolio sites, blogs, and custom web solutions tailored to unique goals and requirements. With a strong emphasis on performance, SEO, responsiveness, and user experience, I strive to deliver websites that are both visually engaging and results-driven. My approach is centered on collaboration, quality, and long-term value, ensuring every project contributes to sustainable business growth."
            />

            {/* Stats cards — 1 col on phones, 2 from 480px, 3 from sm up.
                Previously used `xs:` which is NOT a default Tailwind breakpoint —
                replaced with the arbitrary `min-[480px]:` variant so it works
                without needing a custom tailwind.config screen. */}
          </div>

          {/* RIGHT: Sticky Globe — centered on mobile, pushed right on desktop */}
          <div className="lg:col-span-4">
            <div className="flex justify-center lg:sticky lg:top-24 lg:flex lg:justify-end">
              <SectionReveal direction="up" delay={0.24}>
                <div className="relative mx-auto w-full max-w-[14rem] min-[480px]:max-w-[16rem] sm:max-w-[18rem] lg:mx-0 xl:translate-x-12">
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/20 to-amber-400/20 blur-3xl" />
                  <Globe className="opacity-90" />
                </div>
              </SectionReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
