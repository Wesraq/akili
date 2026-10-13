import { cn } from "@/lib/utils";

import logoMark from "@/assets/logo-akili.png";

type BrandLogoProps = {
  /** Kept for call-site compatibility; mark is transparent and works on any surface. */
  variant?: "light" | "dark";
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  tagline?: string;
  taglineClassName?: string;
};

export function BrandLogo({
  className,
  markClassName,
  showWordmark = true,
  wordmarkClassName,
  tagline,
  taglineClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <img
        src={logoMark}
        alt="AKILI LABS"
        width={160}
        height={160}
        className={cn("size-10 object-contain", markClassName)}
      />
      {showWordmark ? (
        <span className="leading-tight">
          <span
            className={cn(
              "block font-display text-base font-semibold tracking-tight",
              wordmarkClassName,
            )}
          >
            AKILI LABS
          </span>
          {tagline ? (
            <span className={cn("block text-[0.68rem] text-muted-foreground", taglineClassName)}>
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
