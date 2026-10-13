import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: number;
  action: string;
  at: string;
  actorName: string | null;
  meta: Record<string, string | number | boolean | null> | null;
};

const actionLabels: Record<string, string> = {
  create: "Accession created",
  status_update: "Status changed",
  save_results: "Results saved",
  submit_for_validation: "Submitted for validation",
  validate: "Report released",
  update_meta: "Accession details updated",
  specimen_receive: "Specimen received",
  specimen_reject: "Specimen rejected",
  specimen_add: "Specimen added (redraw)",
  invoice_create: "Invoice created",
  create_from_lab_order: "Invoice created from accession",
};

function formatMeta(meta: Record<string, string | number | boolean | null> | null): string | null {
  if (!meta) return null;
  const parts: string[] = [];
  if (meta["status"]) parts.push(`→ ${String(meta["status"])}`);
  if (meta["from"] && meta["status"]) parts.push(`(from ${String(meta["from"])})`);
  if (meta["accessionNumber"]) parts.push(String(meta["accessionNumber"]));
  if (meta["reason"]) parts.push(`Reason: ${String(meta["reason"])}`);
  if (meta["specimenType"]) parts.push(String(meta["specimenType"]));
  if (meta["condition"]) parts.push(`Condition: ${String(meta["condition"])}`);
  if (meta["reference"]) parts.push(String(meta["reference"]));
  if (meta["total"] != null) parts.push(`Total ${String(meta["total"])}`);
  if (meta["testCount"] != null) parts.push(`${meta["testCount"]} tests`);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

export function OrderTimeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  const [newestFirst, setNewestFirst] = useState(true);
  const sorted = [...events].sort((a, b) =>
    newestFirst ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at),
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {events.length === 0
            ? "No timeline events yet."
            : `${events.length} event${events.length === 1 ? "" : "s"}`}
        </p>
        {events.length > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setNewestFirst((v) => !v)}
          >
            {newestFirst ? "Show oldest first" : "Show newest first"}
          </Button>
        ) : null}
      </div>

      {sorted.length === 0 ? null : (
        <ol className="relative space-y-0 border-l border-border pl-5">
          {sorted.map((event) => {
            const detail = formatMeta(event.meta);
            return (
              <li key={event.id} className="relative pb-6 last:pb-0">
                <span
                  className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full border-2 border-primary bg-card"
                  aria-hidden
                />
                <p className="text-sm font-medium">
                  {actionLabels[event.action] ?? event.action.replace(/_/g, " ")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(event.at).toLocaleString()}
                  {event.actorName ? ` · ${event.actorName}` : ""}
                </p>
                {detail ? (
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
