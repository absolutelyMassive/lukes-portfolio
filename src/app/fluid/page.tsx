import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { SiteNav } from "@/components/SiteNav";
import { FluidTextExperiment } from "@/components/fluid/FluidTextExperiment";

export const metadata: Metadata = {
  title: "Ripples / Pretext",
  description:
    "Long-form text laid out with @chenglou/pretext. A WebGL wave sim ripples around each glyph as an obstacle.",
};

function loadPassage(): string {
  const path = join(process.cwd(), "src/content/fluid-passage.txt");
  return readFileSync(path, "utf-8");
}

export default function FluidPage() {
  const passage = loadPassage();
  return (
    <>
      <SiteNav />
      <FluidTextExperiment passage={passage} />
    </>
  );
}
