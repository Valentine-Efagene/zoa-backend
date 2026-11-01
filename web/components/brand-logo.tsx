import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  variant?: "mark" | "wordmark" | "horizontal";
  showTagline?: boolean;
  onDark?: boolean;
};

/** Official Z.O.A mark — ring with 180°-symmetric wings (style guide). */
function ZoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-0.41 -0.41 100.82 100.82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M 3.592 18.000 L 50.000 18.000 A 32 32 0 0 1 79.674 61.977 L 96.408 78.711 L 96.408 82.000 L 50.000 82.000 A 32 32 0 0 1 20.326 38.023 L 3.592 21.289 L 3.592 18.000 Z M 71.925 50.000 A 21.925 21.925 0 1 0 28.075 50.000 A 21.925 21.925 0 1 0 71.925 50.000 Z"
      />
    </svg>
  );
}

export function BrandLogo({
  className,
  variant = "horizontal",
  showTagline = false,
  onDark = false,
}: BrandLogoProps) {
  const wordColor = "text-[var(--zoa-orange)]";
  const tagColor = onDark ? "text-white/80" : "text-[var(--zoa-blue)]";
  const markColor = onDark
    ? "text-[var(--zoa-orange)]"
    : "text-[var(--zoa-blue)]";

  if (variant === "mark") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <ZoMark className={cn("size-8", markColor)} />
        <span className="sr-only">Z.O.A</span>
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={cn(
          "inline-flex flex-col font-[family-name:var(--font-display)] tracking-tight",
          className,
        )}
      >
        <span className={cn("text-xl font-medium leading-none", wordColor)}>
          Z.O.A
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1 text-[0.55rem] font-medium tracking-[0.14em] uppercase",
              tagColor,
            )}
          >
            Corporate Service Limited
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ZoMark className={cn("size-9", markColor)} />
      <span className="inline-flex flex-col font-[family-name:var(--font-display)] tracking-tight">
        <span
          className={cn(
            "text-lg font-medium leading-none sm:text-xl",
            wordColor,
          )}
        >
          Z.O.A
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1 text-[0.55rem] font-medium tracking-[0.12em] uppercase",
              tagColor,
            )}
          >
            Corporate Service Limited
          </span>
        ) : null}
      </span>
    </span>
  );
}

export { ZoMark };
