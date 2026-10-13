import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form14LogTable, type Form14LogRow } from "@/components/crm/Form14HistoLog";
import {
  FormField,
  FormGrid,
  FormSection,
  StickyFormActions,
} from "@/components/crm/LimsForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listAppointments } from "@/crm/fns/appointments.server";
import { getClient, updateClient } from "@/crm/fns/clients.server";
import { listEquipmentOrders } from "@/crm/fns/equipment-orders.server";
import { listInvoices } from "@/crm/fns/invoices.server";
import { listLabOrders } from "@/crm/fns/lab-orders.server";
import {
  clientFormViews,
  formFieldLabels,
  sectionLabel,
  type ClientFormViewId,
} from "@/lib/akili-forms";
import { bodySitesSummary, parseBodySites } from "@/lib/body-sites";
import { cn } from "@/lib/utils";

function toForm14Rows(
  orders: Array<{
    id: number;
    accessionNumber: string | null;
    orderedAt: string;
    patientNumber: string | null;
    age?: string | null;
    sex?: string | null;
    ward?: string | null;
    specimenType: string | null;
    specimenSites?: string | null;
    requestingDoctor: string | null;
    broughtBy: string | null;
    receivedByName?: string | null;
    contactNumber?: string | null;
    dateCollected?: string | null;
    clientName: string;
  }>,
): Form14LogRow[] {
  return orders.map((order) => ({
    id: order.id,
    dateCollected: order.dateCollected || "",
    dateReceived: new Date(order.orderedAt).toLocaleDateString(),
    mrNumber: order.patientNumber || "",
    patientName: order.clientName,
    ageSex: [order.age, order.sex].filter(Boolean).join(" / "),
    ageSexHint: order.sex,
    ward: order.ward || "",
    specimenType: order.specimenType || "",
    requestingDoctor: order.requestingDoctor || "",
    deliveredBy: order.broughtBy || "",
    receivedBy: order.receivedByName || "",
    labNumber: order.accessionNumber || `LAB-${order.id}`,
    contactNumber: order.contactNumber || "",
    specimenSites: parseBodySites(order.specimenSites),
  }));
}

const formViewIds = clientFormViews.map((view) => view.id);

function isFormViewId(value: string | undefined): value is ClientFormViewId {
  return Boolean(value && formViewIds.includes(value as ClientFormViewId));
}

