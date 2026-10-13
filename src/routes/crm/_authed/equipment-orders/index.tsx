import { createFileRoute, Link, useRouter, getRouteApi } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { formatMoney } from "@/components/crm/PrintDocument";
import {
  FormAlert,
  FormField,
  FormSection,
  StickyFormActions,
} from "@/components/crm/LimsForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { searchClientsLite } from "@/crm/fns/clients.server";
import {
  createEquipmentOrder,
  listEquipmentCatalogue,
  listEquipmentOrders,
} from "@/crm/fns/equipment-orders.server";
import { cn } from "@/lib/utils";

const statuses = ["quoted", "confirmed", "fulfilling", "delivered", "cancelled"] as const;
const authedRoute = getRouteApi("/crm/_authed");

const statusTone: Record<(typeof statuses)[number], string> = {
  quoted: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  fulfilling: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  delivered: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export const Route = createFileRoute("/crm/_authed/equipment-orders/")({
  validateSearch: (search: Record<string, unknown>): {
    clientId?: string;
    status?: string;
    leadId?: string;
  } => {
    const clientId = typeof search["clientId"] === "string" ? search["clientId"] : undefined;
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    const leadId = typeof search["leadId"] === "string" ? search["leadId"] : undefined;
    return {
      ...(clientId ? { clientId } : {}),
      ...(status ? { status } : {}),
      ...(leadId ? { leadId } : {}),
    };
  },
  loaderDeps: ({ search }) => ({
    clientId: search.clientId ?? "",
    status: search.status ?? "",
    leadId: search.leadId ?? "",
  }),
  loader: async ({ deps }) => {
    const clientId = deps.clientId ? Number(deps.clientId) : undefined;
    const status =
      deps.status && statuses.includes(deps.status as (typeof statuses)[number])
        ? (deps.status as (typeof statuses)[number])
        : undefined;
    const [orders, catalogue, clientOptions] = await Promise.all([
      listEquipmentOrders({
        data: {
          ...(clientId ? { clientId } : {}),
          ...(status ? { status } : {}),
        },
      }),
      listEquipmentCatalogue(),
      searchClientsLite({ data: {} }),
    ]);
    return {
      orders,
      catalogue,
      clientOptions,
      prefClientId: deps.clientId,
      prefLeadId: deps.leadId,
    };
  },
  head: () => ({ meta: [{ title: "Equipment orders - AKILI LIMS" }] }),
  component: EquipmentOrdersPage,
});

function EquipmentOrdersPage() {
  const { orders, catalogue, clientOptions, prefClientId, prefLeadId } = Route.useLoaderData();
  const { lab } = authedRoute.useRouteContext();
  const currency = lab.currency || "USD";
  const search = Route.useSearch();
  const router = useRouter();
  const [clientId, setClientId] = useState(prefClientId || "");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(Boolean(prefClientId || prefLeadId));
  const [category, setCategory] = useState("all");
  const [formErrors, setFormErrors] = useState<{ client?: string; items?: string }>({});

  useEffect(() => {
    if (prefClientId) {
      setClientId(prefClientId);
      setComposeOpen(true);
    }
  }, [prefClientId]);

  const counts = useMemo(() => {
    const base = {
      quoted: 0,
      confirmed: 0,
      fulfilling: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      base[order.status] += 1;
    }
    return base;
  }, [orders]);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(catalogue.map((item) => item.category)))],
    [catalogue],
  );

  const filteredCatalogue = useMemo(
    () =>
      category === "all" ? catalogue : catalogue.filter((item) => item.category === category),
    [catalogue, category],
  );

  const selectedCount = Object.keys(selected).length;

  function toggleProduct(code: string) {
    setSelected((prev) => {
      if (prev[code]) {
        const next = { ...prev };
        delete next[code];
        return next;
      }
      return { ...prev, [code]: 1 };
    });
  }

  function setQty(code: string, qty: number) {
    setSelected((prev) => {
      if (!prev[code]) return prev;
      return { ...prev, [code]: Math.max(1, Math.min(999, qty)) };
    });
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: { client?: string; items?: string } = {};
    if (!clientId) errors.client = "Select a client";
    const items = Object.entries(selected).map(([productCode, quantity]) => ({
      productCode,
      quantity,
    }));
    if (items.length === 0) errors.items = "Select at least one product";
    setFormErrors(errors);
    if (errors.client || errors.items) {
      toast.error("Complete the required fields");
      return;
    }
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const order = await createEquipmentOrder({
        data: {
          clientId: Number(clientId),
          leadId: prefLeadId ? Number(prefLeadId) : null,
          notes: String(form.get("notes") ?? "") || null,
          items,
        },
      });
      toast.success("Equipment order created");
      await router.navigate({
        to: "/crm/equipment-orders/$id",
        params: { id: String(order.id) },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create order");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">LIMS</p>
          <h1 className="mt-2 text-3xl font-semibold">Equipment orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quote and fulfil analysers, consumables and lab equipment from the catalogue.
          </p>
        </div>
        <Button type="button" onClick={() => setComposeOpen((value) => !value)}>
          {composeOpen ? "Hide composer" : "New equipment order"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              void router.navigate({
                to: "/crm/equipment-orders",
                search: {
                  ...(search.clientId ? { clientId: search.clientId } : {}),
                  ...(search.leadId ? { leadId: search.leadId } : {}),
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

      {composeOpen && (
        <form onSubmit={onCreate} className="space-y-4">
          <div className="border border-border bg-card px-5 py-4">
            <h2 className="font-display text-lg font-semibold">New equipment order</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {prefLeadId
                ? `Linked from lead #${prefLeadId} · required fields marked with *`
                : "Quote products from the catalogue · required fields marked with *"}
            </p>
          </div>

          {(formErrors.client || formErrors.items) && (
            <FormAlert>
              {[formErrors.client, formErrors.items].filter(Boolean).join(" · ")}
            </FormAlert>
          )}

          <FormSection title="Client">
            <FormField label="Client" required error={formErrors.client}>
              <Select
                value={clientId}
                onValueChange={(value) => {
                  setClientId(value);
                  setFormErrors((prev) => ({ ...prev, client: undefined }));
                }}
              >
                <SelectTrigger className={cn(formErrors.client && "border-destructive")}>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormSection>

          <FormSection
            title="Catalogue"
            description="Tick products and set quantities. Prices come from the live catalogue."
          >
            <FormField
              label="Products"
              required
              error={formErrors.items}
              hint={`${selectedCount} selected`}
            >
              <div className="space-y-3">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === "all" ? "All categories" : item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div
                  className={cn(
                    "grid gap-2 rounded-sm border p-2 sm:grid-cols-2 lg:grid-cols-3",
                    formErrors.items ? "border-destructive" : "border-border",
                  )}
                >
                  {filteredCatalogue.map((product) => {
                    const qty = selected[product.code];
                    const checked = Boolean(qty);
                    return (
                      <div
                        key={product.code}
                        className={cn(
                          "rounded-sm border p-3",
                          checked ? "border-primary bg-primary-soft/50" : "border-border",
                        )}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              toggleProduct(product.code);
                              setFormErrors((prev) => ({ ...prev, items: undefined }));
                            }}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block text-sm font-medium">
                              {product.code} · {product.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {product.brand} · {product.category} ·{" "}
                              {formatMoney(product.price, currency)}
                            </span>
                          </span>
                        </label>
                        {checked ? (
                          <div className="mt-3 grid gap-1 pl-7">
                            <Label htmlFor={`qty-${product.code}`} className="text-xs">
                              Qty
                            </Label>
                            <Input
                              id={`qty-${product.code}`}
                              type="number"
                              min={1}
                              max={999}
                              value={qty}
                              onChange={(event) =>
                                setQty(product.code, Number(event.target.value) || 1)
                              }
                              className="h-8 w-24"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </FormField>
          </FormSection>

          <FormSection title="Notes">
            <FormField label="Order notes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={2} />
            </FormField>
          </FormSection>

          <StickyFormActions
            summary={`${selectedCount} line${selectedCount === 1 ? "" : "s"} selected`}
          >
            <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create order"}
            </Button>
          </StickyFormActions>
        </form>
      )}

      <div className="grid gap-3">
        {orders.map((order) => (
          <article
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-card p-4 shadow-card"
          >
            <div>
              <p className="font-medium">
                Order #{order.id}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {order.clientName}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.itemCount} line{order.itemCount === 1 ? "" : "s"} · {formatMoney(order.total, currency)} ·{" "}
                {new Date(order.orderedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-sm border px-2.5 py-1 text-xs font-medium capitalize",
                  statusTone[order.status],
                )}
              >
                {order.status}
              </span>
              <Button asChild size="sm">
                <Link to="/crm/equipment-orders/$id" params={{ id: String(order.id) }}>
                  Open
                </Link>
              </Button>
            </div>
          </article>
        ))}
        {orders.length === 0 && (
          <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No equipment orders in this filter.
          </p>
        )}
      </div>
    </div>
  );
}
