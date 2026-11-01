import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center gap-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-6 text-primary" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function InlineSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-4" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-8 w-12" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}

export function ListSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-border/70 rounded-xl border border-border/70 bg-background",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: rows }, (_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function WorkflowOptionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="w-full rounded-xl border border-border/70 bg-background px-5 py-4"
        >
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8" aria-hidden>
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="space-y-4 rounded-xl border border-border/70 bg-background p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
