/** Visual samples for /typography — keep in sync with src/content/typography.txt */

export type TypographySample = {
  token: string;
  sample: string;
  className: string;
  usage: string;
};

export const typographySamples: TypographySample[] = [
  {
    token: "display",
    sample: "Display heading",
    className: "text-3xl font-medium leading-tight tracking-tight text-text-primary",
    usage: "Page hero, major headings",
  },
  {
    token: "title",
    sample: "Section title",
    className: "text-xl font-medium leading-snug tracking-tight text-text-primary",
    usage: "Section titles, card headers",
  },
  {
    token: "body",
    sample:
      "Body copy for descriptions and UI text. Uses the secondary color for comfortable reading on dark backgrounds.",
    className: "text-sm font-medium leading-relaxed text-text-secondary",
    usage: "Default paragraphs, descriptions",
  },
  {
    token: "caption",
    sample: "Caption — meta, footnotes, timestamps",
    className: "text-xs font-medium leading-normal text-text-secondary",
    usage: "Supporting detail",
  },
  {
    token: "overline",
    sample: "Overline label",
    className:
      "text-xs font-medium uppercase tracking-[0.2em] text-text-secondary",
    usage: "Eyebrows, category labels",
  },
];
