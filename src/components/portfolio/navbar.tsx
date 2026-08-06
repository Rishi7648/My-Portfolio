"use client";

import * as React from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/portfolio/data";
import { cn } from "@/lib/utils";

// Experience section was removed from page.tsx — filter its link out here too,
// so the navbar doesn't scroll to a section that no longer exists.
const VISIBLE_NAV_LINKS = NAV_LINKS.filter((l) => l.href !== "#experience");

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<string>("#home");
  const [hovered, setHovered] = React.useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // Sync active section from URL hash on first load
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hash = window.location.hash;
      if (hash && VISIBLE_NAV_LINKS.some((l) => l.href === hash)) {
        setActive(hash);
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Active section highlighting via IntersectionObserver + URL hash sync
  React.useEffect(() => {
    const sections = VISIBLE_NAV_LINKS.map((l) =>
      document.querySelector(l.href)
    ).filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const newHash = `#${visible[0].target.id}`;
          setActive(newHash);
          // Update the URL bar without triggering a page reload or scroll jump
          window.history.replaceState(null, "", newHash);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu open
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    const closeDesktopMenu = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("resize", closeDesktopMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", closeDesktopMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    setActive(href);
    // Update URL hash immediately on click (before scroll reaches the section)
    window.history.pushState(null, "", href);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={cn(
          "fixed inset-x-0 top-0 z-[75] transition-colors duration-300 pt-[env(safe-area-inset-top)]",
          scrolled
            ? "border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4 lg:gap-4 lg:px-8">
          {/* Catchy Name */}
          <motion.button
            type="button"
            onClick={() => handleNav("#home")}
            // Used !cursor-pointer to force override any global CSS resets that set cursor: default on buttons
            className="group flex shrink-0 !cursor-pointer items-center"
            aria-label="Rishi Silwal — home"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                Rishi.
              </span>
            </span>
          </motion.button>

          {/* Desktop links — shown from lg (1024px) up so tablet-range devices (iPad Mini, Surface Duo, etc.) get the mobile menu instead of a cramped row */}
          <div className="hidden items-center gap-0.5 lg:flex">
            {VISIBLE_NAV_LINKS.map((l) => {
              const isActive = active === l.href;
              const isHovered = hovered === l.href;
              return (
                <motion.button
                  key={l.href}
                  type="button"
                  onClick={() => handleNav(l.href)}
                  onMouseEnter={() => setHovered(l.href)}
                  onMouseLeave={() => setHovered(null)}
                  whileHover={{ y: -3, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    // Used !cursor-pointer to force hand cursor
                    "relative !cursor-pointer overflow-hidden rounded-full px-4 py-2.5 font-display text-base font-semibold tracking-tight transition-colors xl:px-5 xl:text-lg",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Active pill (shared layout across items) */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-primary/10 ring-1 ring-primary/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Hover pill (non-active items only) */}
                  <span
                    className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/5"
                    style={{
                      opacity: isHovered && !isActive ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                  />

                  {/* Gradient underline — slides in on hover, stays on active */}
                  <span
                    className="pointer-events-none absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-primary via-primary/70 to-primary/30"
                    style={{
                      transform: isHovered || isActive ? "scaleX(1)" : "scaleX(0)",
                      opacity: isHovered || isActive ? 1 : 0,
                      transition: "transform 0.3s ease, opacity 0.3s ease",
                      transformOrigin: "left",
                    }}
                  />

                  <span className="relative z-10">{l.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2">
            <motion.button
              type="button"
              onClick={() => setOpen((o) => !o)}
              // Used !cursor-pointer to force hand cursor. Hamburger now covers up to lg (matches desktop nav breakpoint above)
              className="inline-flex h-10 w-10 !cursor-pointer items-center justify-center rounded-full glass sm:h-11 sm:w-11 lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu — covers phones + tablets (up to lg), matching the nav breakpoint above */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[74] bg-background/70 backdrop-blur-md lg:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Slide-in panel from the right — wider on tablets (sm+) since there's more room to use */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-strong fixed bottom-0 right-0 top-0 z-[80] flex h-[100dvh] w-[min(20rem,calc(100vw-1rem))] flex-col overflow-x-hidden shadow-2xl ring-1 ring-primary/10 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:w-96 lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
                <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="glass flex h-10 w-10 !cursor-pointer items-center justify-center rounded-full text-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2 sm:px-4">
                {VISIBLE_NAV_LINKS.map((l, i) => {
                  const isActive = active === l.href;
                  return (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => handleNav(l.href)}
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          // Used !cursor-pointer to force hand cursor
                          "relative flex w-full !cursor-pointer items-center overflow-hidden rounded-2xl px-4 py-3.5 font-display text-lg font-semibold tracking-tight transition-colors sm:px-5 sm:py-4 sm:text-xl",
                          isActive
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                        )}
                      >
                        {/* Active left gradient bar */}
                        {isActive && (
                          <motion.span
                            layoutId="mobileActive"
                            className="absolute bottom-1 left-0 top-1 w-1 rounded-r-full bg-gradient-to-b from-primary to-primary/30"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        <span className="relative z-10">{l.label}</span>
                      </motion.button>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
