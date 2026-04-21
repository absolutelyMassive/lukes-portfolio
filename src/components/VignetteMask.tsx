export function VignetteMask() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 45%, transparent 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.95) 100%)",
      }}
    />
  );
}
