import Link from "next/link";
import { forwardRef } from "react";

export type LinkButtonSize = "sm" | "md";

export type LinkButtonProps = Omit<
  React.ComponentProps<typeof Link>,
  "className"
> & {
  className?: string;
  size?: LinkButtonSize;
  /** When true, opens in a new tab and sets rel (default: inferred from string href). */
  external?: boolean;
  /** Trailing arrow; common for Figma “link button” patterns. Default true. */
  showIcon?: boolean;
};

const sizeClasses: Record<LinkButtonSize, string> = {
  sm: "gap-1 text-xs",
  md: "gap-1.5 text-sm",
};

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href) || href.startsWith("//");
}

function LinkArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 7h9M8 2l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton(
    {
      className = "",
      size = "md",
      external: externalProp,
      showIcon = true,
      children,
      href,
      ...rest
    },
    ref,
  ) {
    const hrefString = typeof href === "string" ? href : "";
    const external =
      externalProp ??
      (hrefString.length > 0 ? isExternalHref(hrefString) : false);

    const base =
      "group inline-flex max-w-max items-center font-sans font-medium capitalize leading-none text-text-primary underline decoration-line-muted decoration-1 underline-offset-[6px] outline-offset-4 transition-[color,text-decoration-color,opacity] hover:text-white hover:decoration-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

    return (
      <Link
        ref={ref}
        href={href}
        className={[base, sizeClasses[size], className].filter(Boolean).join(" ")}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : undefined)}
        {...rest}
      >
        <span className="min-w-0 shrink">{children}</span>
        {showIcon ? (
          <LinkArrow className="shrink-0 translate-y-px text-current opacity-80 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
        ) : null}
      </Link>
    );
  },
);
