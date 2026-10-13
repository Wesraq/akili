import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { toast } from "sonner";

import { formatMoney, PrintDocument } from "@/components/crm/PrintDocument";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInvoice, updateInvoiceStatus } from "@/crm/fns/invoices.server";
import { getLabSettings } from "@/crm/fns/settings.server";

export const Route = createFileRoute("/crm/_authed/invoices/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw new Error("Invalid invoice");
    const [invoice, lab] = await Promise.all([getInvoice({ data: { id } }), getLabSettings()]);
    return { invoice, lab };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.invoice.reference ?? "Invoice"} - AKILI LIMS` }],
  }),
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { invoice, lab } = Route.useLoaderData();
  const router = useRouter();

  async function onStatus(status: "draft" | "issued" | "paid" | "void") {
    try {
      await updateInvoiceStatus({ data: { id: invoice.id, status } });
      toast.success("Status updated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  const sourceLink =
    invoice.sourceType === "lab_order" && invoice.sourceId
      ? ({ to: "/crm/lab-orders/$id" as const, id: invoice.sourceId, label: `Lab order #${invoice.sourceId}` })
      : invoice.sourceType === "equipment_order" && invoice.sourceId
        ? ({
            to: "/crm/equipment-orders/$id" as const,
            id: invoice.sourceId,
            label: `Equipment order #${invoice.sourceId}`,
          })
        : null;

  return (
    <div className="space-y-6">
      <div className="crm-no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="link" className="h-auto px-0">
            <Link to="/crm/invoices">← Invoices</Link>
          </Button>
          <h1 className="mt-2 text-3xl font-semibold">{invoice.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              to="/crm/clients/$id"
              params={{ id: String(invoice.clientId) }}
              className="hover:underline"
            >
              {invoice.clientName}
            </Link>
            {sourceLink ? (
              <>
                {" · "}
                <Link
                  to={sourceLink.to}
                  params={{ id: String(sourceLink.id) }}
                  className="hover:underline"
                >
                  {sourceLink.label}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {invoice.status}
          </Badge>
          {invoice.status === "issued" && (
            <Button size="sm" onClick={() => void onStatus("paid")}>
              Mark paid
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button size="sm" onClick={() => void onStatus("issued")}>
              Issue
            </Button>
          )}
          {invoice.status !== "void" && invoice.status !== "paid" && (
            <Button size="sm" variant="outline" onClick={() => void onStatus("void")}>
              Void
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="size-3.5" aria-hidden />
            Print / PDF
          </Button>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card p-6 shadow-card print:border-0 print:bg-white print:p-0 print:shadow-none">
        <PrintDocument
          title={`Invoice ${invoice.reference}`}
          subtitle={invoice.status === "paid" ? "Paid" : "Tax invoice / statement"}
          org={{
            orgName: lab.orgName,
            tagline: lab.tagline,
            address: lab.address,
            phone: lab.phone,
            email: lab.email,
            footer: lab.invoiceFooter || undefined,
          }}
          meta={[
            { label: "Bill to", value: invoice.clientName },
            {
              label: "Contact",
              value: [invoice.clientPhone, invoice.clientEmail].filter(Boolean).join(" · ") || "—",
            },
            {
              label: "Issued",
              value: invoice.issuedAt
                ? new Date(invoice.issuedAt).toLocaleDateString()
                : "Not issued",
            },
            {
              label: "Due",
              value: invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "—",
            },
          ]}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/20 text-left">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.id} className="border-b border-black/10">
                  <td className="py-2.5">{line.description}</td>
                  <td className="py-2.5 text-right tabular-nums">{line.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(line.unitPrice, lab.currency)}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {formatMoney(line.quantity * line.unitPrice, lab.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-4 text-right font-medium">
                  Subtotal
                </td>
                <td className="pt-4 text-right tabular-nums">
                  {formatMoney(invoice.subtotal, lab.currency)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="pt-1 text-right font-medium">
                  VAT
                </td>
                <td className="pt-1 text-right tabular-nums">
                  {formatMoney(invoice.tax ?? 0, lab.currency)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="pt-2 text-right font-medium">
                  Total
                </td>
                <td className="pt-2 text-right text-lg font-semibold tabular-nums">
                  {formatMoney(invoice.total, lab.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
          {invoice.notes ? (
            <p className="mt-6 text-sm text-black/70">
              <span className="font-medium text-black">Notes: </span>
              {invoice.notes}
            </p>
          ) : null}
        </PrintDocument>
      </div>
    </div>
  );
}
