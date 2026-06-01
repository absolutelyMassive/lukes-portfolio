"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AboutOverlay } from "./AboutOverlay";

/** Must match the CSS opacity transition on `.aboutOverlay`. */
const FADE_MS = 280;

/**
 * Tiny client-side gate that watches `?about=1` and mounts the overlay
 * with a symmetric fade-in / fade-out.
 *
 * Two-stage state machine so close animations can finish:
 * - `mounted` controls whether <AboutOverlay /> is in the React tree at all
 * - `visible` controls whether it has the `.is-visible` class (opacity 1)
 *
 * Open:  open flips true → mount → next frame, set visible true → CSS
 *        transitions opacity 0 → 1.
 * Close: open flips false → set visible false → CSS transitions opacity
 *        1 → 0. After FADE_MS, unmount.
 */
export function AboutGate() {
  const searchParams = useSearchParams();
  const open = searchParams.get("about") === "1";
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // RAF so the element exists in the DOM with `is-visible` absent
      // for one paint before we add it. Without this the transition is
      // skipped (browser sees no "before" state to interpolate from).
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;
  return <AboutOverlay visible={visible} />;
}
