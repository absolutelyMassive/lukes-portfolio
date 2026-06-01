"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type GalleryItem = {
  id: number;
  title: string;
  meta?: string;
  kind: "image" | "video";
  /** Optional media URL. When null, a neutral placeholder is shown. */
  src: string | null;
};

type Props = {
  items: GalleryItem[];
};

/**
 * Cinematic, scroll-snap-driven editorial gallery.
 *
 * Desktop / tablet: each artwork pins to a full-viewport section with
 * `scroll-snap-align: start`. A vertical index of 01–0N on the left
 * tracks the active section via IntersectionObserver — clicking a number
 * smoothly scrolls to that section. Videos autoplay while their section
 * is the active one and pause otherwise.
 *
 * Mobile: the same DOM structure ships, but CSS disables scroll-snap and
 * reflows each section to its natural height (see `gallery.css`). It
 * reads as a clean stacked feed without losing the chrome (Title / Close
 * / index nav).
 */
export function GalleryView({ items }: Props) {
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track the section closest to the viewport center as "active". Used
  // for the index highlight, the displayed title, and video play/pause.
  useEffect(() => {
    const sections = sectionRefs.current.filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the largest intersectionRatio that is
        // currently above 0.5 — that's the section most "in view".
        let best: { idx: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (entry.intersectionRatio < 0.5) continue;
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isNaN(idx)) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { idx, ratio: entry.intersectionRatio };
          }
        }
        if (best) setActiveIndex(best.idx);
      },
      { threshold: [0.5, 0.75, 0.95] },
    );

    for (const section of sections) io.observe(section);
    return () => io.disconnect();
  }, []);

  // Pause every video except the active one. Muted + playsInline means
  // mobile browsers honor autoplay.
  useEffect(() => {
    const videos = videoRefs.current;
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v) continue;
      if (i === activeIndex) {
        v.play().catch(() => {
          /* autoplay blocked — fine, user can tap to play */
        });
      } else {
        v.pause();
      }
    }
  }, [activeIndex]);

  function scrollToIndex(idx: number) {
    const target = sectionRefs.current[idx];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const active = items[activeIndex];
  const padded = (n: number) => String(n).padStart(2, "0");
  const helvetica =
    '"Helvetica Neue", Helvetica, Arial, sans-serif';

  return (
    <div
      className="galleryRoot"
      style={{ fontFamily: helvetica }}
      aria-label="Gallery"
    >
      {/* Top-left: title of the currently visible artwork. The aria-live
        * region announces title changes for screen readers as the user
        * scrolls between pieces. */}
      <header
        className="galleryHeader"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="galleryTitle">{active?.title ?? ""}</div>
      </header>

      {/* Top-right: Close → home */}
      <Link href="/" className="galleryClose" aria-label="Close gallery">
        Close
      </Link>

      {/* Left edge: number index. Each is a button so it's keyboard- and
        * screen-reader-friendly. */}
      <nav className="galleryIndex" aria-label="Artworks">
        <ol>
          {items.map((item, idx) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollToIndex(idx)}
                aria-current={idx === activeIndex ? "true" : undefined}
                aria-label={`Go to ${item.title}`}
                className={idx === activeIndex ? "is-active" : ""}
              >
                {padded(idx + 1)}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Scroll-snap container. The same DOM also serves as the mobile
        * stacked feed (CSS disables snapping below the breakpoint). */}
      <main className="galleryScroll">
        {items.map((item, idx) => (
          <section
            key={item.id}
            data-index={idx}
            ref={(el) => {
              sectionRefs.current[idx] = el;
            }}
            className="gallerySection"
            aria-label={item.title}
          >
            <div className="galleryFrame">
              {item.kind === "video" ? (
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  className="galleryMedia"
                  src={item.src ?? undefined}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  aria-label={item.title}
                />
              ) : item.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.src}
                  alt={item.title}
                  className="galleryMedia"
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ) : (
                <div className="galleryPlaceholder" aria-hidden="true">
                  <span>{padded(idx + 1)}</span>
                </div>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
