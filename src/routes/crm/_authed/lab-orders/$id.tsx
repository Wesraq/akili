import { createFileRoute, Link, useRouter, getRouteApi } from "@tanstack/react-router";
import { CheckCircle2, Printer, Receipt } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";

import { BodySiteMap } from "@/components/crm/BodySiteMap";
import { Form14EntryForm, type Form14EntryValues } from "@/components/crm/Form14HistoLog";
import { LimsDetailTabs } from "@/components/crm/LimsDetailTabs";
import {
  FormAlert,
  FormField,
  FormGrid,
  FormSection,
  StickyFormActions,
} from "@/components/crm/LimsForm";
import { OrderTimeline } from "@/components/crm/OrderTimeline";
import { PrintDocument } from "@/components/crm/PrintDocument";
import {
  LabStatusBadge,
  LabWorkflowStrip,
  SpecimenStatusBadge,
  type LabOrderStatus,
} from "@/components/crm/lims-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createInvoiceFromLabOrder,
  findInvoiceForSource,
} from "@/crm/fns/invoices.server";
import {
  addSpecimen,
  getLabOrder,
  listClinicalTests,
  listOrderTimeline,
  receiveSpecimen,
  rejectSpecimen,
  saveLabOrderResults,
  updateLabOrderMeta,
  updateLabOrderStatus,
  validateLabOrder,
} from "@/crm/fns/lab-orders.server";
import { getLabSettings } from "@/crm/fns/settings.server";
import { formFieldLabels, labSections } from "@/lib/akili-forms";
import {
  bodySitesSummary,
  parseBodySites,
  type BodySiteMark,
} from "@/lib/body-sites";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const authedRoute = getRouteApi("/crm/_authed");

