"use client";

import { useRouter } from "next/navigation";
import { ABOUT_FLOATING_IMAGES } from "@/content/aboutFloatingImages";
import Image from "next/image";

/**
 * Fixed overlay rendered on top of the home route when ?about=1 is set.
 *
 * - Full-screen backdrop: click closes about (returns to homepage)
 * - Six 200×200 floating photos (Figma 3399:35471)
 *
 * About copy and Download CV live in CenterSection when about is open.
 */
export function AboutOverlay({ visible }: { visible: boolean }) {
  const router = useRouter();

  return (
    <section
      id="about-overlay"
      role="region"
      aria-label="About"
      aria-hidden={!visible}
      className={`aboutOverlay${visible ? " is-visible" : ""}`}
    >
      <button
        type="button"
        className="aboutBackdrop"
        aria-label="Close about"
        tabIndex={visible ? 0 : -1}
        onClick={() => router.push("/")}
      />
      {ABOUT_FLOATING_IMAGES.map((photo) => (
        <div
          key={photo.id}
          className={`aboutFloat ${photo.driftClass}`}
          style={{ top: photo.top, left: photo.left }}
          aria-hidden="true"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            width={200}
            height={200}
            className="aboutFloat-image"
            draggable={false}
          />
        </div>
      ))}
    </section>
  );
}
