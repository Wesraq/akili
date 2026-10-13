import { createFileRoute, Link, getRouteApi, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { listInvoices } from "@/crm/fns/invoices.server";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/components/crm/PrintDocument";

const statuses = ["draft", "issued", "paid", "void"] as const;
const authedRoute = getRouteApi("/crm/_authed");

const statusTone: Record<(typeof statuses)[number], string> = {
  draft: "bg-muted text-muted-foreground border-border",
  issued: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  void: "bg-muted text-muted-foreground border-border",
};

export const Route = createFileRoute("/crm/_authed/invoices/")({
  validateSearch: (search: Record<string, unknown>): { clientId?: string; status?: string } => {
    const clientId = typeof search["clientId"] === "string" ? search["clientId"] : undefined;
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    return {
      ...(clientId ? { clientId } : {}),
      ...(status ? { status } : {}),
    };
  },
  loaderDeps: ({ search }) => ({
    clientId: search.clientId ?? "",
    status: search.status ?? "",
  }),
  loader: async ({ deps }) => {
    const clientId = deps.clientId ? Number(deps.clientId) : undefined;
    const status =
      deps.status && statuses.includes(deps.status as (typeof statuses)[number])
        ? (deps.status as (typeof statuses)[number])
        : undefined;
    const invoices = await listInvoices({
      data: {
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
      },
    });
    return { invoices };
  },
  head: () => ({ meta: [{ title: "Invoices - AKILI LIMS" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const { invoices } = Route.useLoaderData();
  const { lab } = authedRoute.useRouteContext();
  const currency = lab.currency || "USD";
  const search = Route.useSearch();
  const router = useRouter();

  const counts = useMemo(() => {
    const base = { draft: 0, issued: 0, paid: 0, void: 0 };
    for (const invoice of invoices) {
      base[invoice.status] += 1;
    }
    return base;
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-primary">LIMS</p>
        <h1 className="mt-2 text-3xl font-semibold">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generated from lab and equipment orders. Open an order to create one.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              void router.navigate({
                to: "/crm/invoices",
                search: {
                  ...(search.clientId ? { clientId: search.clientId } : {}),
                  ...(search.status === status ? {} : { status }),
                },
              })
            }
            className={cn(
              "rounded-sm border p-4 text-left transition-colors",
              search.status === status ? "border-primary bg-primary-soft" : "border-border bg-card",
            )}
          >
            <p className="text-xs capitalize text-muted-foreground">{status}</p>
            <p className="mt-1 text-2xl font-semibold">{counts[status]}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {invoices.map((invoice) => (
          <article
            key={invoice.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-card p-4 shadow-card"
          >
            <div>
              <p className="font-medium">
                {invoice.reference}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {invoice.clientName}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {invoice.sourceType.replace("_", " ")}
                {invoice.sourceId ? ` #${invoice.sourceId}` : ""} · {formatMoney(invoice.total, currency)} ·{" "}
                {new Date(invoice.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-sm border px-2.5 py-1 text-xs font-medium capitalize",
                  statusTone[invoice.status],
                )}
              >
                {invoice.status}
              </span>
              <Button asChild size="sm">
                <Link to="/crm/invoices/$id" params={{ id: String(invoice.id) }}>
                  Open
                </Link>
              </Button>
            </div>
          </article>
        ))}
        {invoices.length === 0 && (
          <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No invoices yet. Create one from a lab or equipment order.
          </p>
        )}
      </div>
    </div>
  );
}
