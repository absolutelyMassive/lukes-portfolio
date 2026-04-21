import type { CSSProperties } from "react";
import {
  figmaRectToPercentStyle,
  type FigmaRect,
} from "@/data/collageLayout";

/** One raster for `next/image` (local `/…` or allowed remote host). */
export type CollageImage = {
  src: string;
  alt: string;
};

export type CollageSatellite = {
  image: CollageImage;
  /** Absolute box within the hero — from Figma `floatingImage` rects → %. */
  style: CSSProperties;
};

export type ProjectCollage = {
  main: CollageImage;
  /** Figma `staticImage` rect → % (same geometry on Project 1–4 frames). */
  mainStyle: CSSProperties;
  satellites: readonly [
    CollageSatellite,
    CollageSatellite,
    CollageSatellite,
    CollageSatellite,
    CollageSatellite,
  ];
};

export type Project = {
  id: string;
  title: string;
  /** Shown on the collapsed row, right-aligned (Figma “Status”). */
  status: string;
  description: string;
  caseStudyHref?: string;
  collage: ProjectCollage;
};

/** Shared across frames 18:225, 18:556, 18:607, 18:658 (`staticImage`). */
const FIGMA_STATIC_IMAGE: FigmaRect = {
  x: 561,
  y: 122,
  width: 319,
  height: 690,
};

/**
 * Satellite order = Figma layer list order for nodes named `floatingImage`
 * (top → bottom in the frame’s child stack), five rects → s0…s4.
 */
const FLOATING_PROJECT_1: readonly FigmaRect[] = [
  { x: 1308, y: 727, width: 229, height: 229 },
  { x: 1202, y: 30, width: 221, height: 221 },
  { x: 0, y: -69, width: 227, height: 227 },
  { x: 238, y: 573, width: 204, height: 204 },
  { x: -127, y: 256, width: 254, height: 254 },
];

const FLOATING_PROJECT_2: readonly FigmaRect[] = [
  { x: 1350, y: 335, width: 229, height: 229 },
  { x: 1015, y: 172, width: 221, height: 221 },
  { x: -37, y: 424, width: 227, height: 227 },
  { x: -87, y: -97, width: 254, height: 254 },
  { x: 274, y: 244, width: 204, height: 204 },
];

const FLOATING_PROJECT_3: readonly FigmaRect[] = [
  { x: 967, y: -92, width: 229, height: 229 },
  { x: 1289, y: 295, width: 221, height: 221 },
  { x: -74, y: -25, width: 227, height: 227 },
  { x: 161, y: 340, width: 254, height: 254 },
  { x: -53, y: 754, width: 204, height: 204 },
];

const FLOATING_PROJECT_4: readonly FigmaRect[] = [
  { x: 1293, y: -56, width: 229, height: 229 },
  { x: 1015, y: 366, width: 221, height: 221 },
  { x: 246, y: 30, width: 227, height: 227 },
  { x: -87, y: 279, width: 254, height: 254 },
  { x: 258, y: 645, width: 204, height: 204 },
];

function pic(seed: string, w: number, h: number, alt: string): CollageImage {
  return {
    src: `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`,
    alt,
  };
}

function collageFromFigmaFloating(
  id: string,
  label: string,
  floating: readonly FigmaRect[],
): ProjectCollage {
  if (floating.length !== 5) {
    throw new Error(`Expected 5 floating rects for ${id}`);
  }
  const mainStyle = figmaRectToPercentStyle(FIGMA_STATIC_IMAGE);
  return {
    main: pic(`${id}-hero`, 640, 800, `${label} — main`),
    mainStyle,
    satellites: [
      {
        image: pic(`${id}-s0`, 458, 458, `${label} — satellite 1`),
        style: figmaRectToPercentStyle(floating[0]!),
      },
      {
        image: pic(`${id}-s1`, 442, 442, `${label} — satellite 2`),
        style: figmaRectToPercentStyle(floating[1]!),
      },
      {
        image: pic(`${id}-s2`, 520, 520, `${label} — satellite 3`),
        style: figmaRectToPercentStyle(floating[2]!),
      },
      {
        image: pic(`${id}-s3`, 480, 480, `${label} — satellite 4`),
        style: figmaRectToPercentStyle(floating[3]!),
      },
      {
        image: pic(`${id}-s4`, 500, 500, `${label} — satellite 5`),
        style: figmaRectToPercentStyle(floating[4]!),
      },
    ],
  };
}

/**
 * Add a project: append to `projects` and either reuse a `FLOATING_PROJECT_*`
 * tuple or define a new `readonly FigmaRect[]` from Figma (frame 1440×900),
 * then `collageFromFigmaFloating(id, label, rects)`.
 */
export const projects: Project[] = [
  {
    id: "p1",
    title: "Lukes First Project",
    status: "Shipped",
    description:
      "Enhance your stories, reels, posts, with hundreds of engaging templates",
    caseStudyHref: "#",
    collage: collageFromFigmaFloating(
      "p1",
      "Project one",
      FLOATING_PROJECT_1,
    ),
  },
  {
    id: "p2",
    title: "Project Name",
    status: "In progress",
    description:
      "Second project placeholder copy for scroll and timer demos.",
    caseStudyHref: "#",
    collage: collageFromFigmaFloating(
      "p2",
      "Project two",
      FLOATING_PROJECT_2,
    ),
  },
  {
    id: "p3",
    title: "Project Name",
    status: "Concept",
    description:
      "Third project placeholder — swap with real case studies later.",
    caseStudyHref: "#",
    collage: collageFromFigmaFloating(
      "p3",
      "Project three",
      FLOATING_PROJECT_3,
    ),
  },
  {
    id: "p4",
    title: "Project Name",
    status: "Research",
    description: "Fourth project placeholder description text.",
    caseStudyHref: "#",
    collage: collageFromFigmaFloating(
      "p4",
      "Project four",
      FLOATING_PROJECT_4,
    ),
  },
];

export const AUTO_ADVANCE_MS = 8000;

/**
 * When false, the timed carousel does not advance and the list progress bar stays idle.
 * Turn back to `true` when you want auto-advance again.
 */
export const AUTO_ADVANCE_ENABLED = false;

/** Snap-first; set true to quantize wheel to one section per gesture. */
export const WHEEL_STEP_SECTIONS = false;
