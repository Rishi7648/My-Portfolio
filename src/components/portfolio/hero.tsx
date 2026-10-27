"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Sparkles } from "lucide-react";
import { PERSONAL } from "@/lib/portfolio/data";
import Image from "next/image";

gsap.registerPlugin(useGSAP);

/* =========================================================================
   Ambient WebGL shader background
   ---------------------------------------------------------------------
   Adapted from a shader-hero component (shader by Matthias Hurrle /
   @atzedent). Stripped of its own headline/subtitle/buttons/trust-badge —
   this file only borrows the rendering engine and uses it as a quiet
   animated background layer behind your existing hero content.

   Notes on what changed vs. the original snippet:
   - Fixed a viewport double-scaling bug (canvas.width was already
     multiplied by devicePixelRatio during resize, then multiplied again
     in updateScale — caused blur/misalignment on high-DPI phones).
   - Canvas now sizes to its container (the hero section) instead of
     window.innerWidth/innerHeight, so it fits correctly wherever it's
     placed.
   - Bails out quietly if WebGL2 isn't supported instead of throwing.
   - Skips the animation loop (renders one static frame) when the user
     has "reduce motion" turned on at the OS level.
   - DPR scaling is lighter on mobile (fewer pixels for the 12-iteration
     fragment loop), blobs shrink below the sm breakpoint, and resize
     also runs on orientationchange.
   - NEW: only holds a live WebGL2 context while the hero section is
     actually in (or near) the viewport. Browsers cap the number of
     WebGL contexts a single page may have open at once (as low as
     4-8 on some mobile/low-power GPUs). This page also renders a
     `cobe` globe elsewhere (see globe.tsx) which needs its own WebGL
     context — if Hero holds onto its context forever after the user
     scrolls past it, the globe can silently fail to acquire one.
     An IntersectionObserver now releases Hero's context via
     WEBGL_lose_context once the hero scrolls out of view, and
     re-acquires it if the user scrolls back up.
========================================================================= */

const SHADER_VERTEX_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

const SHADER_VERTICES = [-1, 1, -1, -1, 1, 1, 1, -1];

// Multiplies the time value fed into the shader's `time` uniform — every
// motion in the fragment shader (the swirl drift, the cloud movement, the
// blob-like clumps) is driven off this single value, so scaling it down
// slows the whole effect uniformly without touching the GLSL itself.
// 1 = original speed. Try 0.3–0.5 for noticeably slower, dreamier motion.
const SHADER_SPEED = 0.6;

const SHADER_FRAGMENT_SRC = `#version 300 es
/*********
* made by Matthias Hurrle (@atzedent)
*
*	To explore strange new worlds, to seek out new life
*	and new civilizations, to boldly go where no man has
*	gone before.
*/
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float
  a=rnd(i),
  b=rnd(i+vec2(1,0)),
  c=rnd(i+vec2(0,1)),
  d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}
float clouds(vec2 p) {
	float d=1., t=.0;
	for (float i=.0; i<3.; i++) {
		float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
		t=mix(t,d,a);
		d=a;
		p*=2./(i+1.);
	}
	return t;
}
void main(void) {
	vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
	vec3 col=vec3(0);
	float bg=clouds(vec2(st.x+T*.5,-st.y));
	uv*=1.-.3*(sin(T*.2)*.5+.5);
	for (float i=1.; i<12.; i++) {
		uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
		vec2 p=uv;
		float d=length(p);
		col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
		float b=noise(i+p+bg*1.731);
		col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
		col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
	}
	// Inverted so it reads as dark ink swirls on a light field instead of
	// bright color on black — the original was designed for a black hero.
	O=vec4(1.0-col,1.0);
}`;

class ShaderRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this.gl.viewport(0, 0, canvas.width, canvas.height);
  }

  compile(shader: WebGLShader, source: string) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    }
  }

  setup() {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER)!;
    this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    this.compile(this.vs, SHADER_VERTEX_SRC);
    this.compile(this.fs, SHADER_FRAGMENT_SRC);
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
    }
  }

  init() {
    const gl = this.gl;
    const program = this.program!;

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SHADER_VERTICES), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    (program as any).resolution = gl.getUniformLocation(program, "resolution");
    (program as any).time = gl.getUniformLocation(program, "time");
  }

  resize() {
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(now = 0) {
    const gl = this.gl;
    const program = this.program;
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.uniform2f((program as any).resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f((program as any).time, now * 1e-3 * SHADER_SPEED);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    const gl = this.gl;
    if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
      if (this.vs) {
        gl.detachShader(this.program, this.vs);
        gl.deleteShader(this.vs);
      }
      if (this.fs) {
        gl.detachShader(this.program, this.fs);
        gl.deleteShader(this.fs);
      }
      gl.deleteProgram(this.program);
    }
  }
}