export const Route = createFileRoute("/crm/_authed/lab-orders/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw new Error("Invalid order");
    const [order, invoice, lab, timeline, tests] = await Promise.all([
      getLabOrder({ data: { id } }),
      findInvoiceForSource({ data: { sourceType: "lab_order", sourceId: id } }),
      getLabSettings(),
      listOrderTimeline({ data: { orderId: id, newestFirst: true } }),
      listClinicalTests(),
    ]);
    return { order, invoice, lab, timeline, tests };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.order.accessionNumber || `Lab #${loaderData?.order.id ?? ""}`} - AKILI LIMS`,
      },
    ],
  }),
  component: LabOrderDetailPage,
});

function LabOrderDetailPage() {
  const { order, invoice, lab, timeline, tests } = Route.useLoaderData();
  const { user } = authedRoute.useRouteContext();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [metaPending, setMetaPending] = useState(false);
  const [validating, setValidating] = useState(false);
  const [invoicing, setInvoicing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [newSpecimenType, setNewSpecimenType] = useState("");
  const [addingSpecimen, setAddingSpecimen] = useState(false);
  const [section, setSection] = useState(order.section || "haem_chem");
  const [addTestIds, setAddTestIds] = useState<number[]>([]);
  const [specimenSites, setSpecimenSites] = useState<BodySiteMark[]>(() =>
    parseBodySites(order.specimenSites),
  );
  const [metaSex, setMetaSex] = useState(order.sex || "");
  const [form14, setForm14] = useState<Form14EntryValues>(() => ({
    dateCollected: order.dateCollected ?? "",
    dateReceived: new Date(order.orderedAt).toLocaleDateString(),
    mrNumber: order.patientNumber ?? "",
    patientName: order.clientName,
    age: order.age ?? "",
    sex: order.sex ?? "",
    ward: order.ward ?? "",
    specimenType: order.specimenType ?? "",
    requestingDoctor: order.requestingDoctor ?? "",
    deliveredBy: order.broughtBy ?? "",
    receivedBy: order.receivedByName ?? "",
    labNumber: order.accessionNumber || `LAB-${order.id}`,
    contactNumber: order.contactNumber || order.clientPhone || "",
  }));

  useEffect(() => {
    setSection(order.section || "haem_chem");
    setSpecimenSites(parseBodySites(order.specimenSites));
    setMetaSex(order.sex || "");
    setForm14({
      dateCollected: order.dateCollected ?? "",
      dateReceived: new Date(order.orderedAt).toLocaleDateString(),
      mrNumber: order.patientNumber ?? "",
      patientName: order.clientName,
      age: order.age ?? "",
      sex: order.sex ?? "",
      ward: order.ward ?? "",
      specimenType: order.specimenType ?? "",
      requestingDoctor: order.requestingDoctor ?? "",
      deliveredBy: order.broughtBy ?? "",
      receivedBy: order.receivedByName ?? "",
      labNumber: order.accessionNumber || `LAB-${order.id}`,
      contactNumber: order.contactNumber || order.clientPhone || "",
    });
  }, [order]);

  const isHisto = section === "histopathology";

  const locked =
    order.status === "validated" ||
    order.status === "cancelled" ||
    order.status === "rejected";
  const canEditMeta = order.status !== "validated" && order.status !== "cancelled";
  const canAddTests =
    order.status === "ordered" ||
    order.status === "received" ||
    order.status === "in_progress" ||
    order.status === "amended" ||
    order.status === "reported";
  const canValidate =
    (order.status === "reported" || order.status === "amended") &&
    (!order.resultsEnteredBy || order.resultsEnteredBy !== user.id);
  const isMicro = order.section === "microbiology";
  const sectionLabelText =
    labSections.find((item) => item.id === order.section)?.label || order.section || "Lab";
  const accession = order.accessionNumber || `LAB-${order.id}`;
  const existingTestIds = new Set(order.items.map((item) => item.testId));
  const availableTests = tests.filter((test) => !existingTestIds.has(test.id));

  async function onSave(event: FormEvent<HTMLFormElement>, markReported: boolean) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await saveLabOrderResults({
        data: {
          orderId: order.id,
          markReported,
          reportingTime: String(form.get("reportingTime") ?? "") || null,
          sponsor: String(form.get("sponsor") ?? "") || null,
          items: order.items.map((item) => ({
            id: item.id,
            resultValue: String(form.get(`value-${item.id}`) ?? "") || null,
            resultUnit: String(form.get(`unit-${item.id}`) ?? "") || null,
            resultFlag: String(form.get(`flag-${item.id}`) ?? "") || null,
            notes: String(form.get(`notes-${item.id}`) ?? "") || null,
            urinalysis: String(form.get(`urinalysis-${item.id}`) ?? "") || null,
            microscopy: String(form.get(`microscopy-${item.id}`) ?? "") || null,
            culture: String(form.get(`culture-${item.id}`) ?? "") || null,
            sensitivity: String(form.get(`sensitivity-${item.id}`) ?? "") || null,
          })),
        },
      });
      toast.success(markReported ? "Submitted for validation" : "Results saved");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function onStatus(
    status: "ordered" | "received" | "in_progress" | "reported" | "rejected" | "amended" | "cancelled",
  ) {
    try {
      await updateLabOrderStatus({ data: { id: order.id, status } });
      toast.success("Status updated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onValidate() {
    setValidating(true);
    try {
      await validateLabOrder({ data: { id: order.id } });
      toast.success("Report released");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  }

  async function onInvoice() {
    setInvoicing(true);
    try {
      const created = await createInvoiceFromLabOrder({ data: { labOrderId: order.id } });
      toast.success("Invoice ready");
      await router.navigate({ to: "/crm/invoices/$id", params: { id: String(created.id) } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create invoice");
    } finally {
      setInvoicing(false);
    }
  }

  async function onReceive(specimenId: number) {
    try {
      await receiveSpecimen({ data: { specimenId, condition: "OK" } });
      toast.success("Specimen received");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Receive failed");
    }
  }

  async function onReject(specimenId: number) {
    if (!rejectReason.trim()) {
      toast.error("Enter a rejection reason");
      return;
    }
    try {
      await rejectSpecimen({
        data: { specimenId, reason: rejectReason.trim(), rejectOrder: true },
      });
      toast.success("Specimen rejected");
      setRejectingId(null);
      setRejectReason("");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reject failed");
    }
  }

  async function onAddSpecimen(event: FormEvent) {
    event.preventDefault();
    if (!newSpecimenType.trim()) {
      toast.error("Enter specimen type");
      return;
    }
    setAddingSpecimen(true);
    try {
      await addSpecimen({
        data: { orderId: order.id, specimenType: newSpecimenType.trim() },
      });
      toast.success("Specimen added");
      setNewSpecimenType("");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add specimen");
    } finally {
      setAddingSpecimen(false);
    }
  }

  async function onSaveMeta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMetaPending(true);
    try {
      await updateLabOrderMeta({
        data: {
          id: order.id,
          notes: String(form.get("notes") ?? "") || null,
          patientNumber: isHisto
            ? form14.mrNumber || null
            : String(form.get("patientNumber") ?? "") || null,
          age: isHisto ? form14.age || null : String(form.get("age") ?? "") || null,
          sex: isHisto ? form14.sex || null : String(form.get("sex") ?? "") || null,
          ward: isHisto ? form14.ward || null : String(form.get("ward") ?? "") || null,
          specimenType: isHisto
            ? form14.specimenType || null
            : String(form.get("specimenType") ?? "") || null,
          specimenSites: isHisto ? specimenSites : parseBodySites(order.specimenSites),
          requestingDoctor: isHisto
            ? form14.requestingDoctor || null
            : String(form.get("requestingDoctor") ?? "") || null,
          receivedFrom: String(form.get("receivedFrom") ?? "") || null,
          broughtBy: isHisto
            ? form14.deliveredBy || null
            : String(form.get("broughtBy") ?? "") || null,
          receivedByName: isHisto
            ? form14.receivedBy || null
            : String(form.get("receivedByName") ?? "") || null,
          sponsor: String(form.get("sponsor") ?? "") || null,
          dateCollected: isHisto
            ? form14.dateCollected || null
            : String(form.get("dateCollected") ?? "") || null,
          contactNumber: isHisto
            ? form14.contactNumber || null
            : String(form.get("contactNumber") ?? "") || null,
          section: section || null,
          ...(addTestIds.length ? { addTestIds } : {}),
        },
      });
      toast.success(
        addTestIds.length
          ? `Accession updated · ${addTestIds.length} test(s) added`
          : "Accession details saved",
      );
      setAddTestIds([]);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setMetaPending(false);
    }
  }

  const overviewTab = (
    <div className="space-y-6">
      <LabWorkflowStrip active={order.status as LabOrderStatus} />

      <form onSubmit={(event) => void onSaveMeta(event)} className="space-y-4">
        {isHisto ? (
          <>
            <FormSection title="Bench" description="Section can be changed before release.">
              <FormGrid cols={3}>
                <FormField label={formFieldLabels.section} htmlFor="section">
                  <Select
                    value={section}
                    onValueChange={setSection}
                    disabled={!canEditMeta}
                  >
                    <SelectTrigger id="section">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {labSections.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label} · {item.form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Notes" htmlFor="notes" span={2}>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    defaultValue={order.notes ?? ""}
                    disabled={!canEditMeta}
                  />
                </FormField>
              </FormGrid>
            </FormSection>
            <Form14EntryForm
              values={form14}
              onChange={(field, value) => {
                setForm14((prev) => ({ ...prev, [field]: value }));
                if (field === "sex") setMetaSex(value);
              }}
              specimenSites={specimenSites}
              {...(canEditMeta ? { onSitesChange: setSpecimenSites } : {})}
              readOnly={!canEditMeta}
            />
          </>
        ) : (
          <FormSection
            title="Sample reception"
            description={
              canEditMeta
                ? "FORM-11 — edit before release. Accession ID is fixed."
                : "Released or cancelled accessions are locked."
            }
          >
            <FormGrid cols={3}>
              <FormField label="Accession" hint="Assigned at create">
                <Input value={accession} disabled readOnly />
              </FormField>
              <FormField label="Lab MRN" hint="From patient registry">
                <Input value={order.labMrn || "—"} disabled readOnly />
              </FormField>
              <FormField label={formFieldLabels.patientNumber} htmlFor="patientNumber">
                <Input
                  id="patientNumber"
                  name="patientNumber"
                  defaultValue={order.patientNumber ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.age} htmlFor="age">
                <Input
                  id="age"
                  name="age"
                  defaultValue={order.age ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.sex} htmlFor="sex">
                <Input
                  id="sex"
                  name="sex"
                  value={metaSex}
                  onChange={(event) => setMetaSex(event.target.value)}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.ward} htmlFor="ward">
                <Input
                  id="ward"
                  name="ward"
                  defaultValue={order.ward ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.contactNumber} htmlFor="contactNumber">
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  defaultValue={order.contactNumber || order.clientPhone || ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.specimenType} htmlFor="specimenType">
                <Input
                  id="specimenType"
                  name="specimenType"
                  defaultValue={order.specimenType ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.dateCollected} htmlFor="dateCollected">
                <Input
                  id="dateCollected"
                  name="dateCollected"
                  type="date"
                  defaultValue={order.dateCollected ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.requestingDoctor} htmlFor="requestingDoctor">
                <Input
                  id="requestingDoctor"
                  name="requestingDoctor"
                  defaultValue={order.requestingDoctor ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.receivedFrom} htmlFor="receivedFrom">
                <Input
                  id="receivedFrom"
                  name="receivedFrom"
                  defaultValue={order.receivedFrom ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.broughtBy} htmlFor="broughtBy">
                <Input
                  id="broughtBy"
                  name="broughtBy"
                  defaultValue={order.broughtBy ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.receivedBy} htmlFor="receivedByName">
                <Input
                  id="receivedByName"
                  name="receivedByName"
                  defaultValue={order.receivedByName ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.sponsor} htmlFor="sponsor">
                <Input
                  id="sponsor"
                  name="sponsor"
                  defaultValue={order.sponsor ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
              <FormField label={formFieldLabels.section} htmlFor="section">
                <Select
                  value={section}
                  onValueChange={setSection}
                  disabled={!canEditMeta}
                >
                  <SelectTrigger id="section">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {labSections.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Notes" htmlFor="notes" span="full">
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  defaultValue={order.notes ?? ""}
                  disabled={!canEditMeta}
                />
              </FormField>
            </FormGrid>
          </FormSection>
        )}

        {canAddTests ? (
          <FormSection
            title="Add tests"
            description="Attach additional assays to this accession (creates empty result rows)."
          >
            {availableTests.length === 0 ? (
              <p className="text-sm text-muted-foreground">All catalogue tests are already on this order.</p>
            ) : (
              <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {availableTests.map((test) => {
                  const checked = addTestIds.includes(test.id);
                  return (
                    <label
                      key={test.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-sm border p-3 hover:bg-muted/40",
                        checked ? "border-primary bg-primary-soft/50" : "border-border",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          setAddTestIds((prev) =>
                            prev.includes(test.id)
                              ? prev.filter((id) => id !== test.id)
                              : [...prev, test.id],
                          )
                        }
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {test.code} · {test.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {test.category}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </FormSection>
        ) : null}

        {canEditMeta ? (
          <StickyFormActions
            summary={
              addTestIds.length
                ? `${addTestIds.length} test(s) to add`
                : `${order.items.length} test(s) on accession`
            }
          >
            <Button type="submit" disabled={metaPending}>
              {metaPending ? "Saving…" : "Save accession details"}
            </Button>
          </StickyFormActions>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2">
        {order.status === "ordered" ? (
          <>
            <Button size="sm" onClick={() => void onStatus("received")}>
              Mark accession received
            </Button>
            <Button size="sm" variant="outline" onClick={() => void onStatus("in_progress")}>
              Start bench work
            </Button>
          </>
        ) : null}
        {order.status === "received" ? (
          <Button size="sm" onClick={() => void onStatus("in_progress")}>
            Start bench work
          </Button>
        ) : null}
        {order.status === "validated" ? (
          <Button size="sm" variant="outline" onClick={() => void onStatus("amended")}>
            Amend released report
          </Button>
        ) : null}
        {order.status !== "cancelled" && order.status !== "validated" ? (
          <Button variant="outline" size="sm" onClick={() => void onStatus("cancelled")}>
            Cancel accession
          </Button>
        ) : null}
      </div>
    </div>
  );

  const specimensTab = (
    <div className="space-y-6">
      <ul className="divide-y divide-border border border-border bg-card">
        {(order.specimens ?? []).length === 0 ? (
          <li className="px-5 py-8 text-sm text-muted-foreground">No specimens recorded.</li>
        ) : (
          (order.specimens ?? []).map((specimen) => (
            <li key={specimen.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-medium">{specimen.specimenType || "Unspecified"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {specimen.barcode ? `${specimen.barcode} · ` : ""}
                  Collected {specimen.collectedAt || "—"}
                  {specimen.receivedAt
                    ? ` · Received ${new Date(specimen.receivedAt).toLocaleString()}`
                    : ""}
                </p>
                {specimen.rejectedReason ? (
                  <p className="mt-1 text-xs text-destructive">Reject: {specimen.rejectedReason}</p>
                ) : null}
                {specimen.condition ? (
                  <p className="mt-1 text-xs text-muted-foreground">Condition: {specimen.condition}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SpecimenStatusBadge status={specimen.status} />
                {specimen.status === "pending" && !locked ? (
                  <>
                    <Button size="sm" onClick={() => void onReceive(specimen.id)}>
                      Receive
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRejectingId(rejectingId === specimen.id ? null : specimen.id)
                      }
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
              {rejectingId === specimen.id ? (
                <div className="flex w-full flex-wrap items-end gap-2 border-t border-border pt-3">
                  <div className="grid min-w-[220px] flex-1 gap-2">
                    <Label htmlFor={`reject-${specimen.id}`}>Rejection reason</Label>
                    <Input
                      id={`reject-${specimen.id}`}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Hemolyzed, insufficient, unlabeled…"
                    />
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => void onReject(specimen.id)}>
                    Confirm reject
                  </Button>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>

      {!locked || order.status === "rejected" ? (
        <form
          onSubmit={(e) => void onAddSpecimen(e)}
          className="flex flex-wrap items-end gap-2 border border-border bg-card p-4"
        >
          <div className="grid min-w-[200px] flex-1 gap-2">
            <Label htmlFor="newSpecimenType">Add specimen / redraw</Label>
            <Input
              id="newSpecimenType"
              value={newSpecimenType}
              onChange={(e) => setNewSpecimenType(e.target.value)}
              placeholder="e.g. EDTA blood, urine"
            />
          </div>
          <Button type="submit" disabled={addingSpecimen}>
            {addingSpecimen ? "Adding…" : "Add specimen"}
          </Button>
        </form>
      ) : null}
    </div>
  );

  const resultsTab = (
    <div className="space-y-4">
      {order.status === "reported" && !canValidate ? (
        <FormAlert tone="warn">
          Results were entered by you. Another staff member must authorise before release.
        </FormAlert>
      ) : null}

      <form onSubmit={(event) => void onSave(event, false)} className="space-y-4">
        <FormSection
          title="Reporting worksheet"
          description={
            isMicro
              ? "FORM-12 MICRO — result, urinalysis, microscopy / culture / sensitivity"
              : order.section === "serology"
                ? "FORM-21 Serology reporting"
                : "FORM-12 Haematology & chemistry — enter result, unit and flag per analyte"
          }
        >
          {locked ? (
            <p className="text-sm text-muted-foreground">
              {order.status === "validated"
                ? "Released results are locked — use Amend to re-open."
                : "This accession is closed."}
            </p>
          ) : null}

          <FormGrid cols={2}>
            <FormField label={formFieldLabels.reportingTime} htmlFor="reportingTime">
              <Input
                id="reportingTime"
                name="reportingTime"
                type="datetime-local"
                defaultValue={order.reportingTime ? order.reportingTime.slice(0, 16) : ""}
                disabled={locked}
              />
            </FormField>
            <FormField label={formFieldLabels.sponsor} htmlFor="sponsor">
              <Input
                id="sponsor"
                name="sponsor"
                defaultValue={order.sponsor ?? ""}
                disabled={locked}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <div className="overflow-hidden border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 z-[1] border-b border-border bg-muted/50">
                <tr>
                  <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Test
                  </th>
                  <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Result
                  </th>
                  <th className="h-9 w-24 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Unit
                  </th>
                  <th className="h-9 w-28 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Flag
                  </th>
                  <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/80 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium">
                        {item.testCode} · {item.testName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.testCategory}
                        {item.testReferenceRange ? ` · Ref ${item.testReferenceRange}` : ""}
                      </p>
                      {isMicro ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {formFieldLabels.urinalysis}
                            </span>
                            <Textarea
                              name={`urinalysis-${item.id}`}
                              defaultValue={item.urinalysis ?? ""}
                              disabled={locked}
                              rows={2}
                              className="min-h-0 text-xs"
                            />
                          </div>
                          <div className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {formFieldLabels.microscopy}
                            </span>
                            <Textarea
                              name={`microscopy-${item.id}`}
                              defaultValue={item.microscopy ?? ""}
                              disabled={locked}
                              rows={2}
                              className="min-h-0 text-xs"
                            />
                          </div>
                          <div className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {formFieldLabels.culture}
                            </span>
                            <Textarea
                              name={`culture-${item.id}`}
                              defaultValue={item.culture ?? ""}
                              disabled={locked}
                              rows={2}
                              className="min-h-0 text-xs"
                            />
                          </div>
                          <div className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {formFieldLabels.sensitivity}
                            </span>
                            <Textarea
                              name={`sensitivity-${item.id}`}
                              defaultValue={item.sensitivity ?? ""}
                              disabled={locked}
                              rows={2}
                              className="min-h-0 text-xs"
                            />
                          </div>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        name={`value-${item.id}`}
                        defaultValue={item.resultValue ?? ""}
                        disabled={locked}
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        name={`unit-${item.id}`}
                        defaultValue={item.resultUnit || item.testResultUnit || ""}
                        disabled={locked}
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        name={`flag-${item.id}`}
                        defaultValue={item.resultFlag ?? ""}
                        disabled={locked}
                        className="flex h-9 w-full rounded-sm border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">—</option>
                        <option value="N">N</option>
                        <option value="H">H</option>
                        <option value="L">L</option>
                        <option value="A">A</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        name={`notes-${item.id}`}
                        defaultValue={item.notes ?? ""}
                        disabled={locked}
                        className="h-9"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!locked ? (
          <StickyFormActions summary={`${order.items.length} analyte${order.items.length === 1 ? "" : "s"}`}>
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Saving…" : "Save results"}
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={(event) => {
                const form = event.currentTarget.form;
                if (!form) return;
                void onSave(
                  {
                    preventDefault() {},
                    currentTarget: form,
                  } as FormEvent<HTMLFormElement>,
                  true,
                );
              }}
            >
              Save & submit for authorisation
            </Button>
          </StickyFormActions>
        ) : null}
      </form>
    </div>
  );

  const timelineTab = <OrderTimeline events={timeline.events} />;

  const billingTab = (
    <div className="space-y-4">
      {invoice ? (
        <div className="border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Linked invoice</p>
          <p className="mt-1 text-lg font-semibold">{invoice.reference}</p>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            Status: {invoice.status}
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/crm/invoices/$id" params={{ id: String(invoice.id) }}>
              Open invoice
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">No invoice yet for this accession.</p>
          {order.status !== "cancelled" && order.status !== "rejected" ? (
            <Button
              className="mt-4"
              size="sm"
              disabled={invoicing}
              onClick={() => void onInvoice()}
            >
              <Receipt className="size-3.5" aria-hidden />
              {invoicing ? "Creating…" : "Create invoice"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="crm-no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="link" className="h-auto px-0">
            <Link to="/crm/lab-orders">← Accessioning</Link>
          </Button>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {accession}
            {order.patientNumber ? (
              <span className="text-muted-foreground"> · {order.patientNumber}</span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              to="/crm/clients/$id"
              params={{ id: String(order.clientId) }}
              className="hover:underline"
            >
              {order.clientName}
            </Link>
            {order.labMrn ? ` · ${order.labMrn}` : ""} · {sectionLabelText} ·{" "}
            {new Date(order.orderedAt).toLocaleString()}
            {order.dueAt ? (
              <>
                {" "}
                · Due {new Date(order.dueAt).toLocaleString()}
                {order.overdue ? " (overdue)" : ""}
              </>
            ) : null}
          </p>
          {order.resultsEnteredByName || order.validatedByName ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {order.resultsEnteredByName
                ? `${formFieldLabels.resultsEnteredBy}: ${order.resultsEnteredByName}`
                : null}
              {order.resultsEnteredByName && order.validatedByName ? " · " : null}
              {order.validatedByName
                ? `${formFieldLabels.authorisedBy}: ${order.validatedByName}${
                    order.validatedAt ? ` · ${new Date(order.validatedAt).toLocaleString()}` : ""
                  }`
                : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LabStatusBadge status={order.status} />
          {order.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="size-3.5" aria-hidden />
            Print report
          </Button>
          {invoice ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/crm/invoices/$id" params={{ id: String(invoice.id) }}>
                <Receipt className="size-3.5" aria-hidden />
                {invoice.reference}
              </Link>
            </Button>
          ) : null}
          {(order.status === "reported" || order.status === "amended") && (
            <Button size="sm" disabled={!canValidate || validating} onClick={() => void onValidate()}>
              <CheckCircle2 className="size-3.5" aria-hidden />
              {validating
                ? "Releasing…"
                : canValidate
                  ? "Authorise / release"
                  : "Awaiting another user"}
            </Button>
          )}
        </div>
      </div>

      <div className="crm-no-print">
        <LimsDetailTabs
          defaultTab="overview"
          tabs={[
            { id: "overview", label: "Overview", content: overviewTab },
            {
              id: "specimens",
              label: "Specimens",
              count: order.specimens?.length ?? 0,
              content: specimensTab,
            },
            {
              id: "results",
              label: "Results",
              count: order.items.length,
              content: resultsTab,
            },
            {
              id: "timeline",
              label: "Timeline",
              count: timeline.events.length,
              content: timelineTab,
            },
            { id: "billing", label: "Billing", content: billingTab },
          ]}
        />
      </div>

      <div className="hidden print:block">
        <PrintDocument
          title={`Laboratory report ${accession}`}
          subtitle={
            order.status === "validated"
              ? "Final authorised report"
              : order.status === "reported"
                ? "Pending authorisation"
                : "Interim results"
          }
          org={{
            orgName: lab.orgName,
            tagline: lab.tagline,
            address: lab.address,
            phone: lab.phone,
            email: lab.email,
            footer: lab.reportFooter || undefined,
          }}
          meta={[
            { label: formFieldLabels.patientName, value: order.clientName },
            { label: "Accession", value: accession },
            {
              label: formFieldLabels.patientNumber,
              value: order.patientNumber || order.labMrn || "—",
            },
            {
              label: "Age / sex",
              value: [order.age, order.sex].filter(Boolean).join(" / ") || "—",
            },
            {
              label: formFieldLabels.contactNumber,
              value: order.contactNumber || order.clientPhone || order.clientEmail || "—",
            },
            { label: formFieldLabels.specimenType, value: order.specimenType || "—" },
            {
              label: formFieldLabels.specimenSites,
              value:
                bodySitesSummary(parseBodySites(order.specimenSites)) || "—",
            },
            { label: formFieldLabels.requestingDoctor, value: order.requestingDoctor || "—" },
            { label: formFieldLabels.receivedFrom, value: order.receivedFrom || "—" },
            { label: formFieldLabels.sponsor, value: order.sponsor || "—" },
            { label: formFieldLabels.section, value: sectionLabelText },
            {
              label: formFieldLabels.dateCollected,
              value: order.dateCollected || "—",
            },
            { label: formFieldLabels.dateReceived, value: new Date(order.orderedAt).toLocaleString() },
            {
              label: formFieldLabels.reportingTime,
              value: order.reportingTime
                ? new Date(order.reportingTime).toLocaleString()
                : "—",
            },
            {
              label: "Status",
              value:
                order.status === "reported"
                  ? "Awaiting authorisation"
                  : order.status.replace("_", " "),
            },
            {
              label: formFieldLabels.resultsEnteredBy,
              value: order.resultsEnteredByName || "—",
            },
            {
              label: formFieldLabels.authorisedBy,
              value: order.validatedByName || "—",
            },
          ]}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/20 text-left">
                <th className="py-2 font-medium">Test</th>
                <th className="py-2 font-medium">Result</th>
                {isMicro ? (
                  <>
                    <th className="py-2 font-medium">UA</th>
                    <th className="py-2 font-medium">M</th>
                    <th className="py-2 font-medium">C</th>
                    <th className="py-2 font-medium">S</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 font-medium">Unit</th>
                    <th className="py-2 font-medium">Flag</th>
                    <th className="py-2 font-medium">Ref range</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-black/10 align-top">
                  <td className="py-2.5">
                    <p className="font-medium">
                      {item.testCode} · {item.testName}
                    </p>
                    <p className="text-xs text-black/60">{item.testCategory}</p>
                    {item.notes ? <p className="mt-1 text-xs text-black/60">{item.notes}</p> : null}
                  </td>
                  <td className="py-2.5">{item.resultValue || "—"}</td>
                  {isMicro ? (
                    <>
                      <td className="py-2.5">{item.urinalysis || "—"}</td>
                      <td className="py-2.5">{item.microscopy || "—"}</td>
                      <td className="py-2.5">{item.culture || "—"}</td>
                      <td className="py-2.5">{item.sensitivity || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5">{item.resultUnit || item.testResultUnit || "—"}</td>
                      <td className="py-2.5">{item.resultFlag || "—"}</td>
                      <td className="py-2.5">{item.testReferenceRange || "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {isHisto && parseBodySites(order.specimenSites).length > 0 ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">{formFieldLabels.specimenSites}</p>
              <BodySiteMap
                value={parseBodySites(order.specimenSites)}
                sex={order.sex}
                readOnly
                paper
                compact
              />
            </div>
          ) : null}
          {order.notes ? (
            <p className="mt-6 text-sm text-black/70">
              <span className="font-medium text-black">Order notes: </span>
              {order.notes}
            </p>
          ) : null}
        </PrintDocument>
      </div>
    </div>
  );
}
