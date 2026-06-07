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
 * Editorial gallery: left index rail (full height), top nav on the right,
 * scroll-snap main stage. Videos autoplay for the active slide only.
 */
export function GalleryView({ items }: Props) {
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const sidebarListRef = useRef<HTMLOListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const sections = sectionRefs.current.filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
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

  useEffect(() => {
    const videos = videoRefs.current;
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v) continue;
      if (i === activeIndex) {
        v.play().catch(() => {
          /* autoplay blocked */
        });
      } else {
        v.pause();
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    const item = sidebarListRef.current?.children[activeIndex];
    const btn = item?.querySelector("button");
    btn?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function scrollToIndex(idx: number) {
    const target = sectionRefs.current[idx];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const active = items[activeIndex];
  const padded = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="galleryRoot" aria-label="Gallery">
      <aside className="gallerySidebar">
        <nav className="gallerySidebarNav" aria-label="Artworks">
          <ol ref={sidebarListRef}>
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
      </aside>

      <header className="galleryTopNav">
        <div
          className="galleryProjectInfo"
          aria-live="polite"
          aria-atomic="true"
        >
          <h1 className="galleryTitle">{active?.title ?? ""}</h1>
          {active?.meta ? (
            <span className="galleryMeta">{active.meta}</span>
          ) : null}
        </div>
        <Link href="/" className="galleryClose" aria-label="Close gallery">
          Close
        </Link>
      </header>

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
