"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ABOUT_CV_DOWNLOAD_NAME,
  ABOUT_CV_PATH,
  ABOUT_PARAGRAPHS,
} from "@/content/aboutContent";
import {
  CENTER_SECTION_CAPTION,
  CENTER_SECTION_IMAGES,
  CENTER_SECTION_ZONE_COUNT,
} from "@/content/centerSectionImages";
import { RollNavLink } from "../RollNavLink";
import "../site-chrome.css";
import "./center-section.css";

function zoneFromClientX(clientX: number, width: number): number {
  if (width <= 0) return 0;
  const t = clientX / width;
  const index = Math.floor(t * CENTER_SECTION_ZONE_COUNT);
  return Math.max(0, Math.min(CENTER_SECTION_ZONE_COUNT - 1, index));
}

function CenterSectionInner() {
  const searchParams = useSearchParams();
  const aboutOpen = searchParams.get("about") === "1";
  const [activeIndex, setActiveIndex] = useState(0);

  const updateZone = useCallback((clientX: number) => {
    const next = zoneFromClientX(clientX, window.innerWidth);
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    if (aboutOpen) return;

    const onMove = (event: MouseEvent) => updateZone(event.clientX);
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) updateZone(touch.clientX);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [aboutOpen, updateZone]);

  return (
    <section
      className="centerSection"
      aria-label={aboutOpen ? "About" : "Featured work"}
    >
      <div
        className={`centerSection-imageContainer${aboutOpen ? " is-about" : ""}`}
      >
        <div className="centerSection-imageFrame">
          {aboutOpen ? (
            <div className="centerSection-aboutText is-active">
              {ABOUT_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : (
            CENTER_SECTION_IMAGES.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className={`centerSection-image${index === activeIndex ? " is-active" : ""}`}
                decoding="async"
              />
            ))
          )}
        </div>
        {aboutOpen ? (
          <RollNavLink
            href={ABOUT_CV_PATH}
            download={ABOUT_CV_DOWNLOAD_NAME}
            className="siteNavButton centerSection-download pointer-events-auto"
          >
            Download CV
          </RollNavLink>
        ) : (
          <p className="centerSection-caption">{CENTER_SECTION_CAPTION}</p>
        )}
      </div>
    </section>
  );
}

/**
 * Centered portrait + caption (Figma CenterSection). Default: viewport
 * split into six vertical bands; mouse X picks the image. About mode
 * (?about=1): about copy + Download CV. pointer-events: none except CV link.
 */
export function CenterSection() {
  return (
    <Suspense fallback={null}>
      <CenterSectionInner />
    </Suspense>
  );
}
