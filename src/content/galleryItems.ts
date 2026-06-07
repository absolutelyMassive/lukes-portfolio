import type { GalleryItem } from "@/app/gallery/GalleryView";

/** Base path for gallery stills (files live in `public/gallery/images/`). */
export const GALLERY_IMAGE_DIR = "/gallery/images";

/** Base path for gallery films (files live in `public/gallery/videos/`). */
export const GALLERY_VIDEO_DIR = "/gallery/videos";

/**
 * Gallery artworks in display order.
 * `meta` is the grey accompanying line shown next to the title in the top nav.
 */
export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "Unfold",
    meta: "New navigation systems",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Unfold1.mp4`,
  },
  {
    id: 2,
    title: "Unfold",
    meta: "Social video timeline editor",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Unfold2.mp4`,
  },
  {
    id: 3,
    title: "Unfold",
    meta: "Boutique custom templates",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/Unfold3.png`,
  },
  {
    id: 4,
    title: "Waking Up",
    meta: "Logo",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/WU1.mp4`,
  },
  {
    id: 5,
    title: "Waking Up",
    meta: "Content discoverability",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/WU2.mp4`,
  },
  {
    id: 6,
    title: "Waking Up",
    meta: "Content Pack to Player",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/WU3.mp4`,
  },
  {
    id: 7,
    title: "Squarespace",
    meta: "GAAP compliant invoicing",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/IV1.mp4`,
  },
  {
    id: 8,
    title: "Squarespace App vision setting",
    meta: "AI commerce solutions vision",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/SQSPAPP1.mp4`,
  },
  {
    id: 9,
    title: "Squarespace App vision setting",
    meta: "In-app financial solutions homepage",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/SQSPAPP2.png`,
  },
  {
    id: 10,
    title: "Squarespace App vision setting",
    meta: "Analytics and earnings",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/SQSPAPP3.png`,
  },
  {
    id: 11,
    title: "Ramo",
    meta: "Mobile social events service",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Ramo.mp4`,
  },
  {
    id: 12,
    title: "Aryze",
    meta: "Diverse housing developers",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Aryze1.mp4`,
  },
  {
    id: 13,
    title: "Aryze",
    meta: "Diverse housing developers",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/Aryze2.png`,
  },
  {
    id: 14,
    title: "Aryze",
    meta: "Diverse housing developers",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/Aryze3.png`,
  },
  {
    id: 15,
    title: "Dapper Labs",
    meta: "Cross-platform design systems",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/DapperLabs1.png`,
  },
  {
    id: 16,
    title: "Dapper Labs",
    meta: "Cross-platform design systems",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/DapperLabs2.png`,
  },
];
