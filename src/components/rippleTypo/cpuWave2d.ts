/**
 * CPU discrete 2D wave equation (FDTD-style) on a regular grid.
 * Same stencil as WebGL `FRAG_STEP` in fluidSim.ts: reflecting Neumann at
 * outer edges, no interior obstacles. Packed time steps use two buffers
 * h_curr / h_prev; each step writes h_next then swaps.
 */

export type CpuWave2DOptions = {
  /** c² in (Δx=1)² units; must stay ≤ 0.5 for explicit stability. */
  waveSpeed2?: number;
  damping?: number;
};

const DEFAULT_C2 = 0.35;
const DEFAULT_DAMPING = 0.996;

export class CpuWave2D {
  cols: number;
  rows: number;
  h: Float32Array;
  hp: Float32Array;
  hn: Float32Array;
  c2: number;
  damping: number;

  constructor(cols: number, rows: number, options: CpuWave2DOptions = {}) {
    if (cols < 2 || rows < 2) throw new Error("CpuWave2D: cols and rows must be >= 2");
    this.cols = cols;
    this.rows = rows;
    const n = cols * rows;
    this.h = new Float32Array(n);
    this.hp = new Float32Array(n);
    this.hn = new Float32Array(n);
    this.c2 = options.waveSpeed2 ?? DEFAULT_C2;
    this.damping = options.damping ?? DEFAULT_DAMPING;
  }

  /** y = 0 is top row; x = 0 is left. Indices row-major: y * cols + x. */
  private idx(x: number, y: number): number {
    return y * this.cols + x;
  }

  clear(): void {
    this.h.fill(0);
    this.hp.fill(0);
    this.hn.fill(0);
  }

  /**
   * Add a Gaussian bump to the current height field (h), same role as the
   * WebGL splat: leaves h_prev unchanged so the wave has velocity.
   */
  splat(
    centerFx: number,
    centerFy: number,
    strength: number,
    sigmaCells: number,
  ): void {
    const { cols, rows, h } = this;
    const cx = Math.max(0, Math.min(cols - 1, centerFx));
    const cy = Math.max(0, Math.min(rows - 1, centerFy));
    const r = Math.max(1, Math.ceil(sigmaCells * 3));
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(cols - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(rows - 1, Math.ceil(cy + r));
    const twoSig2 = 2 * sigmaCells * sigmaCells;
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      const row = y * cols;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const d2 = dx * dx + dy * dy;
        const g = Math.exp(-d2 / twoSig2) * strength;
        h[row + x] += g;
      }
    }
  }

  /** One explicit wave step. */
  step(): void {
    const { cols, rows, h, hp, hn, c2, damping } = this;
    for (let y = 0; y < rows; y++) {
      const row = y * cols;
      for (let x = 0; x < cols; x++) {
        const i = row + x;
        const h0 = h[i]!;
        const hpm1 = hp[i]!;

        const L = x > 0 ? h[i - 1]! : h0;
        const R = x < cols - 1 ? h[i + 1]! : h0;
        const T = y > 0 ? h[i - cols]! : h0;
        const B = y < rows - 1 ? h[i + cols]! : h0;

        const lap = L + R + T + B - 4 * h0;
        hn[i] = (2 * h0 - hpm1 + c2 * lap) * damping;
      }
    }
    const tmp = this.hp;
    this.hp = this.h;
    this.h = this.hn;
    this.hn = tmp;
  }

  /** Run several substeps per animation frame. */
  stepTimes(n: number): void {
    for (let k = 0; k < n; k++) this.step();
  }
}
