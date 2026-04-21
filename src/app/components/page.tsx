import type { Metadata } from "next";
import { ProjectListPreview } from "@/components/ProjectListPreview";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";

export const metadata: Metadata = {
  title: "Components",
  description: "UI component previews for this site.",
};

function PreviewSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line-muted py-16 last:border-b-0">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10">
          <h2 className="text-lg font-medium tracking-tight text-text-primary">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-line-muted bg-page-bg/80 p-8">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function ComponentsPage() {
  return (
    <main className="min-h-full bg-page-bg pb-24 pt-20 text-text-primary">
      <div className="mx-auto max-w-4xl px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">
          Design system
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">Components</h1>
        <p className="mt-4 max-w-2xl text-sm text-text-secondary">
          Live previews for primitives and patterns. Add new sections here as
          you build more components.
        </p>
      </div>

      <PreviewSection
        title="Project list item"
        description="Single expandable row: index, title, status, description, and link copy are all props. Surface uses material-inverse (white) and text-inverse-default (near-black) tokens per Figma."
      >
        <div className="flex flex-col items-start">
          <ProjectListPreview />
        </div>
      </PreviewSection>

      <PreviewSection
        title="Link button"
        description="Text link with underline and optional trailing arrow, implemented as a real anchor via Next.js Link. External http(s) URLs open in a new tab unless you override external."
      >
        <div className="flex flex-col gap-10">
          <div>
            <p className="mb-4 text-xs uppercase tracking-wider text-text-secondary">
              Default
            </p>
            <div className="flex flex-col items-start gap-4">
              <LinkButton href="/">Back to home</LinkButton>
              <LinkButton
                href="https://example.com"
                aria-label="Example (opens in new tab)"
              >
                External example
              </LinkButton>
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-wider text-text-secondary">
              Sizes and no icon
            </p>
            <div className="flex flex-col items-start gap-4">
              <LinkButton href="/components" size="sm">
                Small link
              </LinkButton>
              <LinkButton href="/components" showIcon={false}>
                Without arrow
              </LinkButton>
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection
        title="Button"
        description="Built from the same glassy pill treatment as the primary nav contact control, with secondary, outline, and ghost variants."
      >
        <div className="flex flex-col gap-10">
          <div>
            <p className="mb-4 text-xs uppercase tracking-wider text-text-secondary">
              Variants
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-wider text-text-secondary">
              Sizes
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs uppercase tracking-wider text-text-secondary">
              States
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </PreviewSection>
    </main>
  );
}
