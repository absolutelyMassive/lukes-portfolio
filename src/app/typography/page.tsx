import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { typographySamples } from "@/data/typography";

export const metadata: Metadata = {
  title: "Typography",
  description: "Basic type scale and reference copy for this site.",
};

function loadSpec(): string {
  const path = join(process.cwd(), "src/content/typography.txt");
  return readFileSync(path, "utf-8");
}

export default function TypographyPage() {
  const spec = loadSpec();

  return (
    <main className="min-h-full bg-page-bg pb-24 pt-20 text-text-primary">
      <div className="mx-auto max-w-4xl px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
          Reference
        </p>
        <h1 className="mt-3 text-3xl font-medium leading-tight tracking-tight">
          Typography
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          A minimal scale built on Satoshi (500) and your existing color tokens.
          The plain-text spec lives in{" "}
          <code className="text-text-primary">src/content/typography.txt</code>
          .
        </p>
      </div>

      <section className="mx-auto mt-16 max-w-4xl border-t border-line-muted px-6 pt-16">
        <h2 className="text-xl font-medium leading-snug tracking-tight">Scale</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Each row shows the token name, sample text, and suggested use.
        </p>
        <ul className="mt-10 divide-y divide-line-muted border-y border-line-muted">
          {typographySamples.map((row) => (
            <li
              key={row.token}
              className="grid gap-6 py-10 md:grid-cols-[minmax(0,1fr)_200px]"
            >
              <div className="min-w-0">
                <p className={row.className}>{row.sample}</p>
                <p className="mt-4 text-xs text-text-secondary">{row.usage}</p>
              </div>
              <div className="text-xs uppercase tracking-wider text-text-secondary md:text-right">
                {row.token}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-20 max-w-4xl border-t border-line-muted px-6 pt-16">
        <h2 className="text-xl font-medium leading-snug tracking-tight">
          Spec file
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Source of truth in prose form (edit this file, then align the samples
          in{" "}
          <code className="text-text-primary">src/data/typography.ts</code> if
          needed).
        </p>
        <pre className="mt-8 overflow-x-auto rounded-lg border border-line-muted bg-black/40 p-6 text-xs leading-relaxed text-text-secondary whitespace-pre-wrap font-mono">
          {spec}
        </pre>
      </section>
    </main>
  );
}
