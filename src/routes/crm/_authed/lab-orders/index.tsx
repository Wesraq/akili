import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  LimsDataGrid,
  LimsGridBody,
  LimsGridHead,
  LimsGridRow,
  LimsGridTable,
  LimsGridTd,
  LimsGridTh,
} from "@/components/crm/LimsDataGrid";
import { Form14EntryForm, type Form14EntryValues } from "@/components/crm/Form14HistoLog";
import {
  FormAlert,
  FormField,
  FormGrid,
  FormSection,
  StickyFormActions,
} from "@/components/crm/LimsForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  LabStatusBadge,
  LabWorkflowStrip,
  LimsPageHeader,
  labOrderStatuses,
  labStatusLabel,
  type LabOrderStatus,
} from "@/components/crm/lims-ui";
import { searchClientsLite } from "@/crm/fns/clients.server";
import { createLabOrder, listClinicalTests, listLabOrders } from "@/crm/fns/lab-orders.server";
import { formFieldLabels, labSections, sectionLabel } from "@/lib/akili-forms";
import type { BodySiteMark } from "@/lib/body-sites";
import { cn } from "@/lib/utils";

const statuses = labOrderStatuses;
const stageFilterStatuses: LabOrderStatus[] = [
  "ordered",
  "received",
  "in_progress",
  "reported",
  "validated",
  "rejected",
];

export const Route = createFileRoute("/crm/_authed/lab-orders/")({
  validateSearch: (search: Record<string, unknown>): {
    clientId?: string;
    status?: string;
    q?: string;
    section?: string;
  } => {
    const clientId = typeof search["clientId"] === "string" ? search["clientId"] : undefined;
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    const q = typeof search["q"] === "string" ? search["q"] : undefined;
    const section = typeof search["section"] === "string" ? search["section"] : undefined;
    return {
      ...(clientId ? { clientId } : {}),
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
      ...(section ? { section } : {}),
    };
  },
  loaderDeps: ({ search }) => ({
    clientId: search.clientId ?? "",
    status: search.status ?? "",
    q: search.q ?? "",
    section: search.section ?? "",
  }),
  loader: async ({ deps }) => {
    const clientId = deps.clientId ? Number(deps.clientId) : undefined;
    const status =
      deps.status && statuses.includes(deps.status as (typeof statuses)[number])
        ? (deps.status as (typeof statuses)[number])
        : undefined;
    const [orders, tests, clientOptions] = await Promise.all([
      listLabOrders({
        data: {
          ...(clientId ? { clientId } : {}),
          ...(status ? { status } : {}),
          ...(deps.q ? { q: deps.q } : {}),
          ...(deps.section ? { section: deps.section } : {}),
          sort: "due",
        },
      }),
      listClinicalTests(),
      searchClientsLite({ data: {} }),
    ]);
    return {
      orders,
      tests,
      clientOptions,
      prefClientId: deps.clientId,
      prefSection: deps.section,
    };
  },
  head: () => ({ meta: [{ title: "Accessioning - AKILI LIMS" }] }),
  component: LabOrdersPage,
});

