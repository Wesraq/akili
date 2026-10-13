import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type LimsTab = {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
};

/** LabKey-style horizontal detail tabs. */
export function LimsDetailTabs({
  tabs,
  defaultTab,
  className,
}: {
  tabs: LimsTab[];
  defaultTab?: string;
  className?: string;
}) {
  const initial =
    defaultTab && tabs.some((t) => t.id === defaultTab) ? defaultTab : tabs[0]?.id;
  const [active, setActive] = useState(initial ?? "");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={cn("space-y-0", className)}>
      <div
        className="flex flex-wrap gap-0 border-b border-border"
        role="tablist"
        aria-label="Detail sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === current?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-5">
        {current?.content}
      </div>
    </div>
  );
}
