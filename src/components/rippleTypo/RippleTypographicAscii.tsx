"use client";

import { useEffect, useRef } from "react";
import { buildPhraseList } from "@/content/rippleTypoCorpus";
import { CpuWave2D } from "./cpuWave2d";
import {
  buildBrightnessLookup,
  buildPalette,
  esc,
  type BrightnessEntry,
  type PaletteEntry,
} from "./typographicAsciiPalette";

const FIELD_OVERSAMPLE = 2;
const MAX_FIELD_CELLS = 130_000;
const WAVE_SUBSTEPS = 3;
const SPLAT_SIGMA_CELLS = 3.2;

/** How many independent Gaussian blobs drive the idle drift field. */
const NUM_DRIFT_BLOBS = 10;

// --- Ambient wanderers (drag curving splat trails across the field) ------
/**
 * Invisible "ghost cursors" that drift continuously around the wave field,
 * each dragging a small splat trail. Per-frame random acceleration nudges
 * their velocity so paths curve organically rather than forming straight
 * lines — the result is non-linear, criss-crossing ripple wakes. Hover
 * splats ride on top of these and still dominate while the user is
 * moving, because hover's per-event strength is much larger and
 * normalization (ampMaxRef) shrinks ambient amplitude relative to hover
 * peaks.
 */
const NUM_AMBIENT_WANDERERS = 8;
const WANDERER_MIN_SPEED = 14; // field cells / sec
const WANDERER_MAX_SPEED = 55; // field cells / sec
const WANDERER_ACCEL = 65; // random velocity wander, field cells / sec^2
const WANDERER_SIGMA_CELLS = 2.6;
const WANDERER_BASE_STRENGTH = 0.0022;
const WANDERER_SPEED_STRENGTH = 0.0022; // added per (cell moved this frame)
const WANDERER_STRENGTH_MAX = 0.012;
const WANDERER_RESPAWN_MARGIN = 10; // cells outside grid before respawn

// --- Phrase-stamp overlay (Moby Dick letters appear inside bright ripples) ---
/**
 * Cells below this brightness ignore any stamp and keep the dash/dot glyph.
 * Mapped against the 10-tier alpha lookup (a1 ≈ 0.0–0.1, a2 ≈ 0.1–0.2, …),
 * so 0.10 means letters show from the a1/a2 boundary upward — the whole
 * ripple envelope, including the faintest tail cells, carries text.
 */
const STAMP_BRIGHTNESS_THRESHOLD = 0.1;
/** Cursor must move at least this many char cells from the last stamp event. */
const STAMP_MIN_SPACING_CELLS = 10;
/** …and at least this long in real time. */
const STAMP_MIN_SPACING_MS = 220;
/**
 * How many rows above/below the anchor row also receive a stamped phrase.
 * Each row gets its OWN phrase from the corpus, so a single cursor splat
 * drops a small vertically-stacked block of words — so as the ripple
 * expands, bright cells on every row it touches resolve to a legible
 * letter instead of palette-picked V/U/N noise.
 */
const STAMP_VERTICAL_RADIUS = 4;
/**
 * Hard cap on concurrently active stamps (oldest pops off when exceeded).
 * One cursor event now pushes up to (2*RADIUS + 1) stamps, so this needs
 * headroom proportional to the expected trail length.
 */
const MAX_ACTIVE_STAMPS = 140;
/** After this long a stamp is unconditionally dropped even if still bright. */
const STAMP_LIFETIME_SEC = 4.5;

/**
 * One drifting Gaussian modulator of the idle brightness bed. Each blob has
 * its own position, wandering velocity, slowly-breathing radius, and signed
 * amplitude. When its lifetime expires (or it drifts far off-grid) it's
 * respawned with new random params — that's what gives the bed its
 * "random blobs that change in size and path" feel instead of the
 * cross-hatched rhythm of a separable sin/cos.
 */
type DriftBlob = {
  x: number; // char-grid col
  y: number; // char-grid row
  vx: number;
  vy: number;
  sigma: number;
  sigmaVel: number;
  amp: number;
  life: number;
};

/**
 * One of the ambient "ghost cursors" dragging a splat trail through the
 * wave field. Positions are in FIELD cells (not character cells).
 */
type Wanderer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