function LabOrdersPage() {
  const { orders, tests, clientOptions, prefClientId, prefSection } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const [clientId, setClientId] = useState(prefClientId || "");
  const [selected, setSelected] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(Boolean(prefClientId || prefSection));
  const [testQuery, setTestQuery] = useState("");
  const [testCategory, setTestCategory] = useState("all");
  const [section, setSection] = useState<string>(prefSection || "haem_chem");
  const [sex, setSex] = useState("");
  const [specimenSites, setSpecimenSites] = useState<BodySiteMark[]>([]);
  const [form14, setForm14] = useState<Form14EntryValues>({
    dateCollected: "",
    dateReceived: new Date().toLocaleDateString(),
    mrNumber: "",
    patientName: "",
    age: "",
    sex: "",
    ward: "",
    specimenType: "",
    requestingDoctor: "",
    deliveredBy: "",
    receivedBy: "",
    labNumber: "(assigned on create)",
    contactNumber: "",
  });
  const [formErrors, setFormErrors] = useState<{ client?: string; tests?: string }>({});
  const isHisto = section === "histopathology";

  useEffect(() => {
    const client = clientOptions.find((c) => String(c.id) === clientId);
    setForm14((prev) => ({
      ...prev,
      patientName: client?.name ?? "",
      mrNumber: prev.mrNumber || client?.labMrn || "",
    }));
  }, [clientId, clientOptions]);

  useEffect(() => {
    if (prefClientId) {
      setClientId(prefClientId);
      setComposeOpen(true);
    }
    if (prefSection) {
      setSection(prefSection);
      setComposeOpen(true);
    }
  }, [prefClientId, prefSection]);

  const counts = useMemo(() => {
    const base: Partial<Record<LabOrderStatus, number>> = {
      ordered: 0,
      received: 0,
      in_progress: 0,
      reported: 0,
      validated: 0,
      rejected: 0,
      amended: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      const key = order.status as LabOrderStatus;
      base[key] = (base[key] ?? 0) + 1;
    }
    return base;
  }, [orders]);

  const testCategories = useMemo(() => {
    const names = new Set(tests.map((test) => test.category));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [tests]);

  const filteredTests = useMemo(() => {
    const q = testQuery.trim().toLowerCase();
    return tests.filter((test) => {
      if (testCategory !== "all" && test.category !== testCategory) return false;
      if (!q) return true;
      return (
        test.code.toLowerCase().includes(q) ||
        test.name.toLowerCase().includes(q) ||
        test.category.toLowerCase().includes(q) ||
        test.sampleType.toLowerCase().includes(q)
      );
    });
  }, [tests, testQuery, testCategory]);

  const selectedTests = useMemo(
    () => tests.filter((test) => selected.includes(test.id)),
    [tests, selected],
  );

  function navigateOrders(next: { status?: string; q?: string; clearStatus?: boolean }) {
    void router.navigate({
      to: "/crm/lab-orders",
      search: {
        ...(search.clientId ? { clientId: search.clientId } : {}),
        ...(next.clearStatus
          ? {}
          : next.status
            ? { status: next.status }
            : search.status
              ? { status: search.status }
              : {}),
        ...(next.q !== undefined
          ? next.q
            ? { q: next.q }
            : {}
          : search.q
            ? { q: search.q }
            : {}),
      },
    });
  }

  function toggleTest(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: { client?: string; tests?: string } = {};
    if (!clientId) errors.client = "Select a patient or facility";
    if (selected.length === 0) errors.tests = "Select at least one test";
    setFormErrors(errors);
    if (errors.client || errors.tests) {
      toast.error("Complete the required fields");
      return;
    }
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const order = await createLabOrder({
        data: {
          clientId: Number(clientId),
          testIds: selected,
          notes: String(form.get("notes") ?? "") || null,
          patientNumber: isHisto
            ? form14.mrNumber || null
            : String(form.get("patientNumber") ?? "") || null,
          age: isHisto ? form14.age || null : String(form.get("age") ?? "") || null,
          sex: isHisto ? form14.sex || null : sex || null,
          ward: isHisto ? form14.ward || null : String(form.get("ward") ?? "") || null,
          specimenType: isHisto
            ? form14.specimenType || null
            : String(form.get("specimenType") ?? "") || null,
          specimenSites: isHisto ? specimenSites : [],
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
        },
      });
      toast.success(`Accession ${order.accessionNumber || `LAB-${order.id}`} created`);
      await router.navigate({ to: "/crm/lab-orders/$id", params: { id: String(order.id) } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create order");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <LimsPageHeader
        eyebrow="Specimen workflow"
        title="Accessioning"
        description="Register samples, assign tests, and move work through bench → validation → release."
        actions={
          <Button type="button" onClick={() => setComposeOpen((value) => !value)}>
            {composeOpen ? "Hide accession form" : "New accession"}
          </Button>
        }
      />

      <LabWorkflowStrip
        active={
          search.status && statuses.includes(search.status as LabOrderStatus)
            ? (search.status as LabOrderStatus)
            : "all"
        }
        counts={counts}
      />

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          navigateOrders({ q: String(form.get("q") ?? "").trim() });
        }}
      >
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={search.q ?? ""}
            key={search.q ?? ""}
            placeholder="Search accession, MRN, patient, phone or test…"
            className="pl-9"
            aria-label="Search accessions"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search.q ? (
          <Button type="button" variant="ghost" onClick={() => navigateOrders({ q: "" })}>
            Clear
          </Button>
        ) : null}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stageFilterStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              search.status === status
                ? navigateOrders({ clearStatus: true })
                : navigateOrders({ status })
            }
            className={cn(
              "border p-4 text-left transition-colors",
              search.status === status ? "border-primary bg-primary-soft" : "border-border bg-card",
            )}
          >
            <p className="text-xs text-muted-foreground">{labStatusLabel[status]}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{counts[status] ?? 0}</p>
          </button>
        ))}
      </div>

      {composeOpen && (
        <form onSubmit={onCreate} className="space-y-4">
          <div className="border border-border bg-card px-5 py-4">
            <h2 className="font-display text-lg font-semibold">New accession</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isHisto
                ? "FORM-14 histopathology · mark extraction sites on the body map · required fields marked with *"
                : "FORM-11 sample reception · required fields marked with *"}
            </p>
          </div>

          {(formErrors.client || formErrors.tests) && (
            <FormAlert>
              {[formErrors.client, formErrors.tests].filter(Boolean).join(" · ")}
            </FormAlert>
          )}

          <FormSection
            title={isHisto ? "Registry & bench" : "Patient"}
            description={
              isHisto
                ? "Pick the patient, then complete FORM-14 below."
                : "Who the specimen belongs to — pick from the registry."
            }
          >
            <FormGrid cols={3}>
              <FormField
                label={`Client / ${formFieldLabels.patientName}`}
                required
                error={formErrors.client}
                span={isHisto ? undefined : "full"}
              >
                <Select
                  value={clientId}
                  onValueChange={(value) => {
                    setClientId(value);
                    setFormErrors((prev) => ({ ...prev, client: undefined }));
                  }}
                >
                  <SelectTrigger
                    className={cn(formErrors.client && "border-destructive")}
                    aria-invalid={Boolean(formErrors.client)}
                  >
                    <SelectValue placeholder="Select patient or facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.name}
                        {client.labMrn ? ` · ${client.labMrn}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={formFieldLabels.section} htmlFor="section" required>
                <Select value={section} onValueChange={setSection}>
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
              {!isHisto ? (
                <>
                  <FormField
                    label={formFieldLabels.patientNumber}
                    htmlFor="patientNumber"
                    hint="External MR / chart number if different from Lab MRN"
                  >
                    <Input id="patientNumber" name="patientNumber" placeholder="MR / patient ID" />
                  </FormField>
                  <FormField label={formFieldLabels.age} htmlFor="age">
                    <Input id="age" name="age" inputMode="numeric" placeholder="Years" />
                  </FormField>
                  <FormField label={formFieldLabels.sex} htmlFor="sex">
                    <Select value={sex} onValueChange={setSex}>
                      <SelectTrigger id="sex">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Female", "Male", "Other"].map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={formFieldLabels.contactNumber} htmlFor="contactNumber">
                    <Input id="contactNumber" name="contactNumber" type="tel" />
                  </FormField>
                  <FormField label={formFieldLabels.ward} htmlFor="ward">
                    <Input id="ward" name="ward" placeholder="Ward / clinic unit" />
                  </FormField>
                </>
              ) : null}
            </FormGrid>
          </FormSection>

          {isHisto ? (
            <Form14EntryForm
              values={form14}
              onChange={(field, value) =>
                setForm14((prev) => ({ ...prev, [field]: value }))
              }
              specimenSites={specimenSites}
              onSitesChange={setSpecimenSites}
            />
          ) : (
            <>
              <FormSection
                title="Clinical context"
                description="Requesting clinician and billing / sponsor details."
              >
                <FormGrid cols={3}>
                  <FormField label={formFieldLabels.requestingDoctor} htmlFor="requestingDoctor">
                    <Input id="requestingDoctor" name="requestingDoctor" />
                  </FormField>
                  <FormField label={formFieldLabels.receivedFrom} htmlFor="receivedFrom">
                    <Input id="receivedFrom" name="receivedFrom" placeholder="Clinic / hospital" />
                  </FormField>
                  <FormField label={formFieldLabels.sponsor} htmlFor="sponsor">
                    <Input id="sponsor" name="sponsor" placeholder="Self / insurer / scheme" />
                  </FormField>
                  <FormField label={formFieldLabels.broughtBy} htmlFor="broughtBy">
                    <Input id="broughtBy" name="broughtBy" />
                  </FormField>
                  <FormField
                    label={formFieldLabels.receivedBy}
                    htmlFor="receivedByName"
                    hint="Defaults to signed-in staff"
                  >
                    <Input id="receivedByName" name="receivedByName" placeholder="Defaults to you" />
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection
                title="Specimen"
                description="Collection details — type auto-fills from selected tests if blank."
              >
                <FormGrid cols={2}>
                  <FormField label={formFieldLabels.specimenType} htmlFor="specimenType">
                    <Input
                      id="specimenType"
                      name="specimenType"
                      placeholder="e.g. EDTA blood, urine, swab"
                    />
                  </FormField>
                  <FormField label={formFieldLabels.dateCollected} htmlFor="dateCollected">
                    <Input id="dateCollected" name="dateCollected" type="date" />
                  </FormField>
                </FormGrid>
              </FormSection>
            </>
          )}

          <FormSection
            title="Tests requested"
            description="Search the catalogue, then tick every assay on this accession."
          >
            <FormField
              label={formFieldLabels.testsRequested}
              required
              error={formErrors.tests}
              hint={`${selected.length} selected${
                testQuery || testCategory !== "all"
                  ? ` · showing ${filteredTests.length} of ${tests.length}`
                  : ""
              }`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-[200px] flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={testQuery}
                      onChange={(event) => setTestQuery(event.target.value)}
                      placeholder="Search tests by code, name or category…"
                      className="pl-9"
                      aria-label="Filter tests"
                    />
                  </div>
                  <Select value={testCategory} onValueChange={setTestCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {testCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(testQuery || testCategory !== "all") && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setTestQuery("");
                        setTestCategory("all");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {selectedTests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTests.map((test) => (
                      <button
                        key={`selected-${test.id}`}
                        type="button"
                        onClick={() => toggleTest(test.id)}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-medium"
                        title="Remove from order"
                      >
                        {test.code}
                        <span className="text-muted-foreground" aria-hidden>
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div
                  className={cn(
                    "max-h-72 overflow-y-auto rounded-sm border p-2",
                    formErrors.tests ? "border-destructive" : "border-border",
                  )}
                >
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTests.map((test) => {
                      const checked = selected.includes(test.id);
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
                            onCheckedChange={() => {
                              toggleTest(test.id);
                              setFormErrors((prev) => ({ ...prev, tests: undefined }));
                            }}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block text-sm font-medium">
                              {test.code} · {test.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {test.category} · {test.sampleType}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {filteredTests.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                      No tests match this filter.
                    </p>
                  ) : null}
                </div>
              </div>
            </FormField>
          </FormSection>

          <FormSection title="Notes">
            <FormField label="Accession notes" htmlFor="notes" hint="Visible on the order timeline and printout">
              <Textarea id="notes" name="notes" rows={2} />
            </FormField>
          </FormSection>

          <StickyFormActions
            summary={
              <>
                {clientId
                  ? clientOptions.find((c) => String(c.id) === clientId)?.name ?? "Client selected"
                  : "No client"}
                {" · "}
                {selected.length} test{selected.length === 1 ? "" : "s"}
                {" · "}
                {labSections.find((s) => s.id === section)?.label ?? section}
                {isHisto && specimenSites.length > 0
                  ? ` · ${specimenSites.length} site${specimenSites.length === 1 ? "" : "s"}`
                  : null}
              </>
            }
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setComposeOpen(false);
                setFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create accession"}
            </Button>
          </StickyFormActions>
        </form>
      )}

      <LimsDataGrid
        isEmpty={orders.length === 0}
        empty={
          search.q
            ? `No accessions match “${search.q}”.`
            : "No accessions in this filter."
        }
        footer={`${orders.length} accession${orders.length === 1 ? "" : "s"}`}
        toolbar={
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Accession queue
          </p>
        }
      >
        <LimsGridTable>
          <LimsGridHead>
            <tr>
              <LimsGridTh>Accession</LimsGridTh>
              <LimsGridTh>Patient</LimsGridTh>
              <LimsGridTh>Section</LimsGridTh>
              <LimsGridTh>Tests</LimsGridTh>
              <LimsGridTh>Due</LimsGridTh>
              <LimsGridTh>Status</LimsGridTh>
              <LimsGridTh className="text-right"> </LimsGridTh>
            </tr>
          </LimsGridHead>
          <LimsGridBody>
            {orders.map((order) => (
              <LimsGridRow key={order.id}>
                <LimsGridTd>
                  <Link
                    to="/crm/lab-orders/$id"
                    params={{ id: String(order.id) }}
                    className="font-medium tabular-nums hover:underline"
                  >
                    {order.accessionNumber || `LAB-${order.id}`}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(order.orderedAt).toLocaleString()}
                  </p>
                </LimsGridTd>
                <LimsGridTd>
                  <p>{order.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.labMrn || order.patientNumber || "—"}
                  </p>
                </LimsGridTd>
                <LimsGridTd className="text-muted-foreground">
                  {sectionLabel(order.section)}
                </LimsGridTd>
                <LimsGridTd className="max-w-[220px] truncate text-xs text-muted-foreground">
                  {order.testLabels.slice(0, 3).join(", ") || "—"}
                  {order.testLabels.length > 3 ? ` +${order.testLabels.length - 3}` : ""}
                </LimsGridTd>
                <LimsGridTd className="text-xs tabular-nums">
                  {order.dueAt ? (
                    <span className={order.overdue ? "text-destructive" : "text-muted-foreground"}>
                      {new Date(order.dueAt).toLocaleString()}
                      {order.overdue ? " · overdue" : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </LimsGridTd>
                <LimsGridTd>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {order.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
                    <LabStatusBadge status={order.status} />
                  </div>
                </LimsGridTd>
                <LimsGridTd className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/crm/lab-orders/$id" params={{ id: String(order.id) }}>
                      Open
                    </Link>
                  </Button>
                </LimsGridTd>
              </LimsGridRow>
            ))}
          </LimsGridBody>
        </LimsGridTable>
      </LimsDataGrid>
    </div>
  );
}
