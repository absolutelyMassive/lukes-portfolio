import type { Metadata } from "next";
import { GalleryView, type GalleryItem } from "./GalleryView";
import "./gallery.css";

export const metadata: Metadata = {
  title: "Gallery — Ripple",
  description:
    "Cinematic editorial gallery with scroll-snap navigation between artworks.",
};

/**
 * Seven sample artworks driving the layout. Media is left as null on
 * purpose — drop in real image / video URLs (or local assets in /public)
 * by replacing the `src` field. `kind: "video"` items render a muted
 * autoplaying <video> that pauses while off-screen.
 */
const ITEMS: GalleryItem[] = [
  { id: 1, title: "Lavender Field", meta: "Photography · 2024", kind: "image", src: null },
  { id: 2, title: "Concrete Geometry", meta: "Photography · 2024", kind: "image", src: null },
  { id: 3, title: "Drift", meta: "Video · 2024", kind: "video", src: null },
  { id: 4, title: "Coastline IV", meta: "Photography · 2023", kind: "image", src: null },
  { id: 5, title: "Architectures", meta: "Photography · 2023", kind: "image", src: null },
  { id: 6, title: "Tide", meta: "Video · 2023", kind: "video", src: null },
  { id: 7, title: "Untitled", meta: "Photography · 2022", kind: "image", src: null },
];

export default function GalleryPage() {
  return <GalleryView items={ITEMS} />;
}
