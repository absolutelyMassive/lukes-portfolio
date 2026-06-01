/**
 * Fixed overlay rendered on top of the home route when ?about=1 is set.
 *
 * - Centered H1
 * - 4 placeholder "floating images" that drift on slow continuous CSS
 *   keyframe loops (no JS animation cost; one composited transform per
 *   image)
 * - White text card pinned top-right with a download link
 *
 * The `visible` prop controls fade-in / fade-out via the `.is-visible`
 * class on this container. Mounting/unmounting (and the timing of
 * `visible` flips) are driven by AboutGate so that close animations
 * can run to completion before the overlay is removed from the DOM.
 *
 * No interactivity is owned by this component — opening/closing is
 * handled by the URL (?about=1) via SiteChrome's nav links.
 */
export function AboutOverlay({ visible }: { visible: boolean }) {
  return (
    <section
      id="about-overlay"
      role="region"
      aria-label="About"
      aria-hidden={!visible}
      className={`aboutOverlay${visible ? " is-visible" : ""}`}
    >
      {/* Floating image placeholders. Each gets its own animation keyframe
        * + duration so they don't sync. Drop real <img> elements inside
        * later when assets exist. */}
      <div className="aboutFloat aboutFloat-1" aria-hidden="true" />
      <div className="aboutFloat aboutFloat-2" aria-hidden="true" />
      <div className="aboutFloat aboutFloat-3" aria-hidden="true" />
      <div className="aboutFloat aboutFloat-4" aria-hidden="true" />

      <h1 className="aboutTitle">This is the main title for about</h1>

      <aside className="aboutCard" aria-label="About summary">
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry&apos;s standard dummy
          text ever since the 1500s, when an unknown printer took a galley of
          type and scrambled it to make a type specimen book. It has survived
          not only five centuries,
        </p>
        <a
          href="#"
          download
          className="aboutDownload"
          aria-label="Download about as PDF"
        >
          Download pdf
        </a>
      </aside>
    </section>
  );
}
