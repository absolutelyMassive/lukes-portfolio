/**
 * WebGL2 2D wave-equation simulator with text exclusion zones.
 *
 * A scalar height field `h` lives in the .r channel of two ping-pong RGBA16F
 * framebuffers (current / previous). Each step advances h via the discrete
 * 2D wave equation on the grid:
 *
 *   h_{t+1} = 2 h_t - h_{t-1} + c^2 · (h_L + h_R + h_T + h_B - 4 h_t)
 *   h_{t+1} *= damping
 *
 * An RGBA8 "mask" texture is uploaded from the text canvas. Where
 * mask.a > threshold we treat the cell as solid:
 *   - inside an obstacle, h is forced to 0 (Dirichlet);
 *   - at a free cell whose neighbor is an obstacle, we replace the neighbor
 *     sample with the current cell's h (reflecting Neumann), so ripples
 *     bounce off the glyph edges instead of dissipating through them.
 *
 * Display samples the height field and its slope to render a dark water
 * surface with a subtle specular highlight on wave crests. The text itself
 * is painted on a separate canvas stacked above this one, unchanged.
 */

export type FluidSimHandle = {
  resize(cssWidth: number, cssHeight: number): void;
  /** Upload (or re-upload) the text canvas as the obstacle mask. */
  updateMask(source: HTMLCanvasElement): void;
  /** Drop a ripple at a normalized point (x ∈ [0,1], y ∈ [0,1] with y-up). */
  splat(xNorm: number, yNorm: number, strength?: number): void;
  dispose(): void;
};

export type FluidSimOptions = {
  /** Grid pixels along the longer side. 512–1024 is a good range. */
  gridLongSide?: number;
  /** Wave speed squared. Must satisfy c² ≤ 0.5 for 2-D stability. */
  waveSpeed2?: number;
  /** Per-step damping multiplier. 1.0 = undamped; 0.995 = very long ripples. */
  damping?: number;
  /** Steps per animation frame. More steps → ripples travel farther per frame. */
  stepsPerFrame?: number;
  /** Gaussian splat radius in normalized units (0..1). */
  splatRadius?: number;
  /** Peak height added per splat. */
  splatStrength?: number;
  /** Scene background color (the "water" base color). */
  bgColor?: readonly [number, number, number];
  /** Tint applied to height: positive crests brighten toward this. */
  waterColor?: readonly [number, number, number];
  /** Specular highlight color on wave slopes. */
  highlightColor?: readonly [number, number, number];
  /** Visual exposure on h when shading (doesn't affect sim). */
  displayExposure?: number;
};

type FBO = {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
};

type DoubleFBO = {
  read: FBO;
  write: FBO;
  swap(): void;
  width: number;
  height: number;
};

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Each height texel packs two time snapshots: .r = h_t, .g = h_{t-1}. This
// lets a single ping-pong pair (2 FBOs) advance the wave equation without
// reading from the same texture it writes to.
const FRAG_STEP = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uState;   // .r = h_t, .g = h_{t-1}
uniform sampler2D uMask;
uniform vec2 uTexelSize;
uniform float uC2;
uniform float uDamping;
out vec4 outColor;

float maskAt(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 1.0;
  return texture(uMask, uv).a;
}

void main() {
  float selfMask = maskAt(vUv);
  if (selfMask > 0.1) { outColor = vec4(0.0); return; }

  vec2 s = texture(uState, vUv).rg;
  float h  = s.r;
  float hp = s.g;

  vec2 uL = vUv - vec2(uTexelSize.x, 0.0);
  vec2 uR = vUv + vec2(uTexelSize.x, 0.0);
  vec2 uT = vUv + vec2(0.0, uTexelSize.y);
  vec2 uB = vUv - vec2(0.0, uTexelSize.y);

  // Reflecting Neumann at outer edges.
  float L = (uL.x < 0.0) ? h : texture(uState, uL).r;
  float R = (uR.x > 1.0) ? h : texture(uState, uR).r;
  float T = (uT.y > 1.0) ? h : texture(uState, uT).r;
  float B = (uB.y < 0.0) ? h : texture(uState, uB).r;

  // Reflecting Neumann at obstacle (glyph) boundaries.
  if (maskAt(uL) > 0.1) L = h;
  if (maskAt(uR) > 0.1) R = h;
  if (maskAt(uT) > 0.1) T = h;
  if (maskAt(uB) > 0.1) B = h;

  float lap = L + R + T + B - 4.0 * h;
  float hn = (2.0 * h - hp + uC2 * lap) * uDamping;
  outColor = vec4(hn, h, 0.0, 1.0);
}`;

// Adds a Gaussian bump to .r (h_t). .g (h_{t-1}) is copied through so the
// wave step can still compute velocity ≈ h - h_prev — that's what gives the
// ripple its outward motion instead of a static bump.
const FRAG_SPLAT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uState;
uniform sampler2D uMask;
uniform vec2 uPoint;
uniform float uRadius;
uniform float uStrength;
uniform float uAspect;
out vec4 outColor;
void main() {
  float m = texture(uMask, vUv).a;
  if (m > 0.1) { outColor = vec4(0.0); return; }
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  float g = exp(-dot(p, p) / max(uRadius, 1e-6)) * uStrength;
  vec2 s = texture(uState, vUv).rg;
  outColor = vec4(s.r + g, s.g, 0.0, 1.0);
}`;

