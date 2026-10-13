import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { AlertTriangle, FlaskConical } from "lucide-react";

import {
  LimsGridBody,
  LimsGridHead,
  LimsGridRow,
  LimsGridTable,
  LimsGridTd,
  LimsGridTh,
  LimsDataGrid,
} from "@/components/crm/LimsDataGrid";
import { LimsInsightPanel, LimsInsightRow } from "@/components/crm/LimsInsightPanel";
import { formatMoney } from "@/components/crm/PrintDocument";
import {
  LabStatusBadge,
  LabWorkflowStrip,
  LimsPageHeader,
} from "@/components/crm/lims-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/crm/fns/dashboard.server";
import { sectionLabel } from "@/lib/akili-forms";

const authedRoute = getRouteApi("/crm/_authed");

export const Route = createFileRoute("/crm/_authed/")({
  loader: () => getDashboard(),
  head: () => ({ meta: [{ title: "Lab workboard - AKILI LIMS" }] }),
  component: CrmDashboard,
});

function accLabel(order: { id: number; accessionNumber?: string | null }) {
  return order.accessionNumber || `LAB-${order.id}`;
}

function CrmDashboard() {
  const data = Route.useLoaderData();
  const { lab } = authedRoute.useRouteContext();
  const currency = lab.currency || "ZMW";

  return (
    <div className="space-y-8">
      <LimsPageHeader
        eyebrow="Lab operations"
        title="Workboard"
        description="Dashboard insights and queues — accession, receive, bench, validate, release."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/crm/clients">Open registry</Link>
            </Button>
            <Button asChild>
              <Link to="/crm/lab-orders">
                <FlaskConical className="size-4" />
                New accession
              </Link>
            </Button>
          </>
        }
      />

      <LimsInsightRow>
        <LimsInsightPanel
          label="Awaiting validation"
          value={data.awaitingValidationCount}
          hint="Second staff must release"
          to="/crm/lab-orders"
          search={{ status: "reported" }}
          tone="accent"
        />
        <LimsInsightPanel
          label="Open on bench"
          value={data.openOrdersCount}
          hint="Accessioned → in progress"
          to="/crm/lab-orders"
        />
        <LimsInsightPanel
          label="Overdue TAT"
          value={data.staleLabOrdersCount}
          hint="Past expected turnaround"
          to="/crm/lab-orders"
          tone={data.staleLabOrdersCount > 0 ? "danger" : "default"}
        />
        <LimsInsightPanel
          label="Pending receipt"
          value={data.stageCounts.ordered}
          hint="Accessioned, not yet received"
          to="/crm/lab-orders"
          search={{ status: "ordered" }}
        />
        <LimsInsightPanel
          label="Today's appointments"
          value={data.todayAppointments.length}
          hint="Scheduled collection / visits"
          to="/crm/appointments"
        />
      </LimsInsightRow>

      <section className="space-y-3 border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Specimen lifecycle
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump into a stage queue. Counts update as accessions move.
            </p>
          </div>
          {data.staleLabOrdersCount > 0 ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3.5" aria-hidden />
              {data.staleLabOrdersCount} overdue TAT
            </Badge>
          ) : null}
        </div>
        <LabWorkflowStrip counts={data.stageCounts} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-display text-base font-semibold">Your job queue</h2>
            <Link to="/crm/lab-orders" className="text-xs font-semibold text-primary hover:underline">
              All accessions
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.myQueue.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No open work items.</li>
            ) : (
              data.myQueue.map((order) => (
                <li key={order.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <Link
                      to="/crm/lab-orders/$id"
                      params={{ id: String(order.id) }}
                      className="text-sm font-medium hover:underline"
                    >
                      {accLabel(order)} · {order.clientName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {sectionLabel(order.section)} · Updated{" "}
                      {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <LabStatusBadge status={order.status} />
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="border border-border border-amber-500/30 bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-display text-base font-semibold">Exceptions · overdue TAT</h2>
            <Link to="/crm/lab-orders" className="text-xs font-semibold text-primary hover:underline">
              Work queue
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.staleLabOrders.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No overdue open orders.</li>
            ) : (
              data.staleLabOrders.map((order) => (
                <li key={order.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <Link
                      to="/crm/lab-orders/$id"
                      params={{ id: String(order.id) }}
                      className="text-sm font-medium hover:underline"
                    >
                      {accLabel(order)} · {order.clientName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Due {order.dueAt ? new Date(order.dueAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <LabStatusBadge status={order.status} />
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold">Recent accessions</h2>
          <Link to="/crm/lab-orders" className="text-xs font-semibold text-primary hover:underline">
            Open accessioning
          </Link>
        </div>
        <LimsDataGrid
          isEmpty={data.recentAccessions.length === 0}
          empty="No accessions yet."
          footer={`${data.recentAccessions.length} most recent`}
        >
          <LimsGridTable>
            <LimsGridHead>
              <tr>
                <LimsGridTh>Accession</LimsGridTh>
                <LimsGridTh>Patient</LimsGridTh>
                <LimsGridTh>Section</LimsGridTh>
                <LimsGridTh>Status</LimsGridTh>
                <LimsGridTh>Ordered</LimsGridTh>
              </tr>
            </LimsGridHead>
            <LimsGridBody>
              {data.recentAccessions.map((order) => (
                <LimsGridRow key={order.id}>
                  <LimsGridTd>
                    <Link
                      to="/crm/lab-orders/$id"
                      params={{ id: String(order.id) }}
                      className="font-medium tabular-nums hover:underline"
                    >
                      {accLabel(order)}
                    </Link>
                  </LimsGridTd>
                  <LimsGridTd>
                    <div>
                      <p>{order.clientName}</p>
                      {order.labMrn ? (
                        <p className="text-xs text-muted-foreground">{order.labMrn}</p>
                      ) : null}
                    </div>
                  </LimsGridTd>
                  <LimsGridTd className="text-muted-foreground">
                    {sectionLabel(order.section)}
                  </LimsGridTd>
                  <LimsGridTd>
                    <LabStatusBadge status={order.status} />
                  </LimsGridTd>
                  <LimsGridTd className="text-xs text-muted-foreground tabular-nums">
                    {new Date(order.orderedAt).toLocaleString()}
                  </LimsGridTd>
                </LimsGridRow>
              ))}
            </LimsGridBody>
          </LimsGridTable>
        </LimsDataGrid>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-display text-base font-semibold">Validation queue</h2>
            <Link
              to="/crm/lab-orders"
              search={{ status: "reported" }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open queue
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.awaitingValidation.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">
                No results waiting for release.
              </li>
            ) : (
              data.awaitingValidation.map((order) => (
                <li key={order.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <Link
                      to="/crm/lab-orders/$id"
                      params={{ id: String(order.id) }}
                      className="text-sm font-medium hover:underline"
                    >
                      {accLabel(order)} · {order.clientName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {sectionLabel(order.section)} · Submitted{" "}
                      {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <LabStatusBadge status="reported" />
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-display text-base font-semibold">Today&apos;s appointments</h2>
            <Link
              to="/crm/appointments"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Calendar
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.todayAppointments.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">
                No appointments scheduled for today.
              </li>
            ) : (
              data.todayAppointments.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{item.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.serviceType} ·{" "}
                      {new Date(item.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {item.status.replace("_", " ")}
                  </Badge>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-display text-base font-semibold">Unpaid invoices</h2>
            <Link
              to="/crm/invoices"
              search={{ status: "issued" }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Billing
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.unpaidInvoices.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No issued unpaid invoices.</li>
            ) : (
              data.unpaidInvoices.map((invoice) => (
                <li key={invoice.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <Link
                      to="/crm/invoices/$id"
                      params={{ id: String(invoice.id) }}
                      className="text-sm font-medium hover:underline"
                    >
                      {invoice.reference} · {invoice.clientName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatMoney(invoice.total, currency)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
