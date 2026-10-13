import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InsightTo =
  | { to: "/crm/lab-orders"; search?: { status?: string } }
  | { to: "/crm/appointments" }
  | { to: "/crm/clients" }
  | { to: "/crm/leads" }
  | { to: "/crm/invoices" }
  | { to: string; search?: Record<string, string> };

export function LimsInsightPanel({
  label,
  value,
  hint,
  to,
  search,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  to?: string;
  search?: Record<string, string | undefined>;
  tone?: "default" | "warn" | "accent" | "danger";
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-500/40 bg-amber-500/5"
      : tone === "accent"
        ? "border-primary/30 bg-primary/5"
        : tone === "danger"
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card";

  const inner = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  const className = cn(
    "block border p-4 transition-colors",
    toneClass,
    to && "hover:border-primary/50",
  );

  if (to) {
    return (
      <Link to={to} search={search as never} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function LimsInsightRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{children}</div>;
}

export type { InsightTo };