const FRAG_DISPLAY = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uHeight;
uniform sampler2D uMask;
uniform vec2 uTexelSize;
uniform vec3 uBgColor;
uniform vec3 uWaterColor;
uniform vec3 uHighlightColor;
uniform float uExposure;
out vec4 outColor;
void main() {
  float mask = texture(uMask, vUv).a;

  float h  = texture(uHeight, vUv).r * uExposure;
  float hL = texture(uHeight, vUv - vec2(uTexelSize.x, 0.0)).r * uExposure;
  float hR = texture(uHeight, vUv + vec2(uTexelSize.x, 0.0)).r * uExposure;
  float hT = texture(uHeight, vUv + vec2(0.0, uTexelSize.y)).r * uExposure;
  float hB = texture(uHeight, vUv - vec2(0.0, uTexelSize.y)).r * uExposure;

  vec2 slope = vec2(hR - hL, hT - hB) * 1.6;
  vec3 n = normalize(vec3(slope, 1.0));
  vec3 l = normalize(vec3(0.35, 0.55, 1.0));
  float spec = pow(max(dot(n, l), 0.0), 10.0);

  vec3 col = uBgColor + h * uWaterColor + spec * uHighlightColor;
  // Fade toward bg under text so anti-aliased mask edges don't leak highlights
  // into glyph interiors (text canvas on top will paint the letters anyway).
  col = mix(col, uBgColor, clamp(mask, 0.0, 1.0));
  outColor = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("shader create failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "";
    gl.deleteShader(sh);
    throw new Error("shader compile: " + log);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  if (!p) throw new Error("program create failed");
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) ?? "";
    gl.deleteProgram(p);
    throw new Error("program link: " + log);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return p;
}

function uniforms(gl: WebGL2RenderingContext, p: WebGLProgram, names: string[]) {
  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const n of names) u[n] = gl.getUniformLocation(p, n);
  return u;
}

