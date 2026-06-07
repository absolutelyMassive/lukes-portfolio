import { Suspense } from "react";
import { CenterSection } from "@/components/CenterSection/CenterSection";
import { RippleTypographicAscii } from "@/components/rippleTypo/RippleTypographicAscii";
import { AboutGate } from "@/components/AboutGate";
import "./ripple-typo.css";
import "./about-overlay.css";

export default function Home() {
  return (
    <>
      <RippleTypographicAscii />
      <CenterSection />
      {/* AboutGate uses useSearchParams() — required to be wrapped in
        * Suspense for streaming SSR per Next.js 15+. */}
      <Suspense fallback={null}>
        <AboutGate />
      </Suspense>
    </>
  );
}
