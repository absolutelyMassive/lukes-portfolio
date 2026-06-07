"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { RollNavLink } from "./RollNavLink";
import "./site-chrome.css";

/**
 * Fixed nav overlay rendered on top of every page that wants the default
 * site chrome. Some routes (e.g. /gallery) take over the viewport and
 * provide their own chrome — they're skipped here.
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

  const aboutOpen = pathname === "/" && searchParams.get("about") === "1";
  const aboutHref = aboutOpen ? "/" : "/?about=1";

  const buttonClass = "siteNavButton pointer-events-auto";

  return (
    <nav
      aria-label="Site"
      className="pointer-events-none fixed inset-0 z-10"
    >
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-10">
        <RollNavLink href="/" className={buttonClass}>
          Luke
        </RollNavLink>
        <RollNavLink href="/gallery" className={buttonClass}>
          Open gallery
        </RollNavLink>
        <RollNavLink
          href={aboutHref}
          className={`${buttonClass} siteNavButton-about`}
          aria-expanded={aboutOpen}
          aria-controls="about-overlay"
        >
          {aboutOpen ? "Close" : "About"}
        </RollNavLink>
      </div>
      <div className="siteChrome-bottom">
        <RollNavLink
          href="https://www.youtube.com/watch?v=AFMeq5nsHeg"
          className={buttonClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          General attitude
        </RollNavLink>
        <div className="siteChrome-socialGroup">
          <RollNavLink
            href="https://www.linkedin.com/in/luke-kavanagh/"
            className={`${buttonClass} siteNavButton-compact`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LI
          </RollNavLink>
          <RollNavLink
            href="https://open.spotify.com/track/7MUembV8XyqkWGg5wyjewS?si=b292e8a887fb462c"
            className={`${buttonClass} siteNavButton-compact`}
            target="_blank"
            rel="noopener noreferrer"
          >
            SP
          </RollNavLink>
        </div>
      </div>
    </nav>
  );
}
