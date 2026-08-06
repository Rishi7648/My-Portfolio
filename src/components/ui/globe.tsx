"use client"

import { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"

interface FlightArc {
  id: string
  from: [number, number]
  to: [number, number]
}

interface FlightMarker {
  id: string
  location: [number, number]
}

interface GlobeProps {
  arcs?: FlightArc[]
  markers?: FlightMarker[]
  className?: string
  speed?: number
}

const defaultArcs: FlightArc[] = [
  { id: "flight-1", from: [40.64, -73.78], to: [51.47, -0.46] },
  { id: "flight-2", from: [51.47, -0.46], to: [25.25, 55.36] },
  { id: "flight-3", from: [35.55, 139.78], to: [37.62, -122.38] },
  { id: "flight-4", from: [1.36, 103.99], to: [-33.95, 151.18] },
  { id: "flight-5", from: [48.86, 2.35], to: [40.64, -73.78] },
]

const defaultMarkers: FlightMarker[] = [
  { id: "apt-jfk", location: [40.64, -73.78] },
  { id: "apt-lhr", location: [51.47, -0.46] },
  { id: "apt-dxb", location: [25.25, 55.36] },
  { id: "apt-nrt", location: [35.55, 139.78] },
  { id: "apt-sfo", location: [37.62, -122.38] },
  { id: "apt-sin", location: [1.36, 103.99] },
  { id: "apt-syd", location: [-33.95, 151.18] },
  { id: "apt-cdg", location: [48.86, 2.35] },
]

export function Globe({
  arcs = defaultArcs,
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0
    let ro: ResizeObserver | null = null
    // Guards init() from running after this effect instance has already
    // been cleaned up — without this, a ResizeObserver callback from a
    // stale effect run (React Strict Mode double-invoke, Fast Refresh,
    // fast remount) can fire late and create a second globe/WebGL
    // context on the same canvas, which is the main source of the
    // "sometimes doesn't appear" behavior.
    let cancelled = false

    // Tracks the width the globe was last created at, and whether we've
    // done the initial fade-in yet. The ResizeObserver below stays alive
    // for the whole component lifetime (it used to disconnect after the
    // first fire) — without that, the canvas's internal WebGL resolution
    // stayed locked at whatever size it happened to be on first mount.
    // Since the CSS (width: 100%, aspect-square) keeps stretching the
    // element visually, any later resize — window resize, orientation
    // change, or switching device presets in devtools without a full
    // reload — left the globe blurry or mis-sized on the new dimensions.
    let currentWidth = 0
    let hasRenderedOnce = false
    let resizeTimeout: ReturnType<typeof setTimeout>

    function destroyGlobe() {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) {
        globe.destroy()
        globe = null
      }
    }

    function init(width: number) {
      if (cancelled || width === 0) return
      currentWidth = width

      try {
        globe = createGlobe(canvas, {
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          width,
          height: width,
          phi: 0,
          theta: 0.2,
          dark: 0.05,
          diffuse: 1.5,
          mapSamples: 16000,
          mapBrightness: 8,
          baseColor: [0.98, 0.98, 1],
          markerColor: [0.3, 0.55, 0.95],
          glowColor: [0.94, 0.93, 0.91],
          markerElevation: 0,
          markers: markers.map((m) => ({ location: m.location, size: 0.02, id: m.id })),
          arcs: arcs.map((a) => ({ from: a.from, to: a.to, id: a.id })),
          arcColor: [0.35, 0.6, 1],
          arcWidth: 0.5,
          arcHeight: 0.25,
          opacity: 0.7,
        })
      } catch (err) {
        // WebGL context creation can fail silently — e.g. the browser's
        // per-page WebGL context limit was hit (this page also runs a
        // raw WebGL2 context in the Hero shader background), the GPU is
        // blocklisted, or the tab was backgrounded. Previously this left
        // an invisible canvas (opacity stuck at 0) with zero feedback.
        console.error("Globe: failed to initialize WebGL context", err)
        return
      }

      function frame() {
        if (cancelled) return
        if (!isPausedRef.current) phi += speed
        globe!.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        })
        animationId = requestAnimationFrame(frame)
      }
      frame()

      // Only fade in from 0 -> 1 the very first time; a resize-triggered
      // re-init shouldn't flash the canvas out and back in since it's
      // already visible on screen.
      if (!hasRenderedOnce) {
        hasRenderedOnce = true
        requestAnimationFrame(() => {
          if (!cancelled && canvas) canvas.style.opacity = "1"
        })
      }
    }

    function handleResize(width: number) {
      // Ignore sub-pixel fluctuations (e.g. scrollbar show/hide, zoom
      // rounding) so we don't thrash the WebGL context unnecessarily
      if (Math.abs(width - currentWidth) < 4) return
      destroyGlobe()
      init(width)
    }

    ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      if (width === 0) return

      if (!globe) {
        init(width)
        return
      }

      // Debounced so a window being actively dragged/resized, or a
      // mobile orientation change, doesn't recreate the globe on every
      // single intermediate frame
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => handleResize(width), 150)
    })
    ro.observe(canvas)

    return () => {
      cancelled = true
      clearTimeout(resizeTimeout)
      ro?.disconnect()
      destroyGlobe()
    }
  }, [markers, arcs, speed])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
    </div>
  )
}