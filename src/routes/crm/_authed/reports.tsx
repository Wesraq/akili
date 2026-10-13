import { createFileRoute, useRouter, getRouteApi } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import { formatMoney } from "@/components/crm/PrintDocument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getReportsSummary } from "@/crm/fns/reports.server";

const authedRoute = getRouteApi("/crm/_authed");

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const Route = createFileRoute("/crm/_authed/reports")({
  validateSearch: (search: Record<string, unknown>): { from?: string; to?: string } => {
    const from = typeof search["from"] === "string" ? search["from"] : undefined;
    const to = typeof search["to"] === "string" ? search["to"] : undefined;
    return {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
  },
  loaderDeps: ({ search }) => {
    const defaults = defaultRange();
    return {
      from: search.from ?? defaults.from,
      to: search.to ?? defaults.to,
    };
  },
  loader: ({ deps }) => getReportsSummary({ data: { from: deps.from, to: deps.to } }),
  head: () => ({ meta: [{ title: "Reports - AKILI LIMS" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const data = Route.useLoaderData();
  const { lab } = authedRoute.useRouteContext();
  const currency = lab.currency || "USD";
  const search = Route.useSearch();
  const router = useRouter();
  const defaults = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(search.from ?? defaults.from);
  const [to, setTo] = useState(search.to ?? defaults.to);

  function applyRange() {
    void router.navigate({
      to: "/crm/reports",
      search: { from, to },
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">LIMS</p>
          <h1 className="mt-2 text-3xl font-semibold">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Period summaries for revenue, test volume and lead funnel.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="button" onClick={applyRange}>
            Apply
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-sm border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Paid revenue</p>
          <p className="mt-2 text-3xl font-semibold">{formatMoney(data.revenue.total, currency)}</p>
        </article>
        <article className="rounded-sm border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">VAT collected</p>
          <p className="mt-2 text-3xl font-semibold">{formatMoney(data.revenue.tax, currency)}</p>
        </article>
        <article className="rounded-sm border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Tests ordered</p>
          <p className="mt-2 text-3xl font-semibold">{data.testVolume}</p>
        </article>
        <article className="rounded-sm border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Leads / converted</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.funnel.total}
            <span className="text-lg text-muted-foreground"> / {data.funnel.converted}</span>
          </p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Paid invoices</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv(`paid-invoices-${data.from}-${data.to}.csv`, [
                  ["Reference", "Client", "Subtotal", "Tax", "Total", "Paid at", "Source"],
                  ...data.paidInvoices.map((row) => [
                    row.reference,
                    row.clientName,
                    String(row.subtotal),
                    String(row.tax),
                    String(row.total),
                    row.paidAt,
                    row.sourceType,
                  ]),
                ])
              }
            >
              <Download className="size-3.5" aria-hidden />
              CSV
            </Button>
          </div>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto text-sm">
            {data.paidInvoices.length === 0 ? (
              <li className="text-muted-foreground">No paid invoices in this period.</li>
            ) : (
              data.paidInvoices.map((row) => (
                <li key={row.id} className="flex justify-between gap-3 border-b border-border pb-2">
                  <span>
                    {row.reference} · {row.clientName}
                  </span>
                  <span className="tabular-nums">{formatMoney(row.total, currency)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Test volume by category</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv(`test-volume-${data.from}-${data.to}.csv`, [
                  ["Category", "Count"],
                  ...data.volumeByCategory.map((row) => [row.category, String(row.count)]),
                ])
              }
            >
              <Download className="size-3.5" aria-hidden />
              CSV
            </Button>
          </div>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto text-sm">
            {data.volumeByCategory.length === 0 ? (
              <li className="text-muted-foreground">No lab tests ordered in this period.</li>
            ) : (
              data.volumeByCategory.map((row) => (
                <li key={row.category} className="flex justify-between gap-3 border-b border-border pb-2">
                  <span>{row.category}</span>
                  <span className="tabular-nums">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Lead funnel</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv(`leads-${data.from}-${data.to}.csv`, [
                  ["Reference", "Name", "Source", "Status", "Created", "Converted"],
                  ...data.leads.map((row) => [
                    row.reference,
                    row.fullName,
                    row.source,
                    row.status,
                    row.createdAt,
                    row.converted ? "yes" : "no",
                  ]),
                ])
              }
            >
              <Download className="size-3.5" aria-hidden />
              CSV
            </Button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                By source
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(data.funnel.bySource).map(([source, count]) => (
                  <li key={source} className="flex justify-between gap-3">
                    <span className="capitalize">{source}</span>
                    <span className="tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                By status
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(data.funnel.byStatus).map(([status, count]) => (
                  <li key={status} className="flex justify-between gap-3">
                    <span className="capitalize">{status}</span>
                    <span className="tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
