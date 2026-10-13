import { useMemo, useState } from "react";
import { RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type BodySex,
  type BodySiteDef,
  type BodySiteMark,
  type BodyView,
  siteKey,
  sitesForView,
} from "@/lib/body-sites";
import { cn } from "@/lib/utils";

function sexFromForm(sex: string | null | undefined): BodySex {
  const s = (sex || "").toLowerCase();
  if (s.includes("f")) return "female";
  if (s.includes("m") && !s.includes("fe")) return "male";
  return "unspecified";
}

function BodySilhouette({
  view,
  sex,
  ink = false,
}: {
  view: BodyView;
  sex: BodySex;
  ink?: boolean;
}) {
  const shoulder = sex === "female" ? 38 : 44;
  const hip = sex === "female" ? 36 : 30;
  const waist = sex === "female" ? 26 : 28;
  const chestY = 110;
  const fill = ink ? "fill-transparent" : "fill-muted";
  const stroke = ink ? "stroke-black/70" : "stroke-border";

  const torsoPath =
    view === "front"
      ? `M ${100 - shoulder} ${chestY}
         C ${100 - shoulder - 4} 140, ${100 - waist} 165, ${100 - hip} 230
         L ${100 + hip} 230
         C ${100 + waist} 165, ${100 + shoulder + 4} 140, ${100 + shoulder} ${chestY}
         Z`
      : `M ${100 - shoulder} ${chestY}
         C ${100 - shoulder - 4} 145, ${100 - waist} 170, ${100 - hip} 235
         L ${100 + hip} 235
         C ${100 + waist} 170, ${100 + shoulder + 4} 145, ${100 + shoulder} ${chestY}
         Z`;

  return (
    <g aria-hidden className="pointer-events-none">
      <ellipse cx="100" cy="38" rx="24" ry="28" className={cn(fill, stroke)} strokeWidth="1.5" />
      <rect
        x="92"
        y="64"
        width="16"
        height="18"
        rx="4"
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <path d={torsoPath} className={cn(fill, stroke)} strokeWidth="1.5" />
      <path
        d={`M ${100 - shoulder} ${chestY + 8}
            C ${100 - shoulder - 18} ${chestY + 40}, ${100 - shoulder - 28} ${chestY + 80}, ${100 - shoulder - 36} ${chestY + 130}
            L ${100 - shoulder - 28} ${chestY + 138}
            C ${100 - shoulder - 20} ${chestY + 90}, ${100 - shoulder - 10} ${chestY + 50}, ${100 - shoulder + 2} ${chestY + 18}
            Z`}
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <path
        d={`M ${100 + shoulder} ${chestY + 8}
            C ${100 + shoulder + 18} ${chestY + 40}, ${100 + shoulder + 28} ${chestY + 80}, ${100 + shoulder + 36} ${chestY + 130}
            L ${100 + shoulder + 28} ${chestY + 138}
            C ${100 + shoulder + 20} ${chestY + 90}, ${100 + shoulder + 10} ${chestY + 50}, ${100 + shoulder - 2} ${chestY + 18}
            Z`}
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <ellipse
        cx={100 - shoulder - 38}
        cy={chestY + 145}
        rx="10"
        ry="12"
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <ellipse
        cx={100 + shoulder + 38}
        cy={chestY + 145}
        rx="10"
        ry="12"
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <path
        d={`M ${100 - hip + 4} 230 L ${100 - hip + 2} 360 Q ${100 - hip} 400, ${100 - hip - 2} 450 L ${100 - hip + 18} 452 L ${100 - 8} 360 L ${100 - 6} 245 Z`}
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <path
        d={`M ${100 + hip - 4} 230 L ${100 + hip - 2} 360 Q ${100 + hip} 400, ${100 + hip + 2} 450 L ${100 + hip - 18} 452 L ${100 + 8} 360 L ${100 + 6} 245 Z`}
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <ellipse
        cx={100 - hip + 6}
        cy="458"
        rx="16"
        ry="8"
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      <ellipse
        cx={100 + hip - 6}
        cy="458"
        rx="16"
        ry="8"
        className={cn(fill, stroke)}
        strokeWidth="1"
      />
      {view === "back" ? (
        <line
          x1="100"
          y1="95"
          x2="100"
          y2="220"
          className={ink ? "stroke-black/35" : "stroke-border/60"}
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      ) : null}
      {view === "front" && sex === "female" ? (
        <>
          <ellipse
            cx="82"
            cy="122"
            rx="12"
            ry="10"
            className={ink ? "fill-transparent stroke-black/35" : "fill-muted-foreground/10 stroke-border/40"}
            strokeWidth="1"
          />
          <ellipse
            cx="118"
            cy="122"
            rx="12"
            ry="10"
            className={ink ? "fill-transparent stroke-black/35" : "fill-muted-foreground/10 stroke-border/40"}
            strokeWidth="1"
          />
        </>
      ) : null}
    </g>
  );
}

