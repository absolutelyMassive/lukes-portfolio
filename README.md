# Ripple

Full-viewport wave-driven typographic ASCII. A discrete 2D wave equation runs on the CPU; its amplitude field drives a typographic-ASCII palette built with [`@chenglou/pretext`](https://github.com/chenglou/pretext). Three invisible "ghost cursor" wanderers drag splat trails across the field so the page is always rippling; hover splats ride on top and pin Moby Dick phrases to whatever the cursor passes.

## Develop

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Build & deploy

```bash
npm run build
npm start
```

Deploys cleanly to any Next.js host (Vercel, Cloudflare Pages, self-hosted Node).

## Project layout

- `src/app/page.tsx` — root route, mounts the experience
- `src/app/ripple-typo.css` — palette (color ramp + per-weight classes)
- `src/components/rippleTypo/RippleTypographicAscii.tsx` — interaction + frame loop
- `src/components/rippleTypo/cpuWave2d.ts` — FDTD wave sim
- `src/components/rippleTypo/typographicAsciiPalette.ts` — pretext-driven char palette + brightness lookup
- `src/content/rippleTypoCorpus.ts` — Moby Dick excerpt + phrase splitter
