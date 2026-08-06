"use client";

import * as React from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { SectionHeading, StaggerGroup, staggerItem } from "./section-reveal";

type SkillIcon = {
  name: string;
  image: string;
};

type SkillCategory = {
  label: string;
  items: SkillIcon[];
};

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    label: "Frontend",
    items: [
      { name: "JavaScript", image: "/frontend/js.jpg" },
      { name: "TypeScript", image: "/frontend/ts.jpg" },
      { name: "React", image: "/frontend/react.jpg" },
      { name: "Next.js", image: "/frontend/next.jpg" },
      { name: "Tailwind CSS", image: "/frontend/tailwind.jpg" },
      { name: "WordPress", image: "/frontend/wordpress.jpg" },
      { name: "GSAP", image: "/frontend/gsap.jpg" },
      { name: "Framer Motion", image: "/frontend/framer.jpg" },
      { name: "Bootstrap", image: "/frontend/bs.jpg" },
    ],
  },
  {
    label: "Backend",
    items: [
      { name: "Node.js", image: "/backend/node.jpg" },
      { name: "Express.js", image: "/backend/express.jpg" },
    ],
  },
  {
    label: "Database",
    items: [
      { name: "MySQL", image: "/database/mysql.jpg" },
      { name: "PostgreSQL", image: "/database/post.jpg" },
      { name: "MongoDB", image: "/database/mongo.jpg" },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Git", image: "/tools/git.jpg" },
      { name: "AWS", image: "/tools/aws.jpg" },
    ],
  },
];

// Label spins a full 360° in place, in its normal font/size, centered —
// then settles. Items are timed to appear right after.
const LABEL_SPIN_DURATION = 0.9;

const labelVariants: Variants = {
  hidden: { opacity: 0, rotate: -360, scale: 0.3 },
  show: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: LABEL_SPIN_DURATION,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function SkillPill({ skill }: { skill: SkillIcon }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group inline-flex min-w-0 items-center gap-3 sm:gap-4"
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:h-14 sm:w-14 md:h-16 md:w-16">
        <Image
          src={skill.image}
          alt={skill.name}
          width={64}
          height={64}
          className="h-full w-full object-contain"
        />
      </div>
      <span className="min-w-0 text-pretty font-display text-base font-semibold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary sm:text-lg md:text-xl">
        {skill.name}
      </span>
    </motion.div>
  );
}

function CategoryLabel({ label }: { label: string }) {
  return (
    <motion.span
      variants={labelVariants}
      className="inline-block max-w-full origin-center text-center text-3xl uppercase leading-none tracking-tight min-[375px]:text-4xl md:text-5xl"
      style={{
        fontFamily: "'Anton', sans-serif",
        WebkitTextStroke: "1.5px rgba(23, 23, 23, 0.55)",
        color: "transparent",
      }}
    >
      {label}
    </motion.span>
  );
}

function CategoryBlock({ category, index }: { category: SkillCategory; index: number }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[190px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={{
          hidden: {},
          show: {
            transition: { delayChildren: index * 0.15 },
          },
        }}
        className="flex items-center justify-center"
      >
        <CategoryLabel label={category.label} />
      </motion.div>

      <StaggerGroup
        className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 min-[375px]:grid-cols-2 sm:gap-x-6 sm:gap-y-6 lg:grid-cols-3 lg:gap-x-8"
        stagger={0.06}
        // Items start right after the label finishes its spin-in
        delay={index * 0.15 + LABEL_SPIN_DURATION}
      >
        {category.items.map((skill) => (
          <SkillPill key={skill.name} skill={skill} />
        ))}
      </StaggerGroup>
    </div>
  );
}

export function Skills() {
  return (
    // Added overflow-hidden: the decorative blur circle below is a fixed
    // 30rem (480px) box. Without clipping here, on any viewport narrower
    // than ~480px (most phones) it pokes past the section's edges and
    // creates a horizontal scrollbar/shift — which only shows up on some
    // screen sizes and not others, exactly the "kunai ma mileko hunna" bug.
    <section id="skills" className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
      `}</style>

      {/* Circle size now scales down on small screens instead of staying
          fixed at 30rem, so it never dominates a narrow viewport even
          before clipping kicks in */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/10 via-sky-400/10 to-amber-400/10 blur-3xl sm:h-96 sm:w-96 md:h-[30rem] md:w-[30rem]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={
            <>
              Tools I use to <span className="text-foreground">ship products</span>
            </>
          }
        />

        <div className="mt-10 space-y-12 sm:mt-14 sm:space-y-14 md:mt-16 md:space-y-20">
          {SKILL_CATEGORIES.map((category, index) => (
            <CategoryBlock key={category.label} category={category} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