/**
 * Ambient background hook — renders the shader into a canvas that is
 * conditionally mounted based on whether `containerRef` (the hero
 * section) is in or near the viewport.
 *
 * IMPORTANT: this deliberately unmounts/remounts the actual <canvas>
 * DOM element (via the `isActive` flag returned below, used as
 * `{isActive && <canvas ref={canvasRef} .../>}` in the component)
 * rather than calling `WEBGL_lose_context.loseContext()` on a
 * persistent canvas. Calling loseContext() on a canvas element that
 * might be reused is a footgun: `canvas.getContext("webgl2")` always
 * returns the *same* context object for a given canvas node — once
 * that context is lost, every future getContext() call on that same
 * node returns the dead context forever (browsers don't hand out a
 * fresh one). React Strict Mode's dev-only mount→cleanup→mount effect
 * simulation runs on the same DOM node, so it would immediately kill
 * and then try to reuse the same lost context, causing every shader
 * compile to silently fail. Unmounting the element instead guarantees
 * a brand-new canvas (and therefore a brand-new, valid context) every
 * time the hero scrolls back into view, and makes the effect safe to
 * double-invoke since cleanup only disposes our own program/shaders,
 * never the context itself.
 */
function useShaderBackground(containerRef: React.RefObject<HTMLElement | null>) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  // Assume visible on first paint — the hero is above the fold, and this
  // avoids a flash of no-background before the observer's first callback.
  const [isActive, setIsActive] = React.useState(true);

  // Watches the section (not the canvas) so it keeps working across the
  // canvas mounting/unmounting driven by isActive below.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setIsActive(entries[0]?.isIntersecting ?? true),
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  React.useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) return; // WebGL2 unsupported — quietly skip, page still looks fine without it

    // Mobile devices get a lighter DPR multiplier — fewer pixels to shade
    // keeps the fragment shader loop (12 iterations + fbm noise) smooth
    // on lower-powered GPUs.
    const isMobile = window.innerWidth < 768;
    const dpr = Math.max(1, (isMobile ? 0.35 : 0.5) * window.devicePixelRatio);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new ShaderRenderer(canvas, gl);
    renderer.setup();
    renderer.init();

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      renderer.resize();
    };
    resize();

    let frameId: number | undefined;
    const loop = (now: number) => {
      renderer.render(now);
      frameId = requestAnimationFrame(loop);
    };

    if (prefersReducedMotion) {
      renderer.render(0);
    } else {
      loop(0);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      if (frameId) cancelAnimationFrame(frameId);
      // Deletes only our own program/shaders/buffer — never the
      // underlying WebGL context. Safe to run twice in a row on the
      // same canvas (Strict Mode double-invoke): the context stays
      // valid, so the setup above works correctly if this effect
      // re-runs immediately after.
      renderer.dispose();
    };
  }, [isActive]);

  return { canvasRef, isActive };
}

/* ========================================================================= */

const wordVariants = {
  hidden: { y: "110%", opacity: 0, filter: "blur(8px)" },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: 0.35 + i * 0.15,
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay,
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const taglineContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 1.15,
    },
  },
};

const taglineWord = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.85, rotate: -3, y: 40 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    y: 0,
    transition: { delay: 0.3, duration: 1.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const clipVariants = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  show: {
    clipPath: "inset(0% 0 0 0)",
    transition: { delay: 0.45, duration: 1.3, ease: [0.76, 0, 0.24, 1] as const },
  },
};

const wildstoneLinkClass =
  "underline decoration-green-600/40 decoration-2 underline-offset-4 transition-colors hover:text-green-600 hover:decoration-green-600";

type HeroProps = {
  startAnimation?: boolean;
};

