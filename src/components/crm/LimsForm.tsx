import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** LabKey-like form section with title + optional hint. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4 border border-border bg-card p-5", className)}>
      <div>
        <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Compact responsive field grid. */
export function FormGrid({
  children,
  cols = 3,
  className,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Label + control + optional hint / error. Spans full width when `span` is set. */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  span,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  span?: 2 | 3 | "full";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        span === 2 && "sm:col-span-2",
        span === 3 && "lg:col-span-3",
        span === "full" && "sm:col-span-2 lg:col-span-3",
        className,
      )}
    >
      <Label
        htmlFor={htmlFor}
        className={cn(error && "text-destructive", "text-sm font-medium")}
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Sticky bottom action bar for long clinical forms. */
export function StickyFormActions({
  children,
  className,
  summary,
}: {
  children: ReactNode;
  className?: string;
  summary?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-1 mt-2 flex flex-wrap items-center justify-between gap-3 border border-border bg-card/95 px-4 py-3 shadow-lift backdrop-blur supports-[backdrop-filter]:bg-card/90",
        className,
      )}
    >
      <div className="min-w-0 text-sm text-muted-foreground">{summary}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Inline banner for form-level validation (before toast). */
export function FormAlert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "warn" | "info";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "border px-4 py-3 text-sm",
        tone === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
        tone === "warn" && "border-amber-500/40 bg-amber-500/10 text-amber-950",
        tone === "info" && "border-primary/30 bg-primary/5 text-foreground",
      )}
    >
      {children}
    </div>
  );
}
