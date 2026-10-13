import { useRouter } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { searchAccession, type AccessionHit } from "@/crm/fns/accession-search.server";
import { cn } from "@/lib/utils";

/**
 * Persistent LIMS accession bar — scan / type MRN, lab #, name, or phone.
 */
export function AccessionSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [hits, setHits] = useState<AccessionHit[]>([]);

  useEffect(() => {
    const value = q.trim();
    if (value.length < 1) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPending(true);
      try {
        const result = await searchAccession({ data: { q: value } });
        if (!cancelled) {
          setHits(result);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setPending(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function go(hit: AccessionHit) {
    setOpen(false);
    setQ("");
    await router.navigate(hit.href);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (hits[0]) {
      await go(hits[0]);
      return;
    }
    const value = q.trim();
    if (!value) return;
    await router.navigate({ to: "/crm/clients", search: { q: value } });
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          placeholder="Scan or search lab #, MRN, patient, phone…"
          aria-label="Accession search"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          className="h-9 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          autoComplete="off"
        />
        {pending ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide text-muted-foreground">
            …
          </span>
        ) : null}
      </form>
      {open && q.trim() ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto border border-border bg-card shadow-lg"
        >
          {hits.length === 0 && !pending ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">No matching records</li>
          ) : (
            hits.map((hit) => (
              <li key={`${hit.kind}-${hit.id}`} role="option">
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-secondary"
                  onClick={() => void go(hit)}
                >
                  <span className="font-medium">
                    <span className="mr-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {hit.kind === "lab_order"
                        ? "Order"
                        : hit.kind === "client"
                          ? "Registry"
                          : "Lead"}
                    </span>
                    {hit.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{hit.detail}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
