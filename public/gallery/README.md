# Gallery media

Static files here are served by Next.js at URLs under `/gallery/…`.

## Folder layout

```
public/gallery/
  images/   ← photographs (.jpg, .png, .webp, .avif, .svg)
  videos/   ← films (.mp4, H.264 recommended for broad browser support)
```

**Example paths**

| File on disk | URL used in code |
|--------------|------------------|
| `images/coastline.jpg` | `/gallery/images/coastline.jpg` |
| `videos/drift.mp4` | `/gallery/videos/drift.mp4` |

Do not include `public` in the URL.

## Placeholders (remove when you add real work)

| File | Purpose |
|------|---------|
| `images/sample-placeholder.svg` | Demo still — swap for your `.jpg` / `.png` |
| `videos/sample-placeholder.mp4` | Demo clip — swap for your `.mp4` |

## Wire up your work

Edit `src/content/galleryItems.ts`:

1. Set each item’s `src` to your file path (e.g. `/gallery/images/01-lavender.jpg`).
2. Set `kind` to `"image"` or `"video"`.
3. Update `title` and `meta` as needed.
4. Add or remove entries in the `GALLERY_ITEMS` array to match how many pieces you have.

Items with `src: null` show a numbered placeholder until you assign a file.

## Tips

- Prefer landscape or tall crops around **16∶9** — the gallery frame is cinematic full-width.
- Keep filenames lowercase with hyphens (`my-piece-2024.jpg`) to avoid URL issues.
- Large videos: compress before committing, or use Git LFS if the repo grows.
