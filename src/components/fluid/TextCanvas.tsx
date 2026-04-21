"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  layoutWithLines,
  prepareWithSegments,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import {
  FLUID_FONT_SHORTHAND,
  FLUID_FONT_SIZE_PX,
  FLUID_LINE_HEIGHT_PX,
  FLUID_MAX_COLUMN_WIDTH,
  FLUID_TEXT_COLOR,
  FLUID_TEXT_PADDING_X,
  FLUID_TEXT_PADDING_Y,
} from "@/data/fluidText";

type Props = {
  passage: string;
  width: number;
  height: number;
  /** Called after each repaint. The fluid sim uses this to (re)upload
   *  the canvas as its obstacle mask. */
  onRendered?: (canvas: HTMLCanvasElement) => void;
};

export type TextCanvasHandle = {
  /** The underlying 2D canvas (white glyphs on transparent). */
  getCanvas(): HTMLCanvasElement | null;
};

/**
 * Paints the passage into a 2D canvas using pretext for line layout.
 *
 * The same canvas is used by `FluidCanvas` as an obstacle mask: we upload it
 * as a WebGL texture and treat any pixel with alpha > 0 as "solid water"
 * that ripples bounce off. For that to look right we render the text fully
 * opaque (no soft shadow, no blur).
 */
export const TextCanvas = forwardRef<TextCanvasHandle, Props>(function TextCanvas(
  { passage, width, height, onRendered },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preparedRef = useRef<PreparedTextWithSegments | null>(null);
  const preparedForRef = useRef<string>("");

  useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }), []);

  if (preparedForRef.current !== passage) {
    preparedRef.current = prepareWithSegments(passage, FLUID_FONT_SHORTHAND, {
      whiteSpace: "pre-wrap",
    });
    preparedForRef.current = passage;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const prepared = preparedRef.current;
    if (!canvas || !prepared || width <= 0 || height <= 0) return;

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const columnWidth = Math.min(
      FLUID_MAX_COLUMN_WIDTH,
      Math.max(160, width - FLUID_TEXT_PADDING_X * 2),
    );

    const { lines, height: textHeight } = layoutWithLines(
      prepared,
      columnWidth,
      FLUID_LINE_HEIGHT_PX,
    );

    const topInset = FLUID_TEXT_PADDING_Y;
    const availableHeight = Math.max(0, height - topInset * 2);
    const yStart =
      textHeight <= availableHeight
        ? topInset + (availableHeight - textHeight) / 2
        : topInset;

    const xStart = Math.round((width - columnWidth) / 2);

    ctx.font = FLUID_FONT_SHORTHAND;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = FLUID_TEXT_COLOR;

    const baselineOffset =
      (FLUID_LINE_HEIGHT_PX + FLUID_FONT_SIZE_PX) / 2 - FLUID_FONT_SIZE_PX * 0.2;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const y = yStart + i * FLUID_LINE_HEIGHT_PX + baselineOffset;
      if (y < -FLUID_LINE_HEIGHT_PX || y > height + FLUID_LINE_HEIGHT_PX) {
        continue;
      }
      ctx.fillText(line.text, xStart, y);
    }

    onRendered?.(canvas);
  }, [passage, width, height, onRendered]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
});
