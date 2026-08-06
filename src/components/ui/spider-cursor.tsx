"use client";

import * as React from "react";

type SpiderCursorProps = {
  targets: React.RefObject<Array<HTMLElement | null>>;
  sequenceStart: number;
  sequenceStep: number;
  className?: string;
};

type Point = { x: number; y: number };

const APPROACH_LEAD = 0.32;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function ease(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/**
 * Procedural spider/web cursor used by the loading screen. It automatically
 * visits each supplied target, while still reacting slightly to pointer input.
 */
export function SpiderCursor({
  targets,
  sequenceStart,
  sequenceStep,
  className,
}: SpiderCursorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    const startedAt = performance.now();
    let spider: Point = { x: window.innerWidth * 0.12, y: window.innerHeight * 0.24 };
    const pointer = { ...spider, active: false };
    const anchors = Array.from({ length: 84 }, (_, index) => ({
      x: ((index * 47) % 97) / 97,
      y: ((index * 71) % 89) / 89,
      phase: index * 0.83,
    }));

    const resize = () => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      const nextRatio = Math.min(window.devicePixelRatio || 1, 2);

      if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;

      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextRatio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const drawThread = (
      from: Point,
      to: Point,
      time: number,
      phase: number,
      opacity: number,
      lineWidth = 1,
    ) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const wave = Math.min(7, distance * 0.045);

      context.beginPath();
      context.moveTo(from.x, from.y);
      for (let index = 1; index <= 28; index += 1) {
        const progress = index / 28;
        const taper = Math.sin(progress * Math.PI);
        const noise =
          Math.sin(progress * 18 + time * 4.2 + phase) * wave * taper +
          Math.sin(progress * 7 - time * 2.1 + phase) * wave * 0.35 * taper;
        context.lineTo(
          from.x + dx * progress + normalX * noise,
          from.y + dy * progress + normalY * noise,
        );
      }
      context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      context.lineWidth = lineWidth;
      context.stroke();
    };

    const drawSpider = (position: Point, time: number) => {
      context.lineCap = "round";
      context.lineJoin = "round";

      for (const side of [-1, 1]) {
        for (let leg = 0; leg < 4; leg += 1) {
          const vertical = (leg - 1.5) * 6.5;
          const stride = Math.sin(time * 7 + leg * 1.7 + side) * 4;
          const hip = { x: position.x + side * 7, y: position.y + vertical * 0.42 };
          const knee = {
            x: position.x + side * (18 + leg * 2),
            y: position.y + vertical - 9 + stride,
          };
          const foot = {
            x: position.x + side * (31 + leg * 3),
            y: position.y + vertical + 9 - stride * 0.35,
          };

          context.beginPath();
          context.moveTo(hip.x, hip.y);
          context.lineTo(knee.x, knee.y);
          context.lineTo(foot.x, foot.y);
          context.strokeStyle = "rgba(255,255,255,0.92)";
          context.lineWidth = 1.35;
          context.stroke();
        }
      }

      context.save();
      context.translate(position.x, position.y);
      context.rotate(Math.sin(time * 2.4) * 0.08);
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.ellipse(0, 4, 8.5, 12, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(0, -7, 6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#050506";
      context.beginPath();
      context.arc(-2.2, -8, 1.15, 0, Math.PI * 2);
      context.arc(2.2, -8, 1.15, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const render = (now: number) => {
      resize();
      const time = (now - startedAt) / 1000;
      const targetElements = targets.current.filter(
        (target): target is HTMLElement => target !== null,
      );
      const approachStart = Math.max(0, sequenceStart - APPROACH_LEAD);
      const sequenceTime = time - approachStart;
      const rawIndex = Math.floor(Math.max(0, sequenceTime) / sequenceStep);
      const targetIndex =
        sequenceTime >= 0 && targetElements.length > 0
          ? Math.min(rawIndex, targetElements.length - 1)
          : -1;
      const sequenceFinished =
        targetElements.length > 0 &&
        time > sequenceStart + targetElements.length * sequenceStep + 0.25;

      let destination = pointer.active
        ? { x: pointer.x, y: pointer.y }
        : { x: width * 0.15, y: height * 0.24 };
      let activeLetter: Point | null = null;

      if (targetIndex >= 0 && !sequenceFinished) {
        const rect = targetElements[targetIndex].getBoundingClientRect();
        activeLetter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const pointerPull = pointer.active ? 0.06 : 0;
        destination = {
          x: activeLetter.x + Math.sin(time * 5) * 17 + (pointer.x - activeLetter.x) * pointerPull,
          y: activeLetter.y - Math.max(46, rect.height * 0.62) + Math.cos(time * 4) * 7,
        };
      }

      const followSpeed = targetIndex >= 0 && !sequenceFinished ? 0.135 : 0.09;
      spider.x += (destination.x - spider.x) * followSpeed;
      spider.y += (destination.y - spider.y) * followSpeed;

      context.clearRect(0, 0, width, height);

      const nearbyAnchors = anchors
        .map((anchor) => ({
          point: { x: anchor.x * width, y: anchor.y * height },
          phase: anchor.phase,
        }))
        .map((anchor) => ({
          ...anchor,
          distance: Math.hypot(anchor.point.x - spider.x, anchor.point.y - spider.y),
        }))
        .filter((anchor) => anchor.distance < Math.max(210, width * 0.24))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);

      nearbyAnchors.forEach((anchor, index) => {
        const opacity = 0.08 + (1 - anchor.distance / Math.max(210, width * 0.24)) * 0.16;
        drawThread(spider, anchor.point, time, anchor.phase, opacity, index < 3 ? 0.9 : 0.6);
        context.beginPath();
        context.arc(anchor.point.x, anchor.point.y, 1.2, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${opacity + 0.08})`;
        context.fill();
      });

      if (activeLetter && targetIndex >= 0) {
        const grabAt = sequenceStart + targetIndex * sequenceStep;
        const attach = ease((time - grabAt + APPROACH_LEAD * 0.72) / (APPROACH_LEAD * 0.72));
        const release = 1 - ease((time - grabAt - sequenceStep * 0.58) / (sequenceStep * 0.38));
        const strength = Math.max(0, attach * release);

        for (let thread = 0; thread < 5; thread += 1) {
          const spread = (thread - 2) * 3.2;
          drawThread(
            { x: spider.x + spread * 0.35, y: spider.y + 5 },
            { x: activeLetter.x + spread, y: activeLetter.y },
            time,
            thread * 1.31,
            0.25 + strength * 0.68,
            thread === 2 ? 1.65 : 0.85,
          );
        }
      }

      drawSpider(spider, time);
      animationFrame = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [sequenceStart, sequenceStep, targets]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
    />
  );
}
