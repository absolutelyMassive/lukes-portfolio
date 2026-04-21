"use client";

import { useEffect, useRef } from "react";
import { createFluidSim, type FluidSimHandle } from "./fluidSim";

type Props = {
  width: number;
  height: number;
  /** Incremented by the parent whenever the text canvas repaints so we
   *  re-upload it as the obstacle mask. */
  maskVersion: number;
  /** Ref to the text canvas that acts as the obstacle mask. */
  getMaskCanvas: () => HTMLCanvasElement | null;
};

/**
 * WebGL ripple-sim layer. Pointer input drops bumps into the height field;
 * the wave step bounces them off the text-shaped obstacle mask supplied by
 * the parent.
 */
export function FluidCanvas({ width, height, maskVersion, getMaskCanvas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<FluidSimHandle | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pointerDownRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sim = createFluidSim(canvas, {
      gridLongSide: 768,
      waveSpeed2: 0.3,
      damping: 0.996,
      stepsPerFrame: 1,
      splatRadius: 0.0009,
      splatStrength: 0.55,
    });
    if (!sim) {
      canvas.style.display = "none";
      return;
    }
    simRef.current = sim;
    return () => {
      sim.dispose();
      simRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim || width <= 0 || height <= 0) return;
    sim.resize(width, height);
    // Size changed → text canvas will repaint and call onRendered; the
    // maskVersion effect below handles that upload. But if the mask is
    // already present, push it through immediately so the first frames
    // already respect the obstacles.
    const maskCanvas = getMaskCanvas();
    if (maskCanvas && maskCanvas.width > 0) sim.updateMask(maskCanvas);
  }, [width, height, getMaskCanvas]);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    const maskCanvas = getMaskCanvas();
    if (!maskCanvas || maskCanvas.width === 0) return;
    sim.updateMask(maskCanvas);
  }, [maskVersion, getMaskCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function clientToNorm(e: PointerEvent) {
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      return { x, y };
    }

    function handleMove(e: PointerEvent) {
      if (!pointerDownRef.current) return; // Only inject energy while dragging.
      const sim = simRef.current;
      if (!sim) return;
      const p = clientToNorm(e);
      if (!p) return;
      const prev = lastPointRef.current;
      if (prev) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const speed = Math.hypot(dx, dy);
        // Very small motion: skip so a paused drag doesn't pile up ripples
        // at one spot.
        if (speed < 0.001) {
          lastPointRef.current = p;
          return;
        }
        // Stamp ~1 splat per 2% of canvas travelled so drag strokes leave a
        // continuous wake. Keep per-splat strength low; the wake as a whole
        // carries the energy.
        const steps = Math.min(4, Math.max(1, Math.round(speed * 50)));
        const strengthPer = Math.min(0.5, 0.08 + speed * 2.0);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          sim.splat(prev.x + dx * t, prev.y + dy * t, strengthPer);
        }
      } else {
        sim.splat(p.x, p.y, 0.3);
      }
      lastPointRef.current = p;
    }

    function handleDown(e: PointerEvent) {
      canvas?.setPointerCapture?.(e.pointerId);
      pointerDownRef.current = true;
      const p = clientToNorm(e);
      if (!p) return;
      lastPointRef.current = p;
      // Single crisp drop on press.
      simRef.current?.splat(p.x, p.y, 1.0);
    }

    function handleUp(e: PointerEvent) {
      canvas?.releasePointerCapture?.(e.pointerId);
      pointerDownRef.current = false;
      lastPointRef.current = null;
    }

    function handleLeave() {
      pointerDownRef.current = false;
      lastPointRef.current = null;
    }

    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerup", handleUp);
    canvas.addEventListener("pointercancel", handleUp);
    canvas.addEventListener("pointerleave", handleLeave);

    return () => {
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointercancel", handleUp);
      canvas.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      style={{ touchAction: "none" }}
    />
  );
}
