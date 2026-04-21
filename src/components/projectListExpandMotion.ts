import type { Transition } from "motion/react";

/**
 * Expand/collapse feel for {@link ProjectListItem}.
 * Imported by `ProjectList.tsx` (and re-exported there) — tweak values here.
 */
export const projectListExpandMotion = {
  /** Panel height + fade (AnimatePresence / motion.div) */
  panel: {
    duration: 0.42,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,
  /** Inner stack: slight lift + fade after panel starts opening */
  content: {
    duration: 0.32,
    delay: 0.05,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,
} as const;

export type ProjectListExpandMotion = typeof projectListExpandMotion;
