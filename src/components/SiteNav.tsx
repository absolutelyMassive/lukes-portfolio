const links = [
  { label: "Link 1", href: "#" },
  { label: "Link 2", href: "#" },
  { label: "Fluid", href: "/fluid" },
  { label: "ASCII", href: "/ripple-typo" },
];

export function SiteNav() {
  return (
    <header className="fixed top-0 z-50 flex h-[76px] w-full items-center justify-between border-b border-transparent bg-black/0 px-10 py-[30px]">
      <a
        href="#"
        className="text-center text-sm capitalize leading-none text-white outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        Name
      </a>
      <nav
        aria-label="Primary"
        className="flex items-center justify-center gap-12"
      >
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-center text-sm capitalize leading-none text-white outline-offset-4 hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            {link.label}
          </a>
        ))}
        <a
          href="#"
          className="flex w-[100px] items-center justify-center rounded-[50px] bg-[rgba(255,255,255,0.25)] px-1.5 pb-[7px] pt-[5px] text-center text-sm capitalize leading-none text-white backdrop-blur-[10px] outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
