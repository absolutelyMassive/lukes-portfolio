import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Props = ComponentProps<typeof Link>;

function isExternalHref(href: Props["href"]): href is string {
  return (
    typeof href === "string" &&
    (href.startsWith("http://") || href.startsWith("https://"))
  );
}

function rollContent(children: ReactNode): ReactNode {
  const label =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : null;

  if (label === null) return children;

  return (
    <span className="siteNavButton-roll">
      <span className="siteNavButton-translate">
        <span className="siteNavButton-line">{label}</span>
        <span className="siteNavButton-line" aria-hidden="true">
          {label}
        </span>
      </span>
    </span>
  );
}

/**
 * Nav link with duplicated label stacked vertically; hover slides
 * the column up by 50% (madewithgsap-style roll).
 * External URLs use a native anchor so target="_blank" is reliable.
 */
export function RollNavLink({
  children,
  className,
  href,
  target,
  rel,
  ...props
}: Props) {
  const content = rollContent(children);

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        className={className}
        target={target ?? "_blank"}
        rel={rel ?? "noopener noreferrer"}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      className={className}
      href={href}
      target={target}
      rel={rel}
      {...props}
    >
      {content}
    </Link>
  );
}
