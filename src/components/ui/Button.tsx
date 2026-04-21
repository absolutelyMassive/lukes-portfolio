import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center font-sans font-medium capitalize leading-none outline-offset-4 transition-[color,background-color,border-color,opacity] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-[50px] bg-pill-bg text-white backdrop-blur-[10px] hover:bg-white/35",
  secondary:
    "rounded-[50px] bg-white text-page-bg hover:bg-white/90",
  outline:
    "rounded-[50px] border border-line-muted bg-transparent text-text-primary hover:bg-white/5",
  ghost:
    "rounded-lg bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary",
};

const sizes: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-6 pb-[7px] pt-[5px] text-sm",
  lg: "gap-2 px-8 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className = "",
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={[base, variants[variant], sizes[size], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);
