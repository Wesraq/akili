import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const labOrderStatuses = [
  "ordered",
  "received",
  "in_progress",
  "reported",
  "validated",
  "rejected",
  "amended",
  "cancelled",
] as const;

export type LabOrderStatus = (typeof labOrderStatuses)[number];

/** Clinical LIMS language — status = work stage, not CRM jargon. */
export const labStatusLabel: Record<LabOrderStatus, string> = {
  ordered: "Accessioned",
  received: "Received",
  in_progress: "In bench",
  reported: "Awaiting validation",
  validated: "Released",
  rejected: "Rejected",
  amended: "Amended",
  cancelled: "Cancelled",
};

export const labStatusTone: Record<LabOrderStatus, string> = {
  ordered: "border-primary/25 bg-primary/10 text-primary",
  received: "border-teal-500/30 bg-teal-500/10 text-teal-900",
  in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-800",
  reported: "border-sky-500/30 bg-sky-500/10 text-sky-900",
  validated: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  amended: "border-violet-500/30 bg-violet-500/10 text-violet-900",
  cancelled: "border-border bg-muted text-muted-foreground",
};

export const specimenStatuses = ["pending", "received", "rejected", "consumed"] as const;
export type SpecimenStatus = (typeof specimenStatuses)[number];

export const specimenStatusLabel: Record<SpecimenStatus, string> = {
  pending: "Pending receipt",
  received: "Received",
  rejected: "Rejected",
  consumed: "Consumed",
};

export const specimenStatusTone: Record<SpecimenStatus, string> = {
  pending: "border-primary/25 bg-primary/10 text-primary",
  received: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  consumed: "border-border bg-muted text-muted-foreground",
};

export function LabStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = (labOrderStatuses.includes(status as LabOrderStatus)
    ? status
    : "ordered") as LabOrderStatus;
  return (
    <Badge
      variant="outline"
      className={cn("rounded-sm font-medium capitalize", labStatusTone[key], className)}
    >
      {labStatusLabel[key]}
    </Badge>
  );
}

export function SpecimenStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = (specimenStatuses.includes(status as SpecimenStatus)
    ? status
    : "pending") as SpecimenStatus;
  return (
    <Badge
      variant="outline"
      className={cn("rounded-sm font-medium", specimenStatusTone[key], className)}
    >
      {specimenStatusLabel[key]}
    </Badge>
  );
}

/** Horizontal specimen lifecycle used on workboard and order headers. */
export function LabWorkflowStrip({
  active,
  counts,
}: {
  active?: LabOrderStatus | "all";
  counts?: Partial<Record<LabOrderStatus, number>>;
}) {
  const stages: LabOrderStatus[] = [
    "ordered",
    "received",
    "in_progress",
    "reported",
    "validated",
  ];
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Lab workflow stages">
      {stages.map((stage, index) => {
        const isActive = active === stage;
        const count = counts?.[stage];
        return (
          <li key={stage} className="flex items-center gap-2">
            {index > 0 ? (
              <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                →
              </span>
            ) : null}
            <Link
              to="/crm/lab-orders"
              search={{ status: stage }}
              className={cn(
                "inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span>{labStatusLabel[stage]}</span>
              {typeof count === "number" ? (
                <span
                  className={cn(
                    "tabular-nums",
                    isActive ? "opacity-90" : "text-foreground",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function LimsPageHeader({
  eyebrow = "LIMS",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
