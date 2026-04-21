import type { CSSProperties } from "react";

/** Figma hero frame size (Project 1–4 artboards). Percents are relative to this box. */
export const FIGMA_HERO_FRAME = { width: 1440, height: 900 } as const;

export type FigmaRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Map a rectangle in Figma frame coordinates to `position: absolute` CSS
 * as percentages of the hero section (assumed to match the frame proportionally).
 */
export function figmaRectToPercentStyle(
  rect: FigmaRect,
  frame: { width: number; height: number } = FIGMA_HERO_FRAME,
): CSSProperties {
  const { x, y, width, height } = rect;
  return {
    left: `${(x / frame.width) * 100}%`,
    top: `${(y / frame.height) * 100}%`,
    width: `${(width / frame.width) * 100}%`,
    height: `${(height / frame.height) * 100}%`,
  };
}
