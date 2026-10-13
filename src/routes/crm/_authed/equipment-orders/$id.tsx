import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Printer, Receipt } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { formatMoney, PrintDocument } from "@/components/crm/PrintDocument";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEquipmentOrder,
  updateEquipmentOrderItem,
  updateEquipmentOrderStatus,
} from "@/crm/fns/equipment-orders.server";
import {
  createInvoiceFromEquipmentOrder,
  findInvoiceForSource,
} from "@/crm/fns/invoices.server";
import { getLabSettings } from "@/crm/fns/settings.server";

const statuses = ["quoted", "confirmed", "fulfilling", "delivered", "cancelled"] as const;

export const Route = createFileRoute("/crm/_authed/equipment-orders/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw new Error("Invalid order");
    const [order, invoice, lab] = await Promise.all([
      getEquipmentOrder({ data: { id } }),
      findInvoiceForSource({ data: { sourceType: "equipment_order", sourceId: id } }),
      getLabSettings(),
    ]);
    return { order, invoice, lab };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Equipment order #${loaderData?.order.id ?? ""} - AKILI LIMS` }],
  }),
  component: EquipmentOrderDetailPage,
});

function EquipmentOrderDetailPage() {
  const { order, invoice, lab } = Route.useLoaderData();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [invoicing, setInvoicing] = useState(false);

  async function onStatus(status: (typeof statuses)[number]) {
    try {
      await updateEquipmentOrderStatus({ data: { id: order.id, status } });
      toast.success("Status updated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onSaveItems(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await Promise.all(
        order.items.map((item) =>
          updateEquipmentOrderItem({
            data: {
              id: item.id,
              quantity: Number(form.get(`qty-${item.id}`)) || item.quantity,
              unitPrice: Number(form.get(`price-${item.id}`)) || item.unitPrice,
              notes: String(form.get(`notes-${item.id}`) ?? "") || null,
            },
          }),
        ),
      );
      toast.success("Line items saved");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function onInvoice() {
    setInvoicing(true);
    try {
      const created = await createInvoiceFromEquipmentOrder({
        data: { equipmentOrderId: order.id },
      });
      toast.success("Invoice ready");
      await router.navigate({ to: "/crm/invoices/$id", params: { id: String(created.id) } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create invoice");
    } finally {
      setInvoicing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="crm-no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="link" className="h-auto px-0">
            <Link to="/crm/equipment-orders">← Equipment orders</Link>
          </Button>
          <h1 className="mt-2 text-3xl font-semibold">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              to="/crm/clients/$id"
              params={{ id: String(order.clientId) }}
              className="hover:underline"
            >
              {order.clientName}
            </Link>{" "}
            · {new Date(order.orderedAt).toLocaleString()}
            {order.leadId ? ` · Lead #${order.leadId}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {order.status}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="size-3.5" aria-hidden />
            Print quote
          </Button>
          {invoice ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/crm/invoices/$id" params={{ id: String(invoice.id) }}>
                <Receipt className="size-3.5" aria-hidden />
                {invoice.reference}
              </Link>
            </Button>
          ) : (
            order.status !== "cancelled" && (
              <Button size="sm" variant="outline" disabled={invoicing} onClick={() => void onInvoice()}>
                <Receipt className="size-3.5" aria-hidden />
                {invoicing ? "Creating…" : "Create invoice"}
              </Button>
            )
          )}
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <>
              {order.status === "quoted" && (
                <Button variant="outline" size="sm" onClick={() => void onStatus("confirmed")}>
                  Confirm
                </Button>
              )}
              {order.status === "confirmed" && (
                <Button variant="outline" size="sm" onClick={() => void onStatus("fulfilling")}>
                  Start fulfilment
                </Button>
              )}
              {order.status === "fulfilling" && (
                <Button size="sm" onClick={() => void onStatus("delivered")}>
                  Mark delivered
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => void onStatus("cancelled")}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <ol className="crm-no-print grid gap-2 sm:grid-cols-5">
        {statuses.map((step, index) => (
          <li
            key={step}
            className={`rounded-sm border px-3 py-2 text-sm capitalize ${
              order.status === step
                ? "border-primary bg-primary-soft font-medium"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span className="text-xs">{index + 1}.</span> {step}
          </li>
        ))}
      </ol>

      <form onSubmit={(event) => void onSaveItems(event)} className="crm-no-print space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border border-border bg-card px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Line items</h2>
            <p className="text-sm text-muted-foreground">
              Total {formatMoney(order.total, lab.currency)}
            </p>
          </div>
          {order.status !== "cancelled" && order.status !== "delivered" ? (
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Saving…" : "Save lines"}
            </Button>
          ) : null}
        </div>

        <div className="overflow-hidden border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Product
                  </th>
                  <th className="h-9 w-24 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Qty
                  </th>
                  <th className="h-9 w-36 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Unit ({lab.currency})
                  </th>
                  <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Notes
                  </th>
                  <th className="h-9 w-28 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Line
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const lockedLine =
                    order.status === "cancelled" || order.status === "delivered";
                  return (
                    <tr key={item.id} className="border-b border-border/80 align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium">
                          {item.productCode} · {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[item.brand, item.category].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          name={`qty-${item.id}`}
                          type="number"
                          min={1}
                          defaultValue={item.quantity}
                          className="h-9"
                          disabled={lockedLine}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          name={`price-${item.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={item.unitPrice}
                          className="h-9"
                          disabled={lockedLine}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          name={`notes-${item.id}`}
                          defaultValue={item.notes ?? ""}
                          className="h-9"
                          disabled={lockedLine}
                        />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium">
                        {formatMoney(item.quantity * item.unitPrice, lab.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {order.notes ? (
          <p className="rounded-sm border border-border bg-muted/40 p-3 text-sm">
            <span className="font-medium">Order notes: </span>
            {order.notes}
          </p>
        ) : null}
      </form>

      <div className="hidden print:block">
        <PrintDocument
          title={`Equipment quote #${order.id}`}
          subtitle={order.status === "quoted" ? "Quotation" : `Status: ${order.status}`}
          org={{
            orgName: lab.orgName,
            tagline: lab.tagline,
            address: lab.address,
            phone: lab.phone,
            email: lab.email,
            footer: lab.invoiceFooter || undefined,
          }}
          meta={[
            { label: "Customer", value: order.clientName },
            {
              label: "Contact",
              value: [order.clientPhone, order.clientEmail].filter(Boolean).join(" · ") || "—",
            },
            { label: "Dated", value: new Date(order.orderedAt).toLocaleDateString() },
            { label: "Total", value: formatMoney(order.total, lab.currency) },
          ]}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/20 text-left">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-black/10 align-top">
                  <td className="py-2.5">
                    <p className="font-medium">
                      {item.productCode} · {item.productName}
                    </p>
                    <p className="text-xs text-black/60">
                      {[item.brand, item.category].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(item.unitPrice, lab.currency)}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {formatMoney(item.quantity * item.unitPrice, lab.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-4 text-right font-medium">
                  Quote total
                </td>
                <td className="pt-4 text-right text-lg font-semibold tabular-nums">
                  {formatMoney(order.total, lab.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
          {order.notes ? (
            <p className="mt-6 text-sm text-black/70">
              <span className="font-medium text-black">Notes: </span>
              {order.notes}
            </p>
          ) : null}
          <p className="mt-8 text-xs text-black/55">
            Prices in {lab.currency}. Lead times and warranty follow catalogue terms unless noted.
          </p>
        </PrintDocument>
      </div>
    </div>
  );
}
