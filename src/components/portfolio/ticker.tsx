"use client";
import * as React from "react";
import { motion } from "framer-motion";

const TICKER_ITEMS = [
  "FRONT-END DEVELOPER",
  "UI/UX DESIGNER"

  

];

// Controls scroll speed — higher number = faster scroll
const PIXELS_PER_SECOND = 150;

export function Ticker() {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null); // outer container (viewport)
  const firstItemRef = React.useRef<HTMLSpanElement | null>(null); // first item in the very first set
  const secondSetFirstItemRef = React.useRef<HTMLSpanElement | null>(null); // first item in the 2nd repeated set

  const [repeatCount, setRepeatCount] = React.useState(4); // how many times to repeat the item list
  const [scrollDistance, setScrollDistance] = React.useState(0); // exact px distance for one seamless loop
  const [duration, setDuration] = React.useState(20); // animation duration, derived from distance + speed

  React.useEffect(() => {
    function measure() {
      if (
        !wrapperRef.current ||
        !firstItemRef.current ||
        !secondSetFirstItemRef.current
      )
        return;

      const wrapperWidth = wrapperRef.current.offsetWidth;

      // Get real on-screen positions of the first item and the first item of the
      // next repeated set. The gap between them (including flex gap) is the exact
      // distance we need to scroll for a perfectly seamless loop.
      const rect1 = firstItemRef.current.getBoundingClientRect();
      const rect2 = secondSetFirstItemRef.current.getBoundingClientRect();
      const distance = rect2.left - rect1.left;
      if (distance <= 0) return;

      // Make sure we render enough repeated sets to always cover the wrapper width,
      // even on very wide screens, so there's never an empty gap at the end.
      const needed = Math.ceil((wrapperWidth * 2) / distance) + 1;

      setScrollDistance(distance);
      setRepeatCount(Math.max(needed, 2));
      setDuration(distance / PIXELS_PER_SECOND);
    }

    // Debounced so rapid resize events (window drag, mobile orientation
    // change) don't trigger a re-measure on every single event — this was
    // causing a small jank/flicker on mobile when rotating the device.
    let resizeTimeout: ReturnType<typeof setTimeout>;
    function debouncedMeasure() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(measure, 150);
    }

    measure();
    window.addEventListener("resize", debouncedMeasure);

    // Bebas Neue loads asynchronously from Google Fonts — re-measure once it's
    // actually loaded, since font metrics can shift item widths.
    document.fonts?.ready.then(measure);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedMeasure);
    };
  }, []);

  // Build the final list of items to render based on the calculated repeat count
  const items = Array.from({ length: repeatCount }).flatMap(() => TICKER_ITEMS);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          /* Use the exact measured pixel distance instead of a fixed % —
             this is what removes the jump/jerk on loop restart */
          100% { transform: translateX(-${scrollDistance}px); }
        }

        .ticker-track {
          animation: ticker-scroll ${duration}s linear infinite;
          will-change: transform;
        }

        /* Pause scrolling on hover */
        .ticker-wrapper:hover .ticker-track {
          animation-play-state: paused;
        }

        /* Respect user's reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
        }
      `}</style>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-4 border-y border-neutral-950 bg-white py-2 sm:mt-8 sm:py-2.5"
        aria-label="Skills ticker"
      >
        <div ref={wrapperRef} className="ticker-wrapper overflow-hidden">
          <div className="ticker-track flex w-max items-center gap-x-6 whitespace-nowrap sm:gap-x-10">
            {items.map((item, i) => {
              const isFilled = i % 2 === 0; // alternate solid / outline style
              const isFirstItem = i === 0;
              const isSecondSetFirstItem = i === TICKER_ITEMS.length;

              return (
                <span
                  key={`${item}-${i}`}
                  // Attach refs only to the two items we need for measurement
                  ref={
                    isFirstItem
                      ? firstItemRef
                      : isSecondSetFirstItem
                      ? secondSetFirstItemRef
                      : null
                  }
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    WebkitTextStroke: isFilled ? undefined : "1.5px #000",
                  }}
                  className={[
                    "uppercase tracking-tight",
                    "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
                    isFilled ? "text-neutral-950" : "text-transparent",
                  ].join(" ")}
                >
                  {item}
                </span>
              );
            })}
          </div>
        </div>
      </motion.section>
    </>
  );
}