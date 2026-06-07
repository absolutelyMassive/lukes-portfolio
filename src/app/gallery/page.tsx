import type { Metadata } from "next";
import { GALLERY_ITEMS } from "@/content/galleryItems";
import { GalleryView } from "./GalleryView";
import "./gallery.css";

export const metadata: Metadata = {
  title: "Gallery — Ripple",
  description:
    "Cinematic editorial gallery with scroll-snap navigation between artworks.",
};

export default function GalleryPage() {
  return <GalleryView items={GALLERY_ITEMS} />;
}
