/**
 * Proportional typographic ASCII palette + per-byte HTML lookup.
 *
 * Adapted from chenglou/pretext `pages/demos/variable-typographic-ascii.ts`
 * (MIT). Uses `prepareWithSegments` for glyph widths and a tiny canvas for
 * per-glyph brightness. `targetCellW` is supplied at lookup-build time so the
 * same palette can be reused across resizes with only a cheap 256-entry
 * rebuild.
 */

import { prepareWithSegments } from "@chenglou/pretext";

export const CHARSET =
  " .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const WEIGHTS = [300, 500, 800] as const;
export const STYLES = ["normal", "italic"] as const;

export type FontStyleVariant = (typeof STYLES)[number];

export type PaletteEntry = {
  char: string;
  weight: number;
  style: FontStyleVariant;
  font: string;
  width: number;
  brightness: number;
};

export type BrightnessEntry = {
  monoChar: string;
  propHtml: string;
};

const MONO_RAMP = " .`-_:,;^=+/|)\\!?0oOQ#%@";

const PROP_FAMILY = 'Georgia, Palatino, "Times New Roman", serif';

function esc(ch: string): string {
  if (ch === "<") return "&lt;";
  if (ch === ">") return "&gt;";
  if (ch === "&") return "&amp;";
  if (ch === '"') return "&quot;";
  return ch;
}

function wCls(weight: number, style: FontStyleVariant): string {
  const weightClass = weight === 300 ? "w3" : weight === 500 ? "w5" : "w8";
  return style === "italic" ? `${weightClass} it` : weightClass;
}

function estimateBrightness(
  ch: string,
  font: string,
  bCtx: CanvasRenderingContext2D,
): number {
  const size = 28;
  bCtx.clearRect(0, 0, size, size);
  bCtx.font = font;
  bCtx.fillStyle = "#fff";
  bCtx.textBaseline = "middle";
  bCtx.fillText(ch, 1, size / 2);
  const data = bCtx.getImageData(0, 0, size, size).data;
  let sum = 0;
  for (let index = 3; index < data.length; index += 4) sum += data[index]!;
  return sum / (255 * size * size);
}

function measureWidth(ch: string, font: string): number {
  const prepared = prepareWithSegments(ch, font);
  return prepared.widths.length > 0 ? prepared.widths[0]! : 0;
}

/** Build sorted palette for a given body size (px). Call when fontSize changes. */
export function buildPalette(fontSize: number, bCtx: CanvasRenderingContext2D): PaletteEntry[] {
  const palette: PaletteEntry[] = [];
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const font = `${style === "italic" ? "italic " : ""}${weight} ${fontSize}px ${PROP_FAMILY}`;
      for (const ch of CHARSET) {
        if (ch === " ") continue;
        const width = measureWidth(ch, font);
        if (width <= 0) continue;
        const brightness = estimateBrightness(ch, font, bCtx);
        palette.push({ char: ch, weight, style, font, width, brightness });
      }
    }
  }
  const maxBrightness = Math.max(...palette.map((e) => e.brightness));
  if (maxBrightness > 0) {
    for (let i = 0; i < palette.length; i++) {
      palette[i]!.brightness /= maxBrightness;
    }
  }
  palette.sort((a, b) => a.brightness - b.brightness);
  return palette;
}

export function findBest(
  palette: PaletteEntry[],
  targetBrightness: number,
  targetCellW: number,
): PaletteEntry {
  if (palette.length === 0) {
    return {
      char: "·",
      weight: 500,
      style: "normal",
      font: `500 14px ${PROP_FAMILY}`,
      width: targetCellW,
      brightness: 0.5,
    };
  }
  let lo = 0;
  let hi = palette.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (palette[mid]!.brightness < targetBrightness) lo = mid + 1;
    else hi = mid;
  }

  let bestScore = Infinity;
  let best = palette[lo]!;
  const start = Math.max(0, lo - 15);
  const end = Math.min(palette.length, lo + 15);
  for (let index = start; index < end; index++) {
    const entry = palette[index]!;
    const brightnessError = Math.abs(entry.brightness - targetBrightness) * 2.5;
    const widthError = Math.abs(entry.width - targetCellW) / targetCellW;
    const score = brightnessError + widthError;
    if (score < bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best;
}

/** 256 entries; rebuild when `targetCellW` changes meaningfully. */
export function buildBrightnessLookup(
  palette: PaletteEntry[],
  targetCellW: number,
): BrightnessEntry[] {
  const brightnessLookup: BrightnessEntry[] = [];
  for (let brightnessByte = 0; brightnessByte < 256; brightnessByte++) {
    const brightness = brightnessByte / 255;
    const monoChar =
      MONO_RAMP[Math.min(MONO_RAMP.length - 1, (brightness * MONO_RAMP.length) | 0)]!;
    if (brightness < 0.005) {
      // True-black floor: only the very bottom of the byte range renders as
      // empty. The idle ambient+drift in the consumer keeps typical cells
      // above this, so the page always shows a faint dash/dot bed.
      brightnessLookup.push({ monoChar, propHtml: '<span class="cell"> </span>' });
      continue;
    }

    const match = findBest(palette, brightness, targetCellW);
    const alphaIndex = Math.max(1, Math.min(10, Math.round(brightness * 10)));
    brightnessLookup.push({
      monoChar,
      propHtml: `<span class="cell ${wCls(match.weight, match.style)} a${alphaIndex}">${esc(match.char)}</span>`,
    });
  }
  return brightnessLookup;
}