function FigurePanel({
  view,
  sex,
  label,
  value,
  selectedKeys,
  readOnly,
  paper,
  dimmed,
  onToggle,
}: {
  view: BodyView;
  sex: BodySex;
  label: string;
  value: BodySiteMark[];
  selectedKeys: Set<string>;
  readOnly: boolean;
  paper: boolean;
  dimmed?: boolean;
  onToggle: (site: BodySiteDef) => void;
}) {
  const regions = useMemo(() => sitesForView(view), [view]);

  return (
    <div
      className={cn(
        "relative rounded-sm border p-2",
        paper ? "border-black/25 bg-white" : "border-border bg-card",
        dimmed && "opacity-45",
      )}
    >
      <p
        className={cn(
          "text-center text-[10px] font-semibold uppercase tracking-wide",
          paper ? "text-black/70" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <svg
        viewBox="0 0 200 480"
        className="mx-auto mt-1 h-auto w-full max-w-[160px]"
        role="img"
        aria-label={`${label} body map`}
      >
        <BodySilhouette view={view} sex={sex === "unspecified" ? "male" : sex} ink={paper} />
        {regions.map((site) => {
          const selected = selectedKeys.has(siteKey(site));
          return (
            <ellipse
              key={siteKey(site)}
              cx={site.cx}
              cy={site.cy}
              rx={site.rx}
              ry={site.ry}
              role={readOnly ? undefined : "button"}
              tabIndex={readOnly ? undefined : 0}
              aria-pressed={readOnly ? undefined : selected}
              aria-label={`${label}: ${site.label}${selected ? ", selected" : ""}`}
              onClick={() => onToggle(site)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggle(site);
                }
              }}
              className={cn(
                "transition-colors duration-150",
                readOnly ? "pointer-events-none" : "cursor-pointer",
                selected
                  ? paper
                    ? "fill-red-500/55 stroke-red-700"
                    : "fill-primary/55 stroke-primary"
                  : paper
                    ? "fill-transparent stroke-transparent hover:fill-red-500/15 hover:stroke-red-600/50"
                    : "fill-transparent stroke-transparent hover:fill-primary/20 hover:stroke-primary/50",
              )}
              strokeWidth={selected ? 2 : 1.5}
            />
          );
        })}
      </svg>
      {/* keep value referenced for eslint unused in compact panels */}
      <span className="sr-only">{value.length} sites</span>
    </div>
  );
}

type BodySiteMapProps = {
  value: BodySiteMark[];
  onChange?: ((sites: BodySiteMark[]) => void) | undefined;
  sex?: string | null | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
  /** Paper FORM-14 layout: male + female, front + back figures */
  paper?: boolean | undefined;
};