export function createFluidSim(
  canvas: HTMLCanvasElement,
  options: FluidSimOptions = {},
): FluidSimHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const extFloat = gl.getExtension("EXT_color_buffer_float");
  gl.getExtension("OES_texture_float_linear");
  if (!extFloat) return null;

  const {
    gridLongSide = 900,
    waveSpeed2 = 0.35,
    damping = 0.9975,
    stepsPerFrame = 2,
    splatRadius = 0.00018,
    splatStrength = 0.9,
    bgColor = [0.03, 0.045, 0.065],
    waterColor = [0.22, 0.42, 0.95],
    highlightColor = [0.85, 0.92, 1.0],
    displayExposure = 1.2,
  } = options;

  const progStep = link(gl, VERT_SRC, FRAG_STEP);
  const progSplat = link(gl, VERT_SRC, FRAG_SPLAT);
  const progDisplay = link(gl, VERT_SRC, FRAG_DISPLAY);

  const uStep = uniforms(gl, progStep, [
    "uState",
    "uMask",
    "uTexelSize",
    "uC2",
    "uDamping",
  ]);
  const uSplat = uniforms(gl, progSplat, [
    "uState",
    "uMask",
    "uPoint",
    "uRadius",
    "uStrength",
    "uAspect",
  ]);
  const uDisp = uniforms(gl, progDisplay, [
    "uHeight",
    "uMask",
    "uTexelSize",
    "uBgColor",
    "uWaterColor",
    "uHighlightColor",
    "uExposure",
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function drawTo(target: FBO | null) {
    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function createFBO(w: number, h: number): FBO {
    const texture = gl.createTexture();
    if (!texture) throw new Error("texture create failed");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    // Zero-init via texSubImage2D (some drivers leave HALF_FLOAT NaN).
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      w,
      h,
      gl.RGBA,
      gl.FLOAT,
      new Float32Array(w * h * 4),
    );

    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("fbo create failed");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("fbo incomplete");
    }
    return { fbo, texture, width: w, height: h };
  }

  function makeDouble(w: number, h: number): DoubleFBO {
    const a = createFBO(w, h);
    const b = createFBO(w, h);
    const state = { read: a, write: b };
    return {
      width: w,
      height: h,
      get read() {
        return state.read;
      },
      get write() {
        return state.write;
      },
      swap() {
        const t = state.read;
        state.read = state.write;
        state.write = t;
      },
    };
  }

  function disposeFBO(f: FBO) {
    gl.deleteFramebuffer(f.fbo);
    gl.deleteTexture(f.texture);
  }
  function disposeDouble(d: DoubleFBO) {
    disposeFBO(d.read);
    disposeFBO(d.write);
  }

  // Sim grid size tracks canvas aspect, capped to `gridLongSide` on the
  // longer side. The mask texture is uploaded at this same size so every
  // sim cell has a matching mask sample.
  let gridW = 1;
  let gridH = 1;
  let height = makeDouble(gridW, gridH);
  let aspect = 1;

  const maskTex = gl.createTexture();
  if (!maskTex) {
    disposeDouble(height);
    return null;
  }
  gl.bindTexture(gl.TEXTURE_2D, maskTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );

  function computeGrid(cssW: number, cssH: number) {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const pxW = Math.max(1, Math.round(cssW * dpr));
    const pxH = Math.max(1, Math.round(cssH * dpr));
    const longSide = Math.max(pxW, pxH);
    const scale = Math.min(1, gridLongSide / longSide);
    return {
      canvasW: pxW,
      canvasH: pxH,
      gridW: Math.max(2, Math.round(pxW * scale)),
      gridH: Math.max(2, Math.round(pxH * scale)),
    };
  }

  function resize(cssW: number, cssH: number) {
    const g = computeGrid(cssW, cssH);
    if (canvas.width !== g.canvasW) canvas.width = g.canvasW;
    if (canvas.height !== g.canvasH) canvas.height = g.canvasH;
    if (g.gridW === gridW && g.gridH === gridH) return;

    disposeDouble(height);
    gridW = g.gridW;
    gridH = g.gridH;
    height = makeDouble(gridW, gridH);
    aspect = gridW / gridH;
  }

  function updateMask(src: HTMLCanvasElement) {
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      src,
    );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  function splat(xNorm: number, yNorm: number, strength = 1) {
    gl.disable(gl.BLEND);
    gl.useProgram(progSplat);
    gl.uniform1i(uSplat.uState!, 0);
    gl.uniform1i(uSplat.uMask!, 1);
    gl.uniform2f(uSplat.uPoint!, xNorm, yNorm);
    gl.uniform1f(uSplat.uRadius!, splatRadius);
    gl.uniform1f(uSplat.uStrength!, splatStrength * strength);
    gl.uniform1f(uSplat.uAspect!, aspect);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, height.read.texture);
    drawTo(height.write);
    height.swap();
  }

  function step() {
    gl.disable(gl.BLEND);
    gl.useProgram(progStep);
    gl.uniform1i(uStep.uState!, 0);
    gl.uniform1i(uStep.uMask!, 1);
    gl.uniform2f(uStep.uTexelSize!, 1 / gridW, 1 / gridH);
    gl.uniform1f(uStep.uC2!, waveSpeed2);
    gl.uniform1f(uStep.uDamping!, damping);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, height.read.texture);

    drawTo(height.write);
    height.swap();
  }

  function display() {
    gl.disable(gl.BLEND);
    gl.useProgram(progDisplay);
    gl.uniform1i(uDisp.uHeight!, 0);
    gl.uniform1i(uDisp.uMask!, 1);
    gl.uniform2f(uDisp.uTexelSize!, 1 / gridW, 1 / gridH);
    gl.uniform3f(uDisp.uBgColor!, bgColor[0], bgColor[1], bgColor[2]);
    gl.uniform3f(uDisp.uWaterColor!, waterColor[0], waterColor[1], waterColor[2]);
    gl.uniform3f(
      uDisp.uHighlightColor!,
      highlightColor[0],
      highlightColor[1],
      highlightColor[2],
    );
    gl.uniform1f(uDisp.uExposure!, displayExposure);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, height.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, maskTex);

    drawTo(null);
  }

  let raf = 0;
  let disposed = false;
  function frame() {
    if (disposed) return;
    for (let i = 0; i < stepsPerFrame; i++) step();
    display();
    raf = requestAnimationFrame(frame);
  }

  // Kick off with default 1×1 grid; first resize() from the host will
  // re-allocate at real dimensions.
  raf = requestAnimationFrame(frame);

  return {
    resize,
    updateMask,
    splat,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      disposeDouble(height);
      gl.deleteTexture(maskTex);
      gl.deleteBuffer(vbo);
      gl.deleteProgram(progStep);
      gl.deleteProgram(progSplat);
      gl.deleteProgram(progDisplay);
    },
  };
}
