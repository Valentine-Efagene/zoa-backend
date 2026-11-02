import { isDevelopmentAppEnvironment } from "@/lib/env";

export function DevEnvironmentBanner() {
  if (!isDevelopmentAppEnvironment()) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed top-3 right-3 z-[100] select-none"
      role="status"
      aria-label="Development environment"
    >
      <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-950 shadow-sm backdrop-blur-sm dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-50">
        Dev
      </span>
    </div>
  );
}