export function BodySiteMap({
  value,
  onChange,
  sex,
  readOnly = false,
  className,
  compact = false,
  paper = false,
}: BodySiteMapProps) {
  const [view, setView] = useState<BodyView>("front");
  const bodySex = sexFromForm(sex);
  const regions = useMemo(() => sitesForView(view), [view]);
  const selectedKeys = useMemo(() => new Set(value.map(siteKey)), [value]);

  function toggle(site: BodySiteDef) {
    if (readOnly || !onChange) return;
    const key = siteKey(site);
    if (selectedKeys.has(key)) {
      onChange(value.filter((item) => siteKey(item) !== key));
      return;
    }
    onChange([...value, { id: site.id, label: site.label, view: site.view }]);
  }

  function remove(mark: BodySiteMark) {
    if (readOnly || !onChange) return;
    onChange(value.filter((item) => siteKey(item) !== siteKey(mark)));
  }

  const paperPanels: Array<{ sex: BodySex; view: BodyView; label: string }> = [
    { sex: "male", view: "front", label: "Male · Front" },
    { sex: "male", view: "back", label: "Male · Back" },
    { sex: "female", view: "front", label: "Female · Front" },
    { sex: "female", view: "back", label: "Female · Back" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {!paper ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-sm border border-border bg-muted/40 p-0.5">
            {(["front", "back"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  view === item
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          {!readOnly && value.length > 0 && onChange ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => onChange([])}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Clear sites
            </Button>
          ) : null}
        </div>
      ) : !readOnly && value.length > 0 && onChange ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-black"
            onClick={() => onChange([])}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Clear sites
          </Button>
        </div>
      ) : null}

      {paper ? (
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 lg:grid-cols-4",
          )}
        >
          {paperPanels.map((panel) => (
            <FigurePanel
              key={`${panel.sex}-${panel.view}`}
              view={panel.view}
              sex={panel.sex}
              label={panel.label}
              value={value}
              selectedKeys={selectedKeys}
              readOnly={readOnly}
              paper
              dimmed={bodySex !== "unspecified" && bodySex !== panel.sex}
              onToggle={toggle}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            compact ? "grid-cols-1" : "lg:grid-cols-[minmax(0,240px)_1fr]",
          )}
        >
          <FigurePanel
            view={view}
            sex={bodySex === "unspecified" ? "male" : bodySex}
            label={view === "front" ? "Anterior" : "Posterior"}
            value={value}
            selectedKeys={selectedKeys}
            readOnly={readOnly}
            paper={false}
            onToggle={toggle}
          />
          {!compact ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Marked extraction sites ({value.length})
              </p>
              {value.length === 0 ? (
                <p className="rounded-sm border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
                  {readOnly
                    ? "No anatomical sites recorded."
                    : "No sites marked yet. Use the figure to select one or more biopsy / cytology sites."}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {value.map((mark) => (
                    <li key={siteKey(mark)}>
                      <Badge
                        variant="secondary"
                        className="gap-1.5 rounded-sm py-1 pl-2.5 pr-1.5 font-normal"
                      >
                        <span>
                          {mark.label}
                          <span className="text-muted-foreground"> · {mark.view}</span>
                        </span>
                        {!readOnly && onChange ? (
                          <button
                            type="button"
                            className="rounded-sm p-0.5 hover:bg-muted"
                            aria-label={`Remove ${mark.label}`}
                            onClick={() => remove(mark)}
                          >
                            <X className="size-3" aria-hidden />
                          </button>
                        ) : null}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              <div className="hidden text-xs text-muted-foreground lg:block">
                <p className="font-medium text-foreground/80">Quick regions on this view</p>
                <ul className="mt-2 grid grid-cols-2 gap-1">
                  {regions.map((site) => {
                    const selected = selectedKeys.has(siteKey(site));
                    return (
                      <li key={`list-${siteKey(site)}`}>
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => toggle(site)}
                          className={cn(
                            "w-full rounded-sm border px-2 py-1.5 text-left text-xs transition-colors",
                            selected
                              ? "border-primary bg-primary-soft text-foreground"
                              : "border-border hover:bg-muted/50",
                            readOnly && "cursor-default opacity-80",
                          )}
                        >
                          {site.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {paper ? (
        <div className="space-y-2">
          <p className={cn("text-xs font-medium", paper ? "text-black/65" : "text-muted-foreground")}>
            Marked sites ({value.length})
          </p>
          {value.length === 0 ? (
            <p className="text-sm text-black/50">
              {readOnly ? "No sites marked." : "Click a region on the figure that matches the patient."}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {value.map((mark) => (
                <li key={siteKey(mark)}>
                  <span className="inline-flex items-center gap-1.5 border border-black/25 bg-white px-2 py-1 text-xs">
                    {mark.label}
                    <span className="text-black/50">· {mark.view}</span>
                    {!readOnly && onChange ? (
                      <button
                        type="button"
                        className="ml-0.5 text-black/60 hover:text-black"
                        aria-label={`Remove ${mark.label}`}
                        onClick={() => remove(mark)}
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
