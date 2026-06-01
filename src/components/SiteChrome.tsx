"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Fixed nav overlay rendered on top of every page that wants the default
 * site chrome. Some routes (e.g. /gallery) take over the viewport and
 * provide their own chrome — they're skipped here.
 *
 * The container is `pointer-events: none` so the underlying experience
 * (e.g. the ripple field) still receives pointer events across the full
 * viewport; individual links opt back in to be clickable.
 *
 * `useSearchParams` is wrapped in Suspense per Next.js requirements; the
 * fallback renders nothing so the chrome simply pops in once hydrated
 * (chrome is purely overlay decoration, never the only content).
 */
export function SiteChrome() {
  return (
    <Suspense fallback={null}>
      <SiteChromeInner />
    </Suspense>
  );
}

function SiteChromeInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname?.startsWith("/gallery")) return null;

  // The "about" link toggles the ?about=1 query param on the home route.
  // Anywhere else, it routes home AND opens about. Either way, clicking
  // again while it's open returns home with the param cleared.
  const aboutOpen = pathname === "/" && searchParams.get("about") === "1";
  const aboutHref = aboutOpen ? "/" : "/?about=1";

  const linkClass =
    "pointer-events-auto hover:opacity-70 transition-opacity duration-150";

  return (
    <nav
      aria-label="Site"
      className="pointer-events-none fixed inset-0 z-10 text-[24px] leading-none text-white md:text-[32px]"
      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-10">
        <Link href="/" className={linkClass}>
          Home
        </Link>
        <Link href="/gallery" className={linkClass}>
          Open gallery
        </Link>
        <Link
          href={aboutHref}
          className={linkClass}
          aria-expanded={aboutOpen}
          aria-controls="about-overlay"
        >
          about
        </Link>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-10">
        <Link href="#" className={linkClass}>
          Link
        </Link>
        <Link href="#" className={linkClass}>
          Link
        </Link>
      </div>
    </nav>
  );
}
