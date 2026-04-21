"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TextCanvas, type TextCanvasHandle } from "./TextCanvas";
import { FluidCanvas } from "./FluidCanvas";

type Props = {
  passage: string;
};

/**
 * Frame + stage for the pretext + fluid experiment.
 *
 * Layering (back → front):
 *   1. FluidCanvas   — WebGL ripple simulation
 *   2. TextCanvas    — the passage, painted in its real color
 *
 * The TextCanvas is also used as the obstacle mask for the sim: its
 * opaque pixels become "solid" cells that waves bounce off.
 */
export function FluidTextExperiment({ passage }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const textHandleRef = useRef<TextCanvasHandle | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [maskVersion, setMaskVersion] = useState(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleRendered = useCallback(() => {
    setMaskVersion((v) => v + 1);
  }, []);

  const getMaskCanvas = useCallback(() => {
    return textHandleRef.current?.getCanvas() ?? null;
  }, []);

  return (
    <main className="min-h-full bg-page-bg pb-24 pt-28 text-text-primary">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
          Experiment
        </p>
        <h1 className="mt-3 text-3xl font-medium leading-tight tracking-tight">
          Ripples, through text
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          The passage is laid out with{" "}
          <code className="text-text-primary">@chenglou/pretext</code> and then
          passed into a WebGL wave-equation sim as an obstacle mask. Ripples
          travel across the surface and reflect off the edges of every glyph.
          The text itself never moves or dims.
        </p>
      </div>

      <section className="mx-auto mt-12 max-w-5xl px-6">
        <div
          ref={stageRef}
          className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-line-muted bg-black"
          style={{ minHeight: 420 }}
        >
          {size.width > 0 && size.height > 0 && (
            <>
              <FluidCanvas
                width={size.width}
                height={size.height}
                maskVersion={maskVersion}
                getMaskCanvas={getMaskCanvas}
              />
              <TextCanvas
                ref={textHandleRef}
                passage={passage}
                width={size.width}
                height={size.height}
                onRendered={handleRendered}
              />
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-text-secondary">
          Click or drag anywhere inside the stage to drop ripples. Slow drags
          leave a continuous wake; fast ones spray little drops.
        </p>
      </section>
    </main>
  );
}
