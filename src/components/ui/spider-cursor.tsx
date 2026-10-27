"use client";

import * as React from "react";

type SpiderCursorProps = {
  targets: React.RefObject<Array<HTMLElement | null>>;
  sequenceStart: number;
  sequenceStep: number;
  className?: string;
};

type Point = { x: number; y: number };
type TrailPoint = Point & { createdAt: number };
type Ripple = Point & { createdAt: number };

const APPROACH_LEAD = 0.32;
const TAU = Math.PI * 2;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function ease(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function shortestAngle(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
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
    let heading = Math.PI * 0.35;
    const pointer = { ...spider, active: false, pressedUntil: 0 };
    let trail: TrailPoint[] = [];
    let ripples: Ripple[] = [];
    let lastTrailAt = 0;
    const plantedFeet: Array<Point | null> = Array.from({ length: 8 }, () => null);

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

    const onPointerDown = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      pointer.pressedUntil = performance.now() + 420;
      ripples = [...ripples.slice(-2), { x: event.clientX, y: event.clientY, createdAt: performance.now() }];
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const drawThread = (
      from: Point,
      to: Point,
      time: number,
      phase: number,
      opacity: number,
      lineWidth = 1,
      tautness = 0,
    ) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const wave = Math.min(4.5, distance * 0.028) * (1 - tautness * 0.86);
      const sag = Math.min(10, distance * 0.034) * (1 - tautness);

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
          from.y + dy * progress + normalY * noise + sag * taper,
        );
      }
      const silkGradient = context.createLinearGradient(from.x, from.y, to.x, to.y);
      silkGradient.addColorStop(0, `rgba(178, 255, 226, ${opacity * 0.58})`);
      silkGradient.addColorStop(0.48, `rgba(255, 255, 255, ${opacity})`);
      silkGradient.addColorStop(1, `rgba(255, 222, 173, ${opacity * 0.52})`);
      context.strokeStyle = silkGradient;
      context.lineWidth = lineWidth;
      context.stroke();
    };

    const drawSpider = (
      position: Point,
      time: number,
      rotation: number,
      movement: number,
      lookAt: Point | null,
      press: number,
    ) => {
      const scale = clamp(Math.min(width, height) / 535, 1.16, 1.7);
      const gait = time * (5.4 + movement * 4.8);
      const recoil = Math.sin((1 - press) * Math.PI) * (press > 0 ? 0.11 : 0);
      const breath = Math.sin(time * 2.15) * 0.016;
      const lookAngle = lookAt
        ? Math.atan2(lookAt.y - position.y, lookAt.x - position.x) - rotation
        : -Math.PI / 2;
      const eyeShift = {
        x: Math.cos(lookAngle) * 0.28,
        y: Math.sin(lookAngle) * 0.28,
      };

      context.save();
      context.translate(position.x, position.y);
      context.rotate(rotation);
      context.scale(
        scale * (1 + recoil + breath),
        scale * (1 - recoil * 0.5 - breath * 0.55),
      );
      context.lineCap = "round";
      context.lineJoin = "round";

      // The soft contact shadow gives the spider weight while the highlighted
      // hairs keep its dark silhouette visible on the near-black loader.
      context.save();
      context.translate(3, 7);
      context.filter = "blur(5px)";
      context.fillStyle = "rgba(0, 0, 0, 0.72)";
      context.beginPath();
      context.ellipse(0, 1, 27, 15, 0, 0, TAU);
      context.fill();
      context.restore();

      const legRoots = [-8.5, -3, 4, 10];
      const legFeet = [
        { x: 41, y: -27 },
        { x: 47, y: -9 },
        { x: 46, y: 17 },
        { x: 37, y: 32 },
      ];

      const localToWorld = (point: Point): Point => ({
        x:
          position.x +
          (Math.cos(rotation) * point.x - Math.sin(rotation) * point.y) * scale,
        y:
          position.y +
          (Math.sin(rotation) * point.x + Math.cos(rotation) * point.y) * scale,
      });

      const worldToLocal = (point: Point): Point => {
        const dx = (point.x - position.x) / scale;
        const dy = (point.y - position.y) / scale;
        return {
          x: Math.cos(rotation) * dx + Math.sin(rotation) * dy,
          y: -Math.sin(rotation) * dx + Math.cos(rotation) * dy,
        };
      };

      for (const side of [-1, 1]) {
        for (let leg = 0; leg < 4; leg += 1) {
          const footIndex = (side === -1 ? 0 : 4) + leg;
          const phase = leg * Math.PI + (side === 1 ? 0 : Math.PI);
          const stepWave = Math.max(0, Math.sin(gait + phase));
          const hip = { x: side * 5.5, y: legRoots[leg] };
          const coxa = {
            x: side * (10.5 + (leg === 1 || leg === 2 ? 1.5 : 0)),
            y: legRoots[leg] + (leg - 1.5) * 1.4,
          };
          const desiredLocal = {
            x: side * legFeet[leg].x,
            y: legFeet[leg].y,
          };
          const desiredWorld = localToWorld(desiredLocal);

          if (!plantedFeet[footIndex]) {
            plantedFeet[footIndex] = desiredWorld;
          }

          const planted = plantedFeet[footIndex] as Point;
          const plantDistance = Math.hypot(
            desiredWorld.x - planted.x,
            desiredWorld.y - planted.y,
          );
          const isStepping = movement > 0.025 && stepWave > 0.12 && plantDistance > 2.5;
          if (isStepping || plantDistance > 34) {
            const catchUp = plantDistance > 34 ? 0.38 : 0.16 + stepWave * 0.16;
            planted.x += (desiredWorld.x - planted.x) * catchUp;
            planted.y += (desiredWorld.y - planted.y) * catchUp;
          }

          const plantedLocal = worldToLocal(planted);
          const footLift = isStepping ? Math.sin(stepWave * Math.PI) * 3.2 : 0;
          const foot = {
            x: plantedLocal.x - side * footLift,
            y: plantedLocal.y - footLift * 0.3,
          };

          context.save();
          context.filter = "blur(1.8px)";
          context.fillStyle = `rgba(0, 0, 0, ${0.5 - Math.min(0.34, footLift * 0.08)})`;
          context.beginPath();
          context.ellipse(foot.x + 1.2, foot.y + 1.8, 4.2, 1.55, 0, 0, TAU);
          context.fill();
          context.restore();

          const knee = {
            x: side * Math.max(19, Math.abs(foot.x) * 0.56),
            y: coxa.y + (foot.y - coxa.y) * 0.47 + (leg - 1.5) * 1.6,
          };
          const ankle = {
            x: knee.x + (foot.x - knee.x) * 0.7,
            y: knee.y + (foot.y - knee.y) * 0.72,
          };

          const segments = [
            { from: hip, to: coxa, width: 5.2 },
            { from: coxa, to: knee, width: 4.7 },
            { from: knee, to: ankle, width: 3.7 },
            { from: ankle, to: foot, width: 2.25 },
          ];
          const legLight = context.createLinearGradient(hip.x, hip.y, foot.x, foot.y);
          legLight.addColorStop(0, "rgba(230, 199, 160, 0.62)");
          legLight.addColorStop(0.48, "rgba(112, 76, 50, 0.78)");
          legLight.addColorStop(1, "rgba(225, 192, 151, 0.28)");

          segments.forEach((segment, segmentIndex) => {
            context.beginPath();
            context.moveTo(segment.from.x, segment.from.y);
            context.lineTo(segment.to.x, segment.to.y);
            context.strokeStyle = "rgba(7, 5, 4, 0.99)";
            context.lineWidth = segment.width;
            context.stroke();

            context.strokeStyle = legLight;
            context.lineWidth = Math.max(0.6, 1.1 - segmentIndex * 0.13);
            context.stroke();
          });

          context.fillStyle = "rgba(44, 32, 24, 0.96)";
          context.beginPath();
          context.arc(knee.x, knee.y, 2.15, 0, TAU);
          context.fill();
          context.beginPath();
          context.arc(ankle.x, ankle.y, 1.45, 0, TAU);
          context.fill();

          context.strokeStyle = "rgba(238, 220, 191, 0.34)";
          context.lineWidth = 0.55;
          for (let hair = 0; hair < 5; hair += 1) {
            const progress = 0.12 + hair * 0.17;
            const hairX = knee.x + (foot.x - knee.x) * progress;
            const hairY = knee.y + (foot.y - knee.y) * progress;
            context.beginPath();
            context.moveTo(hairX, hairY);
            context.lineTo(hairX + side * (2.1 + (hair % 2)), hairY - 1.5 + hair * 0.42);
            context.stroke();
          }

          context.beginPath();
          context.moveTo(foot.x, foot.y);
          context.lineTo(foot.x + side * 3.2, foot.y - 0.8);
          context.strokeStyle = "rgba(235, 218, 193, 0.42)";
          context.lineWidth = 0.55;
          context.stroke();
        }
      }

      // Pedipalps twitch independently in front of the head.
      for (const side of [-1, 1]) {
        const twitch = Math.sin(time * 5.2 + side) * 1.2;
        context.beginPath();
        context.moveTo(side * 3.8, -10);
        context.quadraticCurveTo(side * 9.5, -15 + twitch, side * 7.2, -20);
        context.strokeStyle = "rgba(22, 16, 12, 0.98)";
        context.lineWidth = 3;
        context.stroke();
        context.strokeStyle = "rgba(226, 195, 154, 0.48)";
        context.lineWidth = 0.65;
        context.stroke();
      }

      // Paired spinnerets remain visible under the abdomen when the spider
      // turns, a small detail that completes the top-down anatomy.
      for (const side of [-1, 1]) {
        const spinneretGradient = context.createLinearGradient(
          side * 2.5,
          17,
          side * 3.5,
          23,
        );
        spinneretGradient.addColorStop(0, "#38271e");
        spinneretGradient.addColorStop(1, "#080605");
        context.fillStyle = spinneretGradient;
        context.beginPath();
        context.ellipse(side * 2.7, 20.2, 2.1, 4.4, side * 0.12, 0, TAU);
        context.fill();
        context.strokeStyle = "rgba(225, 195, 157, 0.34)";
        context.lineWidth = 0.55;
        context.stroke();
      }

      const abdomenGradient = context.createRadialGradient(
        -3 + eyeShift.x * 5,
        1 + eyeShift.y * 3,
        1,
        0,
        6,
        15.5,
      );
      abdomenGradient.addColorStop(0, "#8c6a4e");
      abdomenGradient.addColorStop(0.26, "#493326");
      abdomenGradient.addColorStop(0.72, "#17110e");
      abdomenGradient.addColorStop(1, "#050403");
      context.fillStyle = abdomenGradient;
      context.beginPath();
      context.ellipse(0, 6, 11.5, 15.5, 0, 0, TAU);
      context.fill();
      context.strokeStyle = "rgba(228, 198, 160, 0.42)";
      context.lineWidth = 0.8;
      context.stroke();

      const abdomenSheen = context.createLinearGradient(-8, -3, 8, 15);
      abdomenSheen.addColorStop(0, "rgba(255, 231, 197, 0.26)");
      abdomenSheen.addColorStop(0.38, "rgba(255, 231, 197, 0.02)");
      abdomenSheen.addColorStop(1, "rgba(0, 0, 0, 0.28)");
      context.fillStyle = abdomenSheen;
      context.beginPath();
      context.ellipse(-1.4, 5.2, 9.8, 14.1, -0.08, 0, TAU);
      context.fill();

      context.strokeStyle = "rgba(17, 10, 7, 0.72)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(0, -2.5);
      context.bezierCurveTo(-1.1, 3, 1.1, 9, 0, 17);
      context.stroke();

      context.strokeStyle = "rgba(218, 173, 122, 0.48)";
      context.lineWidth = 1.15;
      for (let mark = 0; mark < 4; mark += 1) {
        const markY = 0.5 + mark * 4.4;
        context.beginPath();
        context.moveTo(-6 + mark * 0.7, markY);
        context.quadraticCurveTo(0, markY + 3, 6 - mark * 0.7, markY);
        context.stroke();
      }

      const headGradient = context.createRadialGradient(
        -2.5 + eyeShift.x * 3,
        -11 + eyeShift.y * 2,
        0,
        0,
        -8,
        9,
      );
      headGradient.addColorStop(0, "#806047");
      headGradient.addColorStop(0.45, "#39281f");
      headGradient.addColorStop(1, "#090706");
      context.fillStyle = headGradient;
      context.beginPath();
      context.ellipse(0, -8, 8.2, 7.5, 0, 0, TAU);
      context.fill();
      context.strokeStyle = "rgba(231, 207, 177, 0.38)";
      context.lineWidth = 0.75;
      context.stroke();

      context.strokeStyle = "rgba(12, 8, 6, 0.82)";
      context.lineWidth = 0.85;
      context.beginPath();
      context.moveTo(0, -3.2);
      context.quadraticCurveTo(-0.8, -7, 0, -11.8);
      context.stroke();

      // Glossy chelicerae and short fangs make the front anatomy readable
      // even as the spider changes direction.
      for (const side of [-1, 1]) {
        context.fillStyle = "#1a100c";
        context.beginPath();
        context.ellipse(side * 2.8, -14.2, 2.1, 3.2, side * 0.22, 0, TAU);
        context.fill();
        context.beginPath();
        context.moveTo(side * 2.3, -16.2);
        context.quadraticCurveTo(side * 2.1, -19.1, side * 0.9, -19.7);
        context.strokeStyle = "rgba(225, 184, 132, 0.72)";
        context.lineWidth = 1.05;
        context.stroke();
      }

      const eyes = [
        { x: -3.6, y: -12.1, r: 1.35 },
        { x: 3.6, y: -12.1, r: 1.35 },
        { x: -1.5, y: -13.1, r: 1.05 },
        { x: 1.5, y: -13.1, r: 1.05 },
        { x: -5.3, y: -9.7, r: 0.85 },
        { x: 5.3, y: -9.7, r: 0.85 },
        { x: -2.1, y: -9.8, r: 0.7 },
        { x: 2.1, y: -9.8, r: 0.7 },
      ];
      eyes.forEach((eye) => {
        context.fillStyle = "#020202";
        context.beginPath();
        context.arc(eye.x, eye.y, eye.r, 0, TAU);
        context.fill();
        context.fillStyle = "rgba(255, 243, 213, 0.9)";
        context.beginPath();
        context.arc(
          eye.x - eye.r * 0.28 + eyeShift.x,
          eye.y - eye.r * 0.32 + eyeShift.y,
          eye.r * 0.24,
          0,
          TAU,
        );
        context.fill();
      });

      context.strokeStyle = "rgba(230, 207, 177, 0.44)";
      context.lineWidth = 0.55;
      for (let hair = 0; hair < 30; hair += 1) {
        const angle = (hair / 30) * TAU;
        const rootX = Math.cos(angle) * 10.5;
        const rootY = 5.5 + Math.sin(angle) * 14.2;
        const length = 1.4 + ((hair * 7) % 5) * 0.28;
        context.beginPath();
        context.moveTo(rootX, rootY);
        context.lineTo(rootX + Math.cos(angle) * length, rootY + Math.sin(angle) * length);
        context.stroke();
      }

      for (let fleck = 0; fleck < 24; fleck += 1) {
        const fleckAngle = fleck * 2.399;
        const fleckRadius = Math.sqrt((fleck + 1) / 24);
        const fleckX = Math.cos(fleckAngle) * 8.7 * fleckRadius;
        const fleckY = 5.5 + Math.sin(fleckAngle) * 12.4 * fleckRadius;
        context.beginPath();
        context.arc(fleckX, fleckY, 0.35 + (fleck % 3) * 0.12, 0, TAU);
        context.fillStyle = `rgba(238, 202, 156, ${0.1 + (fleck % 4) * 0.035})`;
        context.fill();
      }

      context.restore();
    };

    const render = (now: number) => {
      resize();
      const time = (now - startedAt) / 1000;
      const press = clamp((pointer.pressedUntil - now) / 420);
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
      let activeTarget: HTMLElement | null = null;
      let pullStrength = 0;
      let silkShot = 0;

      if (targetIndex >= 0 && !sequenceFinished) {
        activeTarget = targetElements[targetIndex];
        // Measure the unpulled position. This is reset and reapplied inside the
        // same animation frame, so the browser never paints an intermediate snap.
        activeTarget.style.transform = "";
        const visualLetter = activeTarget.firstElementChild as HTMLElement | null;
        const rect = (visualLetter ?? activeTarget).getBoundingClientRect();
        activeLetter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const pointerPull = pointer.active ? (press > 0 ? 0.24 : 0.075) : 0;
        destination = {
          x: activeLetter.x + Math.sin(time * 5) * 17 + (pointer.x - activeLetter.x) * pointerPull,
          y: activeLetter.y - Math.max(68, rect.height * 0.76) + Math.cos(time * 4) * 6,
        };
      }

      const followSpeed =
        press > 0 ? 0.23 : targetIndex >= 0 && !sequenceFinished ? 0.135 : 0.09;
      const previousX = spider.x;
      const previousY = spider.y;
      spider.x += (destination.x - spider.x) * followSpeed;
      spider.y += (destination.y - spider.y) * followSpeed;
      const velocityX = spider.x - previousX;
      const velocityY = spider.y - previousY;
      const movement = clamp(Math.hypot(velocityX, velocityY) / 8);
      if (movement > 0.015) {
        const desiredHeading = Math.atan2(velocityY, velocityX) + Math.PI / 2;
        heading += shortestAngle(heading, desiredHeading) * 0.14;
      }

      if (activeLetter && activeTarget && targetIndex >= 0) {
        const grabAt = sequenceStart + targetIndex * sequenceStep;
        silkShot = ease(
          (time - (grabAt - APPROACH_LEAD * 0.62)) / (APPROACH_LEAD * 0.48),
        );
        const attach = ease((time - grabAt + APPROACH_LEAD * 0.84) / (APPROACH_LEAD * 0.62));
        const release =
          1 - ease((time - grabAt - sequenceStep * 0.42) / (sequenceStep * 0.5));
        pullStrength = Math.max(0, attach * release * silkShot);

        const pullX = spider.x - activeLetter.x;
        const pullY = spider.y - activeLetter.y;
        const pullDistance = Math.hypot(pullX, pullY) || 1;
        const tension = 12 + Math.min(12, pullDistance * 0.055);
        const vibration = Math.sin((time - grabAt) * 32) * 1.35 * pullStrength;
        const translateX = (pullX / pullDistance) * tension * pullStrength + vibration;
        const translateY = (pullY / pullDistance) * tension * pullStrength;
        const tilt = (pullX / pullDistance) * 8 * pullStrength + vibration * 0.8;

        activeTarget.style.transition = "none";
        activeTarget.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${tilt}deg) scale(${1 + pullStrength * 0.025})`;
        activeTarget.style.filter = `drop-shadow(0 0 ${6 + pullStrength * 12}px rgba(210, 255, 238, ${0.12 + pullStrength * 0.28}))`;
        activeLetter.x += translateX;
        activeLetter.y += translateY;
      }

      targetElements.forEach((target, index) => {
        if (index === targetIndex && activeTarget) return;
        target.style.transition = "transform 420ms cubic-bezier(0.16, 1, 0.3, 1), filter 420ms ease";
        target.style.transform = "";
        target.style.filter = "";
      });

      if (movement > 0.035 && now - lastTrailAt > 32) {
        trail.push({ x: spider.x, y: spider.y, createdAt: now });
        lastTrailAt = now;
      }
      trail = trail.filter((point) => now - point.createdAt < 1500).slice(-42);
      ripples = ripples.filter((ripple) => now - ripple.createdAt < 950);

      const spiderScale = clamp(Math.min(width, height) / 535, 1.16, 1.7);
      const spinneretOffset = 20 * spiderScale;
      const spinneret = {
        x: spider.x - Math.sin(heading) * spinneretOffset,
        y: spider.y + Math.cos(heading) * spinneretOffset,
      };

      context.clearRect(0, 0, width, height);

      if (pointer.active) {
        const spotlight = context.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          Math.min(220, width * 0.28),
        );
        spotlight.addColorStop(0, "rgba(67, 214, 164, 0.12)");
        spotlight.addColorStop(0.34, "rgba(67, 214, 164, 0.045)");
        spotlight.addColorStop(1, "rgba(67, 214, 164, 0)");
        context.fillStyle = spotlight;
        context.fillRect(0, 0, width, height);

        const motePulse = 4 + Math.sin(time * 5) * 1.3;
        context.beginPath();
        context.arc(pointer.x, pointer.y, motePulse, 0, TAU);
        context.fillStyle =
          press > 0 ? "rgba(255, 224, 170, 0.95)" : "rgba(228, 255, 246, 0.9)";
        context.fill();
        context.beginPath();
        context.arc(pointer.x, pointer.y, 12 + Math.sin(time * 3) * 2, 0, TAU);
        context.strokeStyle = "rgba(94, 234, 184, 0.38)";
        context.lineWidth = 0.8;
        context.stroke();
      }

      // The fading silk path makes the crawl feel intentional and gives the
      // user immediate visual feedback when the spider follows their pointer.
      for (let index = 1; index < trail.length; index += 1) {
        const from = trail[index - 1];
        const to = trail[index];
        const age = (now - to.createdAt) / 1500;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = `rgba(195, 255, 231, ${Math.max(0, (1 - age) * 0.34)})`;
        context.lineWidth = Math.max(0.35, (1 - age) * 1.05);
        context.stroke();
      }

      ripples.forEach((ripple) => {
        const progress = clamp((now - ripple.createdAt) / 950);
        const radius = 12 + ease(progress) * 90;
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius, 0, TAU);
        context.strokeStyle = `rgba(94, 234, 184, ${(1 - progress) * 0.56})`;
        context.lineWidth = 1.4 - progress * 0.8;
        context.stroke();
      });

      if (pointer.active) {
        const pointerDistance = Math.hypot(pointer.x - spider.x, pointer.y - spider.y);
        if (pointerDistance > 34 && pointerDistance < 380) {
          const tension = 1 - pointerDistance / 380;
          drawThread(
            spinneret,
            pointer,
            time,
            8.3,
            0.08 + tension * 0.24 + press * 0.16,
            0.72 + press * 0.38,
            0.58 + tension * 0.34,
          );
        }
      }

      if (activeLetter && targetIndex >= 0) {
        const junction = {
          x: spinneret.x + (activeLetter.x - spinneret.x) * 0.88,
          y: spinneret.y + (activeLetter.y - spinneret.y) * 0.88,
        };
        const primaryProgress = clamp(silkShot / 0.88);
        const shotTip = {
          x: spinneret.x + (junction.x - spinneret.x) * primaryProgress,
          y: spinneret.y + (junction.y - spinneret.y) * primaryProgress,
        };

        drawThread(
          spinneret,
          shotTip,
          time,
          targetIndex * 0.73,
          0.2 + silkShot * 0.68,
          1.35,
          0.9 + pullStrength * 0.09,
        );

        if (silkShot > 0 && silkShot < 0.88) {
          context.beginPath();
          context.arc(shotTip.x, shotTip.y, 1.15 + silkShot, 0, TAU);
          context.fillStyle = `rgba(240, 255, 249, ${0.45 + silkShot * 0.45})`;
          context.fill();
        }

        if (silkShot > 0.82) {
          const branchProgress = ease((silkShot - 0.82) / 0.18);
          for (let branch = -1; branch <= 1; branch += 1) {
            const target = {
              x: activeLetter.x + branch * 4.2,
              y: activeLetter.y + Math.abs(branch) * 1.4,
            };
            const branchTip = {
              x: junction.x + (target.x - junction.x) * branchProgress,
              y: junction.y + (target.y - junction.y) * branchProgress,
            };
            drawThread(
              junction,
              branchTip,
              time,
              branch * 1.17,
              0.2 + pullStrength * 0.5,
              branch === 0 ? 0.9 : 0.5,
              0.96,
            );
          }
        }
      }

      drawSpider(spider, time, heading, movement, pointer.active ? pointer : null, press);
      animationFrame = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerleave", onPointerLeave);
      targets.current.forEach((target) => {
        if (!target) return;
        target.style.transition = "";
        target.style.transform = "";
        target.style.filter = "";
      });
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
