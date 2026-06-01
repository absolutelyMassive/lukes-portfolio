import { Suspense } from "react";
import { RippleTypographicAscii } from "@/components/rippleTypo/RippleTypographicAscii";
import { AboutGate } from "@/components/AboutGate";
import "./ripple-typo.css";
import "./about-overlay.css";

export default function Home() {
  return (
    <>
      <RippleTypographicAscii />
      {/* AboutGate uses useSearchParams() — required to be wrapped in
        * Suspense for streaming SSR per Next.js 15+. */}
      <Suspense fallback={null}>
        <AboutGate />
      </Suspense>
    </>
  );
}
