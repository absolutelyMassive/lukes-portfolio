"use client";

import { useEffect, useRef } from "react";
import { CpuWave2D } from "./cpuWave2d";
import {
  buildBrightnessLookup,
  buildPalette,
  type BrightnessEntry,
  type PaletteEntry,
} from "./typographicAsciiPalette";

const FIELD_OVERSAMPLE = 2;
const MAX_FIELD_CELLS = 130_000;
const WAVE_SUBSTEPS = 2;
const SPLAT_SIGMA_CELLS = 3.2;

type DimState = {
  cols: number;
  rows: number;
  fieldCols: number;
  fieldRows: number;
  fontSize: number;
  lineHeight: number;
  targetRowW: number;
  targetCellW: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function computeDims(innerW: number, innerH: number): DimState {
  const w = Math.max(200, Math.floor(innerW));
  const h = Math.max(200, Math.floor(innerH));

  let fontSize = Math.round(clamp(w / 90, 12, 17));
  let lineHeight = fontSize + 3;
  let rows = Math.floor(h / lineHeight);
  rows = clamp(rows, 14, 96);

  const targetRowW = w;
  const minCellW = 7.2;
  let cols = Math.floor(targetRowW / minCellW);
  cols = clamp(cols, 28, 220);

  let targetCellW = targetRowW / cols;

  let oversample = FIELD_OVERSAMPLE;
  let fieldCols = cols * oversample;
  let fieldRows = rows * oversample;

  while (fieldCols * fieldRows > MAX_FIELD_CELLS && cols > 32) {
    cols -= 2;
    targetCellW = targetRowW / cols;
    fieldCols = cols * oversample;
    fieldRows = rows * oversample;
  }
  while (fieldCols * fieldRows > MAX_FIELD_CELLS && rows > 20) {
    rows -= 2;
    fieldCols = cols * oversample;
    fieldRows = rows * oversample;
  }
  if (fieldCols * fieldRows > MAX_FIELD_CELLS) {
    oversample = 1;
    fieldCols = cols * oversample;
    fieldRows = rows * oversample;
  }

  return {
    cols,
    rows,
    fieldCols,
    fieldRows,
    fontSize,
    lineHeight,
    targetRowW,
    targetCellW,
  };
}

/**
 * Full-viewport wave-driven typographic ASCII (pretext-measured palette).
 */
export function RippleTypographicAscii() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowsHostRef = useRef<HTMLDivElement | null>(null);
  const rowElsRef = useRef<HTMLDivElement[]>([]);
  const waveRef = useRef<CpuWave2D | null>(null);
  const dimRef = useRef<DimState | null>(null);

  const paletteRef = useRef<PaletteEntry[] | null>(null);
  const lookupRef = useRef<BrightnessEntry[] | null>(null);
  const lastLookupCellWRef = useRef(0);
  const lastPaletteFontSizeRef = useRef(-1);

  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const ampMaxRef = useRef(0.006);
  const rafRef = useRef(0);
  const pointerDownRef = useRef(false);
  const lastPointRef = useRef<{ fx: number; fy: number } | null>(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    const hostEl = rowsHostRef.current;
    if (!rootEl || !hostEl) return;
    const root: HTMLDivElement = rootEl;
    /** Rows container; narrowed for nested callbacks (TS control flow). */
    const rowsMount: HTMLDivElement = hostEl;

    if (!measureCtxRef.current) {
      const mc = document.createElement("canvas");
      mc.width = 28;
      mc.height = 28;
      measureCtxRef.current = mc.getContext("2d", { willReadFrequently: true });
    }
    if (!measureCtxRef.current) return;

    function ensurePaletteAndLookup(dim: DimState) {
      const mctx = measureCtxRef.current;
      if (!mctx) return;

      if (paletteRef.current === null || lastPaletteFontSizeRef.current !== dim.fontSize) {
        paletteRef.current = buildPalette(dim.fontSize, mctx);
        lastPaletteFontSizeRef.current = dim.fontSize;
        lastLookupCellWRef.current = -1;
      }

      const cellW = dim.targetCellW;
      if (
        lookupRef.current === null ||
        Math.abs(cellW - lastLookupCellWRef.current) > cellW * 0.04
      ) {
        lookupRef.current = buildBrightnessLookup(paletteRef.current!, cellW);
        lastLookupCellWRef.current = cellW;
      }
    }

    function layoutRows(dim: DimState) {
      rowsMount.innerHTML = "";
      const rowEls: HTMLDivElement[] = [];
      for (let r = 0; r < dim.rows; r++) {
        const d = document.createElement("div");
        d.className = "rippleTypoRow";
        d.style.height = `${dim.lineHeight}px`;
        d.style.lineHeight = `${dim.lineHeight}px`;
        d.style.fontSize = `${dim.fontSize}px`;
        rowsMount.appendChild(d);
        rowEls.push(d);
      }
      rowElsRef.current = rowEls;
    }

    function applyDims(innerW: number, innerH: number) {
      const dim = computeDims(innerW, innerH);
      dimRef.current = dim;

      ensurePaletteAndLookup(dim);
      layoutRows(dim);

      waveRef.current = new CpuWave2D(dim.fieldCols, dim.fieldRows, {
        waveSpeed2: 0.34,
        damping: 0.996,
      });
      ampMaxRef.current = 0.006;
    }

    applyDims(root.clientWidth, root.clientHeight);

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      applyDims(cr.width, cr.height);
    });
    ro.observe(root);

    function splatNorm(nx: number, ny: number, strength: number) {
      const dim = dimRef.current;
      const wv = waveRef.current;
      if (!dim || !wv) return;
      const fx = nx * dim.fieldCols;
      const fy = ny * dim.fieldRows;
      wv.splat(fx, fy, strength, SPLAT_SIGMA_CELLS);
    }

    function frame() {
      const dim = dimRef.current;
      const wv = waveRef.current;
      const lu = lookupRef.current;
      const rowDivs = rowElsRef.current;
      if (!dim || !wv || !lu || rowDivs.length !== dim.rows) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      wv.stepTimes(WAVE_SUBSTEPS);

      const { fieldCols, cols, rows: rowCount } = dim;
      const os = dim.fieldCols / dim.cols;
      const h = wv.h;
      let localMax = 0;
      for (let i = 0; i < h.length; i++) {
        const a = Math.abs(h[i]!);
        if (a > localMax) localMax = a;
      }
      const am = ampMaxRef.current;
      ampMaxRef.current = Math.max(am * 0.993, localMax, 0.004);
      const denom = ampMaxRef.current;

      const ambient = 0.035;
      const gain = 0.92;

      for (let row = 0; row < rowCount; row++) {
        let propHtml = "";
        const fieldRowStart = row * os * fieldCols;
        for (let col = 0; col < cols; col++) {
          const fieldColStart = col * os;
          let sum = 0;
          for (let sampleY = 0; sampleY < os; sampleY++) {
            const sampleRowOffset = fieldRowStart + sampleY * fieldCols + fieldColStart;
            for (let sampleX = 0; sampleX < os; sampleX++) {
              sum += Math.abs(h[sampleRowOffset + sampleX]!);
            }
          }
          const avg = sum / (os * os);
          const t = clamp((avg / denom) * gain + ambient, 0, 1);
          const brightnessByte = Math.min(255, (t * 255) | 0);
          propHtml += lu[brightnessByte]!.propHtml;
        }
        rowDivs[row]!.innerHTML = propHtml;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    function clientToNormField(e: PointerEvent) {
      const el = rootRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      return {
        nx: clamp(nx, 0, 1),
        ny: clamp(ny, 0, 1),
      };
    }

    function onDown(e: PointerEvent) {
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      pointerDownRef.current = true;
      const p = clientToNormField(e);
      if (!p) return;
      lastPointRef.current = { fx: p.nx * (dimRef.current?.fieldCols ?? 0), fy: p.ny * (dimRef.current?.fieldRows ?? 0) };
      splatNorm(p.nx, p.ny, 1.1);
    }

    function onMove(e: PointerEvent) {
      if (!pointerDownRef.current) return;
      const p = clientToNormField(e);
      if (!p) return;
      const dim = dimRef.current;
      const wv = waveRef.current;
      if (!dim || !wv) return;
      const fx = p.nx * dim.fieldCols;
      const fy = p.ny * dim.fieldRows;
      const prev = lastPointRef.current;
      if (prev) {
        const dx = (fx - prev.fx) / dim.fieldCols;
        const dy = (fy - prev.fy) / dim.fieldRows;
        const speed = Math.hypot(dx, dy);
        if (speed < 0.002) {
          lastPointRef.current = { fx, fy };
          return;
        }
        const steps = Math.min(4, Math.max(1, Math.round(speed * 80)));
        const str = Math.min(0.55, 0.1 + speed * 12);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          wv.splat(prev.fx + (fx - prev.fx) * t, prev.fy + (fy - prev.fy) * t, str, SPLAT_SIGMA_CELLS);
        }
      } else {
        wv.splat(fx, fy, 0.35, SPLAT_SIGMA_CELLS);
      }
      lastPointRef.current = { fx, fy };
    }

    function onUp(e: PointerEvent) {
      try {
        root.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
      pointerDownRef.current = false;
      lastPointRef.current = null;
    }

    function onLeave() {
      pointerDownRef.current = false;
      lastPointRef.current = null;
    }

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("pointerleave", onLeave);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("pointerleave", onLeave);
      waveRef.current = null;
      rowsMount.innerHTML = "";
      rowElsRef.current = [];
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="rippleTypoRoot fixed inset-0 z-0 cursor-crosshair touch-none overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <div ref={rowsHostRef} className="rippleTypoRows flex h-full w-full flex-col items-center justify-center" />
    </div>
  );
}
