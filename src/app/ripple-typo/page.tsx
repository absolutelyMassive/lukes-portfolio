import type { Metadata } from "next";
import Link from "next/link";
import { RippleTypographicAscii } from "@/components/rippleTypo/RippleTypographicAscii";
import "./ripple-typo.css";

export const metadata: Metadata = {
  title: "Ripple ASCII",
  description:
    "Full-page typographic ASCII driven by a discrete 2D wave equation. Click or drag to ripple.",
};

export default function RippleTypoPage() {
  return (
    <>
      <RippleTypographicAscii />
      <div className="rippleTypoChrome fixed left-4 top-4 z-10 flex flex-col gap-2 text-xs text-white/40">
        <Link
          href="/"
          className="w-fit rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-white/80 backdrop-blur-sm hover:border-white/20 hover:text-white"
        >
          Home
        </Link>
        <Link
          href="/fluid"
          className="w-fit rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-white/60 backdrop-blur-sm hover:border-white/20 hover:text-white/90"
        >
          Fluid experiment
        </Link>
      </div>
    </>
  );
}