export const Route = createFileRoute("/crm/_authed/clients/$id")({
  validateSearch: (search: Record<string, unknown>): {
    form?: ClientFormViewId;
    status?: string;
  } => {
    const form =
      typeof search["form"] === "string" && isFormViewId(search["form"])
        ? search["form"]
        : undefined;
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    return {
      ...(form ? { form } : {}),
      ...(status ? { status } : {}),
    };
  },
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw new Error("Invalid client");
    const [client, appointments, orders, equipment, invoices] = await Promise.all([
      getClient({ data: { id } }),
      listAppointments({ data: { clientId: id } }),
      listLabOrders({ data: { clientId: id } }),
      listEquipmentOrders({ data: { clientId: id } }),
      listInvoices({ data: { clientId: id } }),
    ]);
    return { client, appointments, orders, equipment, invoices };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.client.name ?? "Client"} - AKILI LIMS` }],
  }),
  component: ClientDetailPage,
});

const statusLabel: Record<string, string> = {
  ordered: "Received",
  in_progress: "In progress",
  reported: "Awaiting authorisation",
  validated: "Authorised",
  cancelled: "Cancelled",
};

const formStatusFilters = ["all", "ordered", "in_progress", "reported", "validated"] as const;

function downloadCsv(filename: string, rows: string[][]) {
  const body = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell.replaceAll('"', '""');
          return `"${value}"`;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ClientDetailPage() {
  const { client, appointments, orders, equipment, invoices } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [type, setType] = useState(client.type);
  const [sex, setSex] = useState(client.sex ?? "unknown");
  const [active, setActive] = useState(client.active !== false);


  const formView: ClientFormViewId = search.form ?? "reception";
  const statusFilter = search.status ?? "all";

  const upcoming = appointments.filter((item) => item.status === "scheduled").length;
  const openOrders = orders.filter(
    (item) =>
      item.status === "ordered" ||
      item.status === "received" ||
      item.status === "in_progress",
  ).length;
  const openEquipment = equipment.filter((item) =>
    ["quoted", "confirmed", "fulfilling"].includes(item.status),
  ).length;

  const activeForm = clientFormViews.find((view) => view.id === formView) ?? clientFormViews[0];

  const sectionOrders = useMemo(() => {
    if (formView === "reception") return orders;
    return orders.filter((order) => order.section === formView);
  }, [orders, formView]);

  const formOrders = useMemo(() => {
    if (statusFilter === "all") return sectionOrders;
    return sectionOrders.filter((order) => order.status === statusFilter);
  }, [sectionOrders, statusFilter]);

  const formCounts = useMemo(() => {
    const counts: Record<ClientFormViewId, number> = {
      reception: orders.length,
      haem_chem: 0,
      microbiology: 0,
      serology: 0,
      histopathology: 0,
    };
    for (const order of orders) {
      const key = order.section as ClientFormViewId | null;
      if (key && key in counts && key !== "reception") {
        counts[key] += 1;
      }
    }
    return counts;
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<(typeof formStatusFilters)[number], number> = {
      all: sectionOrders.length,
      ordered: 0,
      in_progress: 0,
      reported: 0,
      validated: 0,
    };
    for (const order of sectionOrders) {
      if (order.status in counts) {
        counts[order.status as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [sectionOrders]);

  function setFormSearch(next: {
    form?: ClientFormViewId;
    status?: string;
    clearStatus?: boolean;
  }) {
    void router.navigate({
      to: "/crm/clients/$id",
      params: { id: String(client.id) },
      search: {
        form: next.form ?? formView,
        ...(next.clearStatus
          ? {}
          : next.status
            ? { status: next.status }
            : statusFilter !== "all"
              ? { status: statusFilter }
              : {}),
      },
      replace: true,
    });
  }

  function exportFormCsv() {
    const rows = [
      [
        "Lab #",
        formFieldLabels.patientNumber,
        formFieldLabels.dateReceived,
        formFieldLabels.specimenType,
        formFieldLabels.specimenSites,
        formFieldLabels.section,
        formFieldLabels.testsRequested,
        formFieldLabels.receivedFrom,
        formFieldLabels.broughtBy,
        formFieldLabels.requestingDoctor,
        formFieldLabels.sponsor,
        "Status",
      ],
      ...formOrders.map((order) => [
        String(order.id),
        order.patientNumber || "",
        new Date(order.orderedAt).toLocaleString(),
        order.specimenType || "",
        bodySitesSummary(parseBodySites(order.specimenSites)),
        sectionLabel(order.section),
        order.testLabels?.join("; ") || "",
        order.receivedFrom || "",
        order.broughtBy || "",
        order.requestingDoctor || "",
        order.sponsor || "",
        statusLabel[order.status] ?? order.status,
      ]),
    ];
    downloadCsv(
      `akili-${client.name.replaceAll(/[^\w]+/g, "-").toLowerCase()}-${formView}.csv`,
      rows,
    );
    toast.success("CSV downloaded");
  }
  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await updateClient({
        data: {
          id: client.id,
          type,
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? "") || null,
          email: String(form.get("email") ?? "") || null,
          nationalId: String(form.get("nationalId") ?? "") || null,
          labMrn: String(form.get("labMrn") ?? "") || null,
          dateOfBirth: String(form.get("dateOfBirth") ?? "") || null,
          sex:
            sex === "male" || sex === "female" || sex === "other" || sex === "unknown"
              ? sex
              : null,
          address: String(form.get("address") ?? "") || null,
          nextOfKin: String(form.get("nextOfKin") ?? "") || null,
          nextOfKinPhone: String(form.get("nextOfKinPhone") ?? "") || null,
          active,
          notes: String(form.get("notes") ?? "") || null,
        },
      });
      toast.success("Client updated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  const newOrderSearch =
    formView === "reception"
      ? { clientId: String(client.id) }
      : { clientId: String(client.id), section: formView };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="link" className="h-auto px-0">
            <Link to="/crm/clients">← Clients</Link>
          </Button>
          <h1 className="mt-2 text-3xl font-semibold">{client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono font-medium text-foreground">
              {client.labMrn || `AKL-${String(client.id).padStart(5, "0")}`}
            </span>
            {" · "}
            <span className="capitalize">{client.type}</span>
            {client.sex ? ` · ${client.sex}` : ""}
            {client.age != null ? ` · age ${client.age}` : ""}
            {client.active === false ? " · inactive" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/crm/appointments" search={{ clientId: String(client.id) }}>
              Book appointment
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/crm/equipment-orders" search={{ clientId: String(client.id) }}>
              New equipment order
            </Link>
          </Button>
          <Button asChild>
            <Link to="/crm/lab-orders" search={newOrderSearch}>
              New lab order
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Upcoming appointments</p>
          <p className="mt-1 text-2xl font-semibold">{upcoming}</p>
        </article>
        <article className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Open lab orders</p>
          <p className="mt-1 text-2xl font-semibold">{openOrders}</p>
        </article>
        <article className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Open equipment</p>
          <p className="mt-1 text-2xl font-semibold">{openEquipment}</p>
        </article>
        <article className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total history</p>
          <p className="mt-1 text-2xl font-semibold">
            {appointments.length + orders.length + equipment.length}
          </p>
        </article>
      </div>

      <section className="rounded-sm border border-border bg-card p-6 shadow-card print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Worksheets</p>
            <h2 className="mt-2 font-display text-lg font-semibold">Lab forms</h2>
            <p className="mt-1 text-sm text-muted-foreground print:hidden">
              {activeForm.description}. Open a row to view or complete that worksheet.
            </p>
            <p className="mt-1 hidden text-sm text-muted-foreground print:block">
              {activeForm.label} · {client.name}
            </p>
          </div>
          <div className="flex w-full max-w-xl flex-wrap items-end gap-2 print:hidden">
            <div className="grid min-w-[220px] flex-1 gap-2">
              <Label htmlFor="client-form-view">Form</Label>
              <Select
                value={formView}
                onValueChange={(value) => setFormSearch({ form: value as ClientFormViewId })}
              >
                <SelectTrigger id="client-form-view">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientFormViews.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.label} ({formCounts[view.id]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/crm/lab-orders" search={newOrderSearch}>
                New for this form
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportFormCsv}>
              <Download className="size-3.5" aria-hidden />
              CSV
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5" aria-hidden />
              Print
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          {formStatusFilters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                status === "all"
                  ? setFormSearch({ clearStatus: true })
                  : setFormSearch({ status })
              }
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === status
                  ? "border-primary bg-primary-soft text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/50",
              )}
            >
              {status === "all" ? "All" : statusLabel[status]} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {formView === "histopathology" ? (
          <div className="mt-6 space-y-3">
            <Form14LogTable
              rows={toForm14Rows(formOrders)}
              emptyLabel={`No entries for ${activeForm.label}${
                statusFilter !== "all" ? ` · ${statusLabel[statusFilter]}` : ""
              }.`}
              onOpenRow={(id) => {
                void router.navigate({
                  to: "/crm/lab-orders/$id",
                  params: { id: String(id) },
                });
              }}
            />
            {formOrders.length === 0 ? (
              <div className="print:hidden">
                <Button asChild size="sm">
                  <Link to="/crm/lab-orders" search={newOrderSearch}>
                    Create FORM-14 accession
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {formOrders.length === 0 && (
              <li className="rounded-sm border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No entries for {activeForm.label}
                {statusFilter !== "all" ? ` · ${statusLabel[statusFilter]}` : ""}.
                <div className="mt-4 print:hidden">
                  <Button asChild size="sm">
                    <Link to="/crm/lab-orders" search={newOrderSearch}>
                      Create lab order
                    </Link>
                  </Button>
                </div>
              </li>
            )}
            {formOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-sm border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 shrink-0 text-primary" aria-hidden />
                    <Link
                      to="/crm/lab-orders/$id"
                      params={{ id: String(order.id) }}
                      className="font-medium hover:underline"
                    >
                      Lab #{order.id}
                      {order.patientNumber ? ` · ${order.patientNumber}` : ""}
                    </Link>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt>{formFieldLabels.dateReceived}</dt>
                      <dd className="font-medium text-foreground">
                        {new Date(order.orderedAt).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt>{formFieldLabels.specimenType}</dt>
                      <dd className="font-medium text-foreground">{order.specimenType || "—"}</dd>
                    </div>
                    <div>
                      <dt>{formFieldLabels.section}</dt>
                      <dd className="font-medium text-foreground">{sectionLabel(order.section)}</dd>
                    </div>
                    <div>
                      <dt>{formFieldLabels.testsRequested}</dt>
                      <dd className="font-medium text-foreground">
                        {order.testLabels?.length ? order.testLabels.join(", ") : "—"}
                      </dd>
                    </div>
                    {formView === "reception" ? (
                      <>
                        <div>
                          <dt>{formFieldLabels.receivedFrom}</dt>
                          <dd className="font-medium text-foreground">
                            {order.receivedFrom || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt>{formFieldLabels.broughtBy}</dt>
                          <dd className="font-medium text-foreground">{order.broughtBy || "—"}</dd>
                        </div>
                        <div>
                          <dt>{formFieldLabels.requestingDoctor}</dt>
                          <dd className="font-medium text-foreground">
                            {order.requestingDoctor || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt>{formFieldLabels.sponsor}</dt>
                          <dd className="font-medium text-foreground">{order.sponsor || "—"}</dd>
                        </div>
                      </>
                    ) : null}
                  </dl>
                </div>
                <div className="flex flex-col items-end gap-2 print:hidden">
                  <Badge variant="secondary">
                    {statusLabel[order.status] ?? order.status.replace("_", " ")}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/crm/lab-orders/$id" params={{ id: String(order.id) }}>
                      Open form
                    </Link>
                  </Button>
                </div>
                <div className="hidden print:block">
                  <Badge variant="secondary">
                    {statusLabel[order.status] ?? order.status.replace("_", " ")}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={onSave} className="space-y-4 print:hidden">
        <div className="border border-border bg-card px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Registry details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the master patient / facility file. Required fields marked with *
          </p>
        </div>

        <FormSection title="Identity">
          <FormGrid cols={3}>
            <FormField label="Type" required>
              <Select
                value={type}
                onValueChange={(value) => setType(value as "individual" | "organisation")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="organisation">Organisation</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Lab MRN" htmlFor="labMrn" required>
              <Input
                id="labMrn"
                name="labMrn"
                defaultValue={client.labMrn ?? `AKL-${String(client.id).padStart(5, "0")}`}
              />
            </FormField>
            <FormField
              label={type === "organisation" ? "Organisation name" : "Full name"}
              htmlFor="name"
              required
            >
              <Input id="name" name="name" required defaultValue={client.name} />
            </FormField>
            {type === "individual" ? (
              <>
                <FormField label="Date of birth" htmlFor="dateOfBirth">
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={client.dateOfBirth ?? ""}
                  />
                </FormField>
                <FormField label="Sex">
                  <Select
                    value={sex}
                    onValueChange={(value) =>
                      setSex(value as "male" | "female" | "other" | "unknown")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </>
            ) : null}
            <FormField
              label={type === "organisation" ? "Registration no." : "National ID"}
              htmlFor="nationalId"
            >
              <Input id="nationalId" name="nationalId" defaultValue={client.nationalId ?? ""} />
            </FormField>
            <FormField label="Record status">
              <Select
                value={active ? "active" : "inactive"}
                onValueChange={(value) => setActive(value === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="Contact">
          <FormGrid cols={3}>
            <FormField label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={client.phone ?? ""} />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} />
            </FormField>
            <FormField label="Address" htmlFor="address" span="full">
              <Input id="address" name="address" defaultValue={client.address ?? ""} />
            </FormField>
          </FormGrid>
        </FormSection>

        {type === "individual" ? (
          <FormSection title="Next of kin">
            <FormGrid cols={2}>
              <FormField label="Next of kin" htmlFor="nextOfKin">
                <Input id="nextOfKin" name="nextOfKin" defaultValue={client.nextOfKin ?? ""} />
              </FormField>
              <FormField label="Next of kin phone" htmlFor="nextOfKinPhone">
                <Input
                  id="nextOfKinPhone"
                  name="nextOfKinPhone"
                  defaultValue={client.nextOfKinPhone ?? ""}
                />
              </FormField>
            </FormGrid>
          </FormSection>
        ) : null}

        <FormSection title="Admin notes">
          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} defaultValue={client.notes ?? ""} />
          </FormField>
        </FormSection>

        <StickyFormActions>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </StickyFormActions>
      </form>

      <div className="grid gap-6 print:hidden lg:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Appointments</h2>
            <Button asChild variant="link" className="h-auto p-0">
              <Link to="/crm/appointments" search={{ clientId: String(client.id) }}>
                Calendar
              </Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {appointments.length === 0 && (
              <li className="text-sm text-muted-foreground">No appointments yet.</li>
            )}
            {appointments.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-sm border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.serviceType}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {item.status.replace("_", " ")}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Lab orders</h2>
            <Button asChild variant="link" className="h-auto p-0">
              <Link to="/crm/lab-orders" search={{ clientId: String(client.id) }}>
                New order
              </Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {orders.length === 0 && (
              <li className="text-sm text-muted-foreground">No lab orders yet.</li>
            )}
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-start justify-between gap-3 rounded-sm border border-border p-3 text-sm"
              >
                <Link
                  to="/crm/lab-orders/$id"
                  params={{ id: String(order.id) }}
                  className="font-medium hover:underline"
                >
                  Order #{order.id}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {sectionLabel(order.section)} · {new Date(order.orderedAt).toLocaleString()}
                  </span>
                </Link>
                <Badge variant="secondary" className="capitalize">
                  {order.status.replace("_", " ")}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Equipment orders</h2>
            <Button asChild variant="link" className="h-auto p-0">
              <Link to="/crm/equipment-orders" search={{ clientId: String(client.id) }}>
                New order
              </Link>
            </Button>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {equipment.length === 0 && (
              <li className="text-sm text-muted-foreground">No equipment orders yet.</li>
            )}
            {equipment.map((order) => (
              <li
                key={order.id}
                className="flex items-start justify-between gap-3 rounded-sm border border-border p-3 text-sm"
              >
                <Link
                  to="/crm/equipment-orders/$id"
                  params={{ id: String(order.id) }}
                  className="font-medium hover:underline"
                >
                  Order #{order.id}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {order.itemCount} items · {new Date(order.orderedAt).toLocaleString()}
                  </span>
                </Link>
                <Badge variant="secondary" className="capitalize">
                  {order.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Invoices</h2>
            <Button asChild variant="link" className="h-auto p-0">
              <Link to="/crm/invoices" search={{ clientId: String(client.id) }}>
                View all
              </Link>
            </Button>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {invoices.length === 0 && (
              <li className="text-sm text-muted-foreground">No invoices yet.</li>
            )}
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex items-start justify-between gap-3 rounded-sm border border-border p-3 text-sm"
              >
                <Link
                  to="/crm/invoices/$id"
                  params={{ id: String(invoice.id) }}
                  className="font-medium hover:underline"
                >
                  {invoice.reference}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    ${invoice.total.toFixed(2)} · {new Date(invoice.createdAt).toLocaleDateString()}
                  </span>
                </Link>
                <Badge variant="secondary" className="capitalize">
                  {invoice.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
