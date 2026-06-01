# Ripple

Full-viewport wave-driven typographic ASCII as the homepage, with a
scroll-snap editorial gallery at `/gallery` and an "about" overlay
toggled on the home route via `?about=1`.

The home page runs a discrete 2D wave equation on the CPU; its amplitude
field drives a typographic-ASCII palette built with [`@chenglou/pretext`](https://github.com/chenglou/pretext).
Three invisible "ghost cursor" wanderers drag splat trails across the
field so the page is always rippling; hover splats ride on top and pin
Moby Dick phrases to whatever the cursor passes.

## Set up on a new machine

This project is fully self-contained — clone, install, run.

```bash
# 1. Use the right Node version. Either:
nvm use            # picks up .nvmrc (Node 22)
# or just install any Node ≥ 22 and skip this step.

# 2. Install dependencies. Uses the public npm registry by default
# (configured in the project-local .npmrc), so corporate registries on
# your machine won't get in the way.
npm install

# 3. Start the dev server.
npm run dev
```

Then open <http://localhost:3000>.

That's it. No environment variables, no API keys, no external services
required.

## Available scripts

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `npm run dev`   | Next.js dev server with Turbopack at `localhost:3000` |
| `npm run build` | Production build into `.next/`                        |
| `npm start`     | Serve the production build (run `build` first)        |
| `npm run lint`  | Lint with the Next.js ESLint config                   |

## Routes

- `/` — the ripple-typo experience (homepage)
- `/?about=1` — about overlay rendered on top of the ripple
- `/gallery` — scroll-snap editorial gallery (7 placeholder artworks)

## Project layout

```
src/
  app/
    layout.tsx              Root layout, mounts SiteChrome
    page.tsx                Home — mounts ripple + about gate
    globals.css             Global resets only
    ripple-typo.css         Color ramp + per-weight classes
    about-overlay.css       About overlay + floating-tile keyframes
    gallery/
      page.tsx              Gallery route + sample data
      GalleryView.tsx       Scroll-snap container, IO active tracking
      gallery.css           Editorial layout + responsive breakpoints
  components/
    SiteChrome.tsx          Fixed nav overlay, hides on /gallery
    AboutGate.tsx           Reads ?about=1, mounts/unmounts overlay
    AboutOverlay.tsx        About markup
    rippleTypo/             Ripple experience
      RippleTypographicAscii.tsx    Frame loop, interactions, stamps
      cpuWave2d.ts                  FDTD wave sim
      typographicAsciiPalette.ts    pretext char palette
  content/
    rippleTypoCorpus.ts     Moby Dick excerpt + phrase splitter
```

## Deploy

Static-friendly Next.js app — works on any Next.js host with zero
config:

- **Vercel** — `vercel deploy` (or push to a connected GitHub repo)
- **Cloudflare Pages** — point at this repo, build command `npm run build`
- **Self-hosted** — `npm run build && npm start` (Node 22+)

No external services, no env vars, no databases.

## Tech

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind v4** (utility classes for chrome only; experiences use
  scoped CSS)
- **TypeScript strict**
- **Node ≥ 22** (enforced in `package.json` `engines`)