export function Hero({ startAnimation = true }: HeroProps) {
  const heroRef = React.useRef<HTMLDivElement | null>(null);
  const blob1 = React.useRef<HTMLDivElement | null>(null);
  const blob2 = React.useRef<HTMLDivElement | null>(null);
  const blob3 = React.useRef<HTMLDivElement | null>(null);
  const { canvasRef: shaderCanvasRef, isActive: shaderActive } = useShaderBackground(heroRef);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useGSAP(
    () => {
      gsap.to(blob1.current, { x: "+=40", y: "-=30", duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(blob2.current, { x: "-=50", y: "+=40", duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(blob3.current, { x: "+=30", y: "+=30", duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" });

      const onMove = (e: MouseEvent) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        gsap.to(blob1.current, { x: dx * 60, y: dy * 60, duration: 1.2, ease: "power3.out" });
        gsap.to(blob2.current, { x: -dx * 80, y: -dy * 50, duration: 1.4, ease: "power3.out" });
        gsap.to(blob3.current, { x: dx * 40, y: -dy * 70, duration: 1.3, ease: "power3.out" });
      };
      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    },
    { scope: heroRef }
  );

  const taglineWords = PERSONAL.tagline.split(" ");
  const animState = startAnimation ? "show" : "hidden";

  return (
    <section
      id="home"
      ref={heroRef}
      style={{ backgroundColor: "#ffffff" }}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-white pb-10 pt-20 sm:min-h-[100dvh] sm:pb-14 sm:pt-24 lg:pb-16"
    >
      {shaderActive && (
        <canvas
          ref={shaderCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-50 mix-blend-multiply sm:opacity-70"
          style={{
            maskImage:
              "radial-gradient(circle at 38% 48%, transparent 0%, black 65%)",
            WebkitMaskImage:
              "radial-gradient(circle at 38% 48%, transparent 0%, black 65%)",
          }}
        />
      )}

      <div
        ref={blob1}
        className="pointer-events-none absolute -left-16 top-10 h-[16rem] w-[16rem] rounded-full opacity-30 sm:-left-32 sm:h-[28rem] sm:w-[28rem]"
        style={{
          background: "radial-gradient(circle at center, rgba(59,130,246,0.4), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        ref={blob2}
        className="pointer-events-none absolute -right-12 top-1/3 h-[15rem] w-[15rem] rounded-full opacity-25 sm:-right-24 sm:h-[26rem] sm:w-[26rem]"
        style={{
          background: "radial-gradient(circle at center, rgba(168,85,247,0.3), transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "-3s",
        }}
      />
      <div
        ref={blob3}
        className="pointer-events-none absolute bottom-0 left-1/3 h-[13rem] w-[13rem] rounded-full opacity-20 sm:h-[22rem] sm:w-[22rem]"
        style={{
          background: "radial-gradient(circle at center, rgba(236,72,153,0.3), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 items-center gap-5 px-4 sm:gap-6 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8"
      >
        <div className="min-w-0 lg:col-span-7">
          <div className="mt-3 overflow-hidden sm:mt-5">
            <motion.p
              custom={0.15}
              variants={fadeUpVariant}
              initial="hidden"
              animate={animState}
              className="text-lg tracking-wide text-neutral-600 min-[375px]:text-xl sm:text-2xl"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
            >
              Hi, I&apos;m
            </motion.p>
          </div>

          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight min-[375px]:text-[2.625rem] sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl">
            <span className="block overflow-hidden pb-2">
              <motion.span
                custom={0}
                variants={wordVariants}
                initial="hidden"
                animate={animState}
                className="inline-block bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-950 bg-clip-text text-transparent"
              >
                Rishi
              </motion.span>{" "}
              <motion.span
                custom={1}
                variants={wordVariants}
                initial="hidden"
                animate={animState}
                className="inline-block bg-gradient-to-r from-blue-600 via-neutral-950 to-neutral-950 bg-clip-text text-transparent"
              >
                Silwal
              </motion.span>
            </span>
          </h1>

          <div className="mt-3 overflow-hidden">
            <motion.div
              custom={0.85}
              variants={fadeUpVariant}
              initial="hidden"
              animate={animState}
              className="flex flex-wrap items-start gap-2 text-lg text-neutral-600 min-[375px]:text-xl sm:items-center sm:gap-3 sm:text-2xl md:text-3xl"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}
            >
              <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <motion.span
                  initial={{ rotate: -20, scale: 0 }}
                  animate={startAnimation ? { rotate: 0, scale: 1 } : { rotate: -20, scale: 0 }}
                  transition={{ delay: 1.05, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-flex"
                >
                  <Sparkles className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                </motion.span>
                {"Frontend developer "}
    
              </span>
            </motion.div>
          </div>

          <motion.p
            variants={taglineContainer}
            initial="hidden"
            animate={animState}
            className="mt-4 max-w-xl text-xl leading-snug text-neutral-600 text-pretty min-[375px]:text-2xl sm:mt-6 md:text-3xl"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600 }}
          >
            {taglineWords.map((word, i) => (
              <motion.span key={i} variants={taglineWord} className="inline-block">
                {word}
                {i < taglineWords.length - 1 ? "\u00A0" : ""}
              </motion.span>
            ))}
          </motion.p>
        </div>

        {/* Was `lg:w-[34rem] lg:max-w-none` — a fixed 544px width that its own
            grid cell (lg:col-span-5, inside a max-w-6xl 12-col grid) can never
            actually provide (the column tops out around ~440px, at any viewport
            size, since Tailwind's grid-cols uses minmax(0,1fr) tracks). The
            image was relying on unclamped overflow to reach its target size,
            which behaved inconsistently across viewport widths. `w-full` fills
            the real column width; `max-w-[34rem]` is now just a safety ceiling
            instead of a value the layout could never honor. */}
        <motion.div
          variants={imageVariants}
          initial="hidden"
          animate={animState}
          className="relative mx-auto mt-5 block w-full max-w-[17rem] self-start justify-self-center min-[375px]:max-w-[19rem] sm:mt-8 sm:max-w-[20rem] lg:col-span-5 lg:mt-0 lg:-ml-8 lg:-mt-16 lg:w-full lg:max-w-[34rem] lg:justify-self-end xl:-ml-12 xl:-mt-24"
        >
          <motion.div variants={clipVariants} initial="hidden" animate={animState}>
            <Image
              src="/hero.jpg"
              alt="Rishi Silwal"
              width={800}
              height={1000}
              priority
              sizes="(max-width: 374px) calc(100vw - 2rem), (max-width: 1023px) 20rem, (max-width: 1279px) 40vw, 34rem"
              className="w-full object-cover [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
