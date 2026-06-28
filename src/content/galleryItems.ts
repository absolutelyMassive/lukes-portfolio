import type { GalleryItem } from "@/app/gallery/GalleryView";

/** Base path for gallery stills (files live in `public/gallery/images/`). */
export const GALLERY_IMAGE_DIR = "/gallery/images";

/** Base path for gallery films (files live in `public/gallery/videos/`). */
export const GALLERY_VIDEO_DIR = "/gallery/videos";

/**
 * Gallery artworks in display order.
 * `meta` is the grey accompanying line shown next to the title in the top nav.
 * `description` is longer copy below the title row, same grey styling.
 */
export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "Unfold",
    meta: "New navigation systems",
    description:
      "Delivering a personalised experience that helps users quickly discover relevant templates. Boosting confidence as they enter the editor and driving a 35% increase in the app's export rate.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Unfold1.mp4`,
  },
  {
    id: 2,
    title: "Unfold",
    meta: "Social video timeline editor",
    description:
      "Offering creators thoughtful creative guidance through a set of curated styling options, flexible customisation, high-quality output, designed to feel like a creative partner.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Unfold2.mp4`,
  },
  {
    id: 3,
    title: "Unfold",
    meta: "Boutique custom templates",
    description:
      "Highly crafted templates for social media, built for creators who demand quality and detail. Growing the template library by 8–10% each month, they became the reason customers chose Unfold over Canva or Instagram Edits.",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/Unfold3.png`,
  },
  {
    id: 4,
    title: "Waking Up",
    meta: "Logo",
    description:
      "5 stars, 4x year over year growth, and 48% of users exploring a wider range of content than ever before. Over two years, helping shape one of the most loved resources for meditation and life changing insights.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/WU1.mp4`,
  },
  {
    id: 5,
    title: "Waking Up",
    meta: "Content discoverability",
    description:
      "Designing a discovery experience that guides users toward content that fits their mindfulness journey. 75,000 new users and a 9% lift in series completion. Encouraging users to explore beyond familiar series and stay engaged.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/WU2.mp4`,
  },
  {
    id: 6,
    title: "Waking Up",
    meta: "Content Pack to Player",
    description:
      "An intro snippet with text, tags and audio gives the meditator a sense of the content before committing. Cutting average taps to play by 40% and lifting long-form completion rates across the catalogue.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/WU3.mp4`,
  },
  {
    id: 7,
    title: "Squarespace Invoicing",
    meta: "GAAP compliant",
    description:
      "78% YoY increase in active sellers, 68% lift in GPV per seller. Working AI-native, our team compressed a 2-year roadmap into 6 months. Bringing Squarespace closer to competing with Stripe and Square.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/IV1.mp4`,
  },
  {
    id: 8,
    title: "Squarespace App vision setting",
    meta: "AI commerce solutions vision",
    description:
      "Uncovering new markets for service sellers through a vision sprint, turning the Squarespace app into an agentic AI tool that can action seller workflows through intelligent market research.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/SQSPAPP1.mp4`,
  },
  {
    id: 9,
    title: "Squarespace App vision setting",
    meta: "In-app financial solutions homepage",
    description:
      "Fast access to core in person seller tools, so merchants never fumble at the point of sale. Defined through research, the homepage surfaces the essentials: POS, invoices, pay links and products.",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/SQSPAPP2.png`,
  },
  {
    id: 10,
    title: "Squarespace App vision setting",
    meta: "Analytics and earnings",
    description:
      "As Squarespace grows into financial technology, an at a glance business snapshot has become a key retention play. Positive payment notifications and live data make the app feel alive.",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/SQSPAPP3.png`,
  },
  {
    id: 11,
    title: "Ramo",
    meta: "Mobile social events service",
    description:
      "Defining a brand and core service around group tours. Understanding the specific needs of service sellers and customers, and designing around all the planning and materials a great tour experience requires.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Ramo.mp4`,
  },
  {
    id: 12,
    title: "Aryze",
    meta: "Diverse housing developers",
    description:
      "Helping urbanists, designers and architects define their online presence with a first website, surfacing Aryze's groundbreaking environmental solutions with a brand and IA that reflects their commitment to sustainable beauty.",
    kind: "video",
    src: `${GALLERY_VIDEO_DIR}/Aryze1.mp4`,
  },
  {
    id: 13,
    title: "Aryze",
    meta: "Diverse housing developers",
    description:
      "Helping urbanists, designers and architects define their online presence with a first website, surfacing Aryze's groundbreaking environmental solutions with a brand and IA that reflects their commitment to sustainable beauty.",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/Aryze2.png`,
  },
  {
    id: 14,
    title: "Aryze",
    meta: "Diverse housing developers",
    description:
      "Helping urbanists, designers and architects define their online presence with a first website, surfacing Aryze's groundbreaking environmental solutions with a brand and IA that reflects their commitment to sustainable beauty.",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/Aryze3.png`,
  },
  {
    id: 15,
    title: "Dapper Labs",
    meta: "Cross-platform design systems",
    description:
      "Defining a multi-platform design system that reimagined UX and navigation across Dapper's entire digital infrastructure: NBA Top Shot, Disney Pinnacle and NFL All Day.  Through a configurable frontend that applies variable themes per platform.",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/DapperLabs1.png`,
  },
  {
    id: 16,
    title: "Dapper Labs",
    meta: "Cross-platform design systems",
    description:
      "Defining a multi-platform design system that reimagined UX and navigation across Dapper's entire digital infrastructure: NBA Top Shot, Disney Pinnacle and NFL All Day.  Through a configurable frontend that applies variable themes per platform.",
    kind: "image",
    src: `${GALLERY_IMAGE_DIR}/DapperLabs2.png`,
  },
];