/**
 * A phrase pinned to a specific cell, extending horizontally to the right.
 * Rendered only where the wave-driven brightness at that cell is above
 * `STAMP_BRIGHTNESS_THRESHOLD`, so letters fade in and out with the ripple.
 */
type PhraseStamp = {
  anchorRow: number;
  anchorCol: number;
  chars: string;
  spawnedAt: number; // performance.now() * 0.001
};

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

  // Ceiling kept deliberately modest so bright cells (bold weight + full
  // alpha) don't feel overpowering during a fast hover on wide screens.
  let fontSize = Math.round(clamp(w / 100, 12, 15));
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
  const lastPointRef = useRef<{ fx: number; fy: number } | null>(null);

  const blobsRef = useRef<DriftBlob[] | null>(null);
  const lastFrameTimeRef = useRef(0);
  const driftExpXRef = useRef<Float32Array | null>(null);
  const driftExpYRef = useRef<Float32Array | null>(null);
  const driftRowFactorsRef = useRef<Float32Array>(new Float32Array(NUM_DRIFT_BLOBS));

  const wanderersRef = useRef<Wanderer[] | null>(null);

  const stampsRef = useRef<PhraseStamp[]>([]);
  const phrasesRef = useRef<string[]>([]);
  const phraseCursorRef = useRef(0);
  const lastStampRef = useRef<{ row: number; col: number; tSec: number } | null>(null);

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

    if (phrasesRef.current.length === 0) {
      phrasesRef.current = buildPhraseList();
      // Start on a random phrase so reloading doesn't always show "call me
      // ishmael" first.
      phraseCursorRef.current = Math.floor(
        Math.random() * Math.max(1, phrasesRef.current.length),
      );
    }

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

    function spawnBlob(cols: number, rows: number): DriftBlob {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 5.5; // cells / second
      const sigmaBase = Math.min(cols, rows) * 0.12; // scale with grid
      return {
        x: Math.random() * cols,
        y: Math.random() * rows,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        sigma: sigmaBase * (0.5 + Math.random() * 1.4),
        sigmaVel: (Math.random() - 0.5) * sigmaBase * 0.4,
        amp: (Math.random() * 2 - 1) * 0.028, // signed — blobs can brighten or dim
        life: 5 + Math.random() * 9, // 5–14 sec
      };
    }

    function spawnWanderer(fCols: number, fRows: number): Wanderer {
      const angle = Math.random() * Math.PI * 2;
      const speed =
        WANDERER_MIN_SPEED + Math.random() * (WANDERER_MAX_SPEED - WANDERER_MIN_SPEED);
      return {
        x: Math.random() * fCols,
        y: Math.random() * fRows,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    }

    function applyDims(innerW: number, innerH: number) {
      const dim = computeDims(innerW, innerH);
      dimRef.current = dim;

      ensurePaletteAndLookup(dim);
      layoutRows(dim);

      // (Re)seed blobs + buffers when the grid size changes so the drift
      // field adapts to the new cols/rows.
      blobsRef.current = Array.from({ length: NUM_DRIFT_BLOBS }, () =>
        spawnBlob(dim.cols, dim.rows),
      );
      driftExpXRef.current = new Float32Array(NUM_DRIFT_BLOBS * dim.cols);
      driftExpYRef.current = new Float32Array(NUM_DRIFT_BLOBS * dim.rows);
      lastFrameTimeRef.current = 0;

      waveRef.current = new CpuWave2D(dim.fieldCols, dim.fieldRows, {
        waveSpeed2: 0.26,
        // Lean into sloshing: less global friction, bouncier edges, and a
        // small but non-zero velocityDamp so crossing wavefronts still
        // eventually settle instead of ringing forever.
        damping: 0.993,
        edgeReflect: 0.9,
        velocityDamp: 0.018,
      });
      ampMaxRef.current = 0.006;
      // (Re)seed the ambient wanderers so they match the new field size.
      wanderersRef.current = Array.from({ length: NUM_AMBIENT_WANDERERS }, () =>
        spawnWanderer(dim.fieldCols, dim.fieldRows),
      );
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

      // Ambient wanderers — drag curving splat trails across the field so
      // the resting state is continuously rippling. Each wanderer is an
      // invisible ghost cursor with its own wandering velocity; per-frame
      // random acceleration keeps paths non-linear. We reuse `dt` from the
      // drift-blob block further down; for wanderer updates we clamp here
      // so the first frame after mount doesn't teleport anything.
      {
        const nowS = performance.now() * 0.001;
        const prevS = lastFrameTimeRef.current;
        const wdt = prevS > 0 ? Math.min(0.1, nowS - prevS) : 1 / 60;
        const wanderers = wanderersRef.current!;
        for (let i = 0; i < wanderers.length; i++) {
          const w = wanderers[i]!;
          const prevX = w.x;
          const prevY = w.y;

          w.vx += (Math.random() - 0.5) * 2 * WANDERER_ACCEL * wdt;
          w.vy += (Math.random() - 0.5) * 2 * WANDERER_ACCEL * wdt;
          const sp = Math.hypot(w.vx, w.vy);
          if (sp > WANDERER_MAX_SPEED) {
            const k = WANDERER_MAX_SPEED / sp;
            w.vx *= k;
            w.vy *= k;
          } else if (sp < WANDERER_MIN_SPEED && sp > 0) {
            const k = WANDERER_MIN_SPEED / sp;
            w.vx *= k;
            w.vy *= k;
          }

          w.x += w.vx * wdt;
          w.y += w.vy * wdt;

          if (
            w.x < -WANDERER_RESPAWN_MARGIN ||
            w.x > dim.fieldCols + WANDERER_RESPAWN_MARGIN ||
            w.y < -WANDERER_RESPAWN_MARGIN ||
            w.y > dim.fieldRows + WANDERER_RESPAWN_MARGIN
          ) {
            wanderers[i] = spawnWanderer(dim.fieldCols, dim.fieldRows);
            continue;
          }

          // Strength scales with distance moved so fast wanderers leave a
          // visibly denser wake than slow ones — same feel as the hover
          // line-splat but weaker per-segment.
          const segDist = Math.hypot(w.x - prevX, w.y - prevY);
          const str = Math.min(
            WANDERER_STRENGTH_MAX,
            WANDERER_BASE_STRENGTH + segDist * WANDERER_SPEED_STRENGTH,
          );
          // Line-splat between prev and new position so at higher speeds
          // the trail stays continuous instead of dotted.
          const steps = Math.min(3, Math.max(1, Math.round(segDist * 0.8)));
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            wv.splat(
              prevX + (w.x - prevX) * t,
              prevY + (w.y - prevY) * t,
              str,
              WANDERER_SIGMA_CELLS,
            );
          }
        }
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
      // Hard-settle to a true flat field once motion is negligible (no drift).
      if (localMax < 4e-5) {
        wv.h.fill(0);
        wv.hp.fill(0);
        localMax = 0;
      }
      const am = ampMaxRef.current;
      ampMaxRef.current = Math.max(am * 0.993, localMax, 0.004);
      const denom = ampMaxRef.current;

      // `ambient` is the "whisper" floor — the minimum brightness every cell
      // gets so the screen never reads as pure black. `gain` controls how
      // hard ripples punch above the bed when the cursor is moving. The
      // idle drift is produced by a small set of drifting Gaussian blobs
      // below (each has a signed amplitude, so some make a soft bright
      // patch and others a soft dim patch).
      const ambient = 0.115;
      const gain = 1.18;

      // ---- Idle drift: advance the blob field ------------------------------
      const now = performance.now() * 0.001;
      const prev = lastFrameTimeRef.current;
      // First frame (or post-resize) has no prior timestamp; cap dt so a tab
      // coming back from the background doesn't teleport every blob.
      const dt = prev > 0 ? Math.min(0.1, now - prev) : 1 / 60;
      lastFrameTimeRef.current = now;

      const blobs = blobsRef.current!;
      const expX = driftExpXRef.current!;
      const expY = driftExpYRef.current!;
      const rowFactors = driftRowFactorsRef.current;
      const nb = blobs.length;

      for (let b = 0; b < nb; b++) {
        const blob = blobs[b]!;
        // Velocity wander — small random acceleration each frame so paths
        // aren't straight lines.
        blob.vx += (Math.random() - 0.5) * 2.4 * dt;
        blob.vy += (Math.random() - 0.5) * 2.4 * dt;
        // Soft speed cap to keep motion legibly slow.
        const speed = Math.hypot(blob.vx, blob.vy);
        const maxSpeed = 7.5;
        if (speed > maxSpeed) {
          const s = maxSpeed / speed;
          blob.vx *= s;
          blob.vy *= s;
        }
        blob.x += blob.vx * dt;
        blob.y += blob.vy * dt;

        // Breathing radius — bounces sigma inside a safe range so blobs
        // grow and shrink as they drift.
        const sigmaMin = 6;
        const sigmaMax = Math.max(12, Math.min(cols, rowCount) * 0.32);
        blob.sigma += blob.sigmaVel * dt;
        if (blob.sigma < sigmaMin) {
          blob.sigma = sigmaMin;
          blob.sigmaVel = Math.abs(blob.sigmaVel);
        } else if (blob.sigma > sigmaMax) {
          blob.sigma = sigmaMax;
          blob.sigmaVel = -Math.abs(blob.sigmaVel);
        }

        blob.life -= dt;
        const offMargin = 40;
        if (
          blob.life <= 0 ||
          blob.x < -offMargin ||
          blob.x > cols + offMargin ||
          blob.y < -offMargin ||
          blob.y > rowCount + offMargin
        ) {
          blobs[b] = spawnBlob(cols, rowCount);
        }
      }

      // Pre-compute axis-separable Gaussian tables — per-blob exp values
      // along each axis. Then every cell is `sum over b of amp_b *
      // expX[b,col] * expY[b,row]`, i.e. a handful of multiply-adds.
      for (let b = 0; b < nb; b++) {
        const blob = blobs[b]!;
        const twoSig2 = 2 * blob.sigma * blob.sigma;
        const bx = blob.x;
        const by = blob.y;
        const baseX = b * cols;
        const baseY = b * rowCount;
        for (let c = 0; c < cols; c++) {
          const dx = c - bx;
          expX[baseX + c] = Math.exp(-(dx * dx) / twoSig2);
        }
        for (let r = 0; r < rowCount; r++) {
          const dy = r - by;
          expY[baseY + r] = Math.exp(-(dy * dy) / twoSig2);
        }
      }

      // ---- Age & bucket phrase stamps -------------------------------------
      // Drop expired stamps once per frame. Anything still alive lands in
      // `stampsByRow` so the hot cell loop only checks the handful of stamps
      // on its own row (usually 0 or 1).
      const stamps = stampsRef.current;
      for (let i = stamps.length - 1; i >= 0; i--) {
        if (now - stamps[i]!.spawnedAt > STAMP_LIFETIME_SEC) stamps.splice(i, 1);
      }
      const stampsByRow: Map<number, PhraseStamp[]> = new Map();
      for (let i = 0; i < stamps.length; i++) {
        const st = stamps[i]!;
        if (st.anchorRow < 0 || st.anchorRow >= rowCount) continue;
        const bucket = stampsByRow.get(st.anchorRow);
        if (bucket) bucket.push(st);
        else stampsByRow.set(st.anchorRow, [st]);
      }

      // ---- Render rows -----------------------------------------------------
      for (let row = 0; row < rowCount; row++) {
        let propHtml = "";
        const fieldRowStart = row * os * fieldCols;
        const rowStamps = stampsByRow.get(row);

        // Collapse row-side Gaussian into per-blob factor for this row so the
        // hot inner column loop only does one multiply per blob.
        for (let b = 0; b < nb; b++) {
          rowFactors[b] = blobs[b]!.amp * expY[b * rowCount + row]!;
        }

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

          let drift = 0;
          for (let b = 0; b < nb; b++) {
            drift += rowFactors[b]! * expX[b * cols + col]!;
          }

          const t = clamp((avg / denom) * gain + ambient + drift, 0, 1);
          const brightnessByte = Math.min(255, (t * 255) | 0);
          const entry = lu[brightnessByte]!;

          // Stamp override: if this cell falls within an active phrase's
          // horizontal extent and the brightness is above threshold, render
          // the phrase letter with the brightness-derived weight/alpha. Spaces
          // in the phrase fall through to the palette so word gaps look like
          // the surrounding dash/dot bed.
          let stampChar: string | null = null;
          if (rowStamps && t >= STAMP_BRIGHTNESS_THRESHOLD) {
            for (let s = 0; s < rowStamps.length; s++) {
              const st = rowStamps[s]!;
              const offset = col - st.anchorCol;
              if (offset >= 0 && offset < st.chars.length) {
                const ch = st.chars.charAt(offset);
                if (ch !== " ") {
                  stampChar = ch;
                  break;
                }
              }
            }
          }

          if (stampChar !== null) {
            propHtml += `<span class="cell ${entry.weightClass} a${entry.alphaIndex}">${esc(stampChar)}</span>`;
          } else {
            propHtml += entry.propHtml;
          }
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

    /**
     * Drop a vertical stack of phrase stamps at the cell under the cursor.
     * Each row in the band (±STAMP_VERTICAL_RADIUS around the anchor) pulls
     * a DIFFERENT phrase from the corpus, with small horizontal jitter so
     * the block reads as a loose found-poem rather than a rigid rectangle.
     * Cooldowns keep rapid pointermove spam from flooding the overlay.
     */
    function maybeStamp(nx: number, ny: number) {
      const dim = dimRef.current;
      const phrases = phrasesRef.current;
      if (!dim || phrases.length === 0) return;
      const anchorRow = clamp(Math.floor(ny * dim.rows), 0, dim.rows - 1);
      const anchorCol = clamp(Math.floor(nx * dim.cols), 0, dim.cols - 1);
      const tSec = performance.now() * 0.001;
      const last = lastStampRef.current;
      if (last) {
        if (tSec - last.tSec < STAMP_MIN_SPACING_MS / 1000) return;
        if (
          Math.hypot(anchorRow - last.row, anchorCol - last.col) <
          STAMP_MIN_SPACING_CELLS
        )
          return;
      }

      const stamps = stampsRef.current;
      const nPhrases = phrases.length;
      for (let dr = -STAMP_VERTICAL_RADIUS; dr <= STAMP_VERTICAL_RADIUS; dr++) {
        const r = anchorRow + dr;
        if (r < 0 || r >= dim.rows) continue;
        const phrase = phrases[phraseCursorRef.current % nPhrases]!;
        phraseCursorRef.current++;
        // Jitter the horizontal origin per row so phrases don't all start at
        // the exact same column (keeps the block feeling organic). Shift is
        // larger on rows further from the anchor to suggest radial spread.
        const absDr = Math.abs(dr);
        const jitterRange = 2 + absDr * 2;
        const jitter = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange;
        // Also nudge the start left a bit so the phrase tends to span through
        // the anchor column rather than always starting there.
        const startBias = Math.floor(phrase.length * 0.3);
        const col = anchorCol - startBias + jitter;
        stamps.push({ anchorRow: r, anchorCol: col, chars: phrase, spawnedAt: tSec });
      }
      while (stamps.length > MAX_ACTIVE_STAMPS) stamps.shift();
      lastStampRef.current = { row: anchorRow, col: anchorCol, tSec };
    }

    /**
     * Hover-driven splats: every pointermove inside the root leaves a ripple
     * trail. A small click still produces a bigger "pebble drop" accent.
     */
    function onDown(e: PointerEvent) {
      const p = clientToNormField(e);
      if (!p) return;
      const dim = dimRef.current;
      if (dim) {
        lastPointRef.current = {
          fx: p.nx * dim.fieldCols,
          fy: p.ny * dim.fieldRows,
        };
      }
      splatNorm(p.nx, p.ny, 0.9);
      maybeStamp(p.nx, p.ny);
    }

    function onMove(e: PointerEvent) {
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
        const steps = Math.min(4, Math.max(1, Math.round(speed * 70)));
        const str = Math.min(0.4, 0.06 + speed * 9);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          wv.splat(prev.fx + (fx - prev.fx) * t, prev.fy + (fy - prev.fy) * t, str, SPLAT_SIGMA_CELLS);
        }
        maybeStamp(p.nx, p.ny);
      } else {
        wv.splat(fx, fy, 0.15, SPLAT_SIGMA_CELLS);
      }
      lastPointRef.current = { fx, fy };
    }

    function onLeave() {
      lastPointRef.current = null;
    }

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointercancel", onLeave);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointercancel", onLeave);
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
      <div ref={rowsHostRef} className="rippleTypoRows flex h-full w-full flex-col items-stretch justify-center" />
    </div>
  );
}
