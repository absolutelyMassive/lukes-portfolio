/**
 * HeroCollage — full-bleed imagery behind each project section.
 *
 * Data comes from `project.collage` in `@/data/projects`:
 * - `main` + `mainStyle`: hero image and its box — from Figma `staticImage` (1440×900 → %).
 * - `satellites`: five tiles; each has `image` + `style` from Figma `floatingImage` rects → %.
 *
 * Layout model:
 * - Root fills the section (`absolute inset-0` so it matches the parent `<section>`).
 * - All boxes use `position: absolute` with `%` from `figmaRectToPercentStyle` in `@/data/collageLayout`.
 * - Main uses `z-[1]`; satellites `z-0`.
 *
 * Images use `next/image` with `fill` + `object-cover`: the parent must be `position: relative`
 * (here via `absolute` wrappers) and have a defined size — `fill` stretches the img to that box.
 */
import type { ProjectCollage } from "@/data/projects";
import Image from "next/image";

type HeroCollageProps = {
  collage: ProjectCollage;
  /**
   * Section index from the parent. Only used so the first project’s main image gets
   * `priority` — tells Next.js to preload it (helps LCP on the initial viewport).
   */
  variant?: number;
};

/** Stable React keys; order matches `ProjectCollage.satellites` (length 5). */
const SATELLITE_IDS = ["s0", "s1", "s2", "s3", "s4"] as const;

export function HeroCollage({ collage, variant = 0 }: HeroCollageProps) {
  return (
    // Layer root: clips to section; `min-w-0` avoids flex/grid children overflowing width.
    <div className="absolute inset-0 z-0 w-full min-w-0">
      {SATELLITE_IDS.map((id, i) => {
        const { image, style } = collage.satellites[i]!;
        return (
          <div
            key={id}
            className="absolute z-0 overflow-hidden rounded-md bg-[#1a1a1a]"
            // Layout from Figma-derived rects in `src/data/projects.ts`.
            style={style}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1100px) 28vw, 240px"
              draggable={false}
            />
          </div>
        );
      })}

      {/* Main hero: box from `collage.mainStyle` (Figma `staticImage`). */}
      <div
        className="absolute z-[1] overflow-hidden rounded-md bg-[#1a1a1a]"
        style={collage.mainStyle}
      >
        <Image
          src={collage.main.src}
          alt={collage.main.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1100px) 70vw, 320px"
          priority={variant === 0}
          draggable={false}
        />
      </div>
    </div>
  );
}
