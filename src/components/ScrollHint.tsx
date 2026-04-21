export function ScrollHint() {
  return (
    <div className="pointer-events-none fixed bottom-10 left-10 z-30 flex w-[300px] items-center justify-between text-[10px] leading-none tracking-[-0.1px] text-white">
      <p>Scroll to explore</p>
      <svg
        width="17"
        height="17"
        viewBox="0 0 17 17"
        aria-hidden
        className="shrink-0 fill-current"
      >
        <path d="M8.5 12 3 5h11L8.5 12z" />
      </svg>
    </div>
  );
}
