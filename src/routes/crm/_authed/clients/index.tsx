import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { LimsPageHeader } from "@/components/crm/lims-ui";
import {
  FormField,
  FormGrid,
  FormSection,
  StickyFormActions,
} from "@/components/crm/LimsForm";
import {
  LimsDataGrid,
  LimsGridBody,
  LimsGridHead,
  LimsGridRow,
  LimsGridTable,
  LimsGridTd,
  LimsGridTh,
} from "@/components/crm/LimsDataGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { createClient, listClients } from "@/crm/fns/clients.server";

export const Route = createFileRoute("/crm/_authed/clients/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; type?: string; active?: string } => {
    const q = typeof search["q"] === "string" ? search["q"] : undefined;
    const type = typeof search["type"] === "string" ? search["type"] : undefined;
    const active = typeof search["active"] === "string" ? search["active"] : undefined;
    return {
      ...(q ? { q } : {}),
      ...(type ? { type } : {}),
      ...(active ? { active } : {}),
    };
  },
  loaderDeps: ({ search }) => ({
    q: search.q ?? "",
    type: search.type ?? "",
    active: search.active ?? "active",
  }),
  loader: ({ deps }) =>
    listClients({
      data: {
        ...(deps.q ? { q: deps.q } : {}),
        ...(deps.type === "individual" || deps.type === "organisation"
          ? { type: deps.type }
          : {}),
        active:
          deps.active === "all" || deps.active === "inactive" || deps.active === "active"
            ? deps.active
            : "active",
      },
    }),
  head: () => ({ meta: [{ title: "Client records - AKILI LIMS" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const clients = Route.useLoaderData();
  const search = Route.useSearch();
  const q = search.q ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [type, setType] = useState<"individual" | "organisation">("individual");
  const [sex, setSex] = useState<string>("unknown");

  const individuals = clients.filter((c) => c.type === "individual").length;
  const organisations = clients.filter((c) => c.type === "organisation").length;
  const openOrders = clients.reduce((sum, c) => sum + (c.openOrderCount ?? 0), 0);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const created = await createClient({
        data: {
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
          notes: String(form.get("notes") ?? "") || null,
        },
      });
      toast.success(`Client record ${created.labMrn ?? created.id} created`);
      setOpen(false);
      await router.navigate({ to: "/crm/clients/$id", params: { id: String(created.id) } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create client");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <LimsPageHeader
        eyebrow="Patient registry"
        title="Client records"
        description="Master patient and facility file — MRN, demographics, and linked lab history."
        actions={
          <Button onClick={() => setOpen((value) => !value)}>
            {open ? "Close form" : "Register client"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <article className="border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Records shown</p>
          <p className="mt-1 text-2xl font-semibold">{clients.length}</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Individuals</p>
          <p className="mt-1 text-2xl font-semibold">{individuals}</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Organisations</p>
          <p className="mt-1 text-2xl font-semibold">{organisations}</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Open lab orders</p>
          <p className="mt-1 text-2xl font-semibold">{openOrders}</p>
        </article>
      </div>

      {open ? (
        <form onSubmit={onCreate} className="space-y-4">
          <div className="border border-border bg-card px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Register client</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Patient or facility master file — required fields marked with *
            </p>
          </div>

          <FormSection title="Identity">
            <FormGrid cols={3}>
              <FormField label="Record type" required>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as "individual" | "organisation")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual / patient</SelectItem>
                    <SelectItem value="organisation">Organisation / facility</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label="Lab MRN"
                htmlFor="labMrn"
                hint="Leave blank to auto-assign AKL-#####"
              >
                <Input id="labMrn" name="labMrn" placeholder="Auto if blank" />
              </FormField>
              <FormField
                label={type === "organisation" ? "Organisation name" : "Full name"}
                htmlFor="name"
                required
              >
                <Input id="name" name="name" required />
              </FormField>
              {type === "individual" ? (
                <>
                  <FormField label="Date of birth" htmlFor="dateOfBirth">
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                  </FormField>
                  <FormField label="Sex">
                    <Select value={sex} onValueChange={setSex}>
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
                <Input id="nationalId" name="nationalId" />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Contact">
            <FormGrid cols={3}>
              <FormField label="Phone" htmlFor="phone">
                <Input id="phone" name="phone" type="tel" />
              </FormField>
              <FormField label="Email" htmlFor="email">
                <Input id="email" name="email" type="email" />
              </FormField>
              <FormField label="Address" htmlFor="address" span="full">
                <Input id="address" name="address" />
              </FormField>
            </FormGrid>
          </FormSection>

          {type === "individual" ? (
            <FormSection title="Next of kin" description="Optional emergency contact.">
              <FormGrid cols={2}>
                <FormField label="Next of kin" htmlFor="nextOfKin">
                  <Input id="nextOfKin" name="nextOfKin" />
                </FormField>
                <FormField label="Next of kin phone" htmlFor="nextOfKinPhone">
                  <Input id="nextOfKinPhone" name="nextOfKinPhone" type="tel" />
                </FormField>
              </FormGrid>
            </FormSection>
          ) : null}

          <FormSection title="Admin notes">
            <FormField label="Clinical / admin notes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={2} />
            </FormField>
          </FormSection>

          <StickyFormActions summary={type === "individual" ? "Patient record" : "Facility record"}>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save record"}
            </Button>
          </StickyFormActions>
        </form>
      ) : null}

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void router.navigate({
            to: "/crm/clients",
            search: {
              ...(String(form.get("q") ?? "").trim()
                ? { q: String(form.get("q")).trim() }
                : {}),
              ...(search.type ? { type: search.type } : {}),
              ...(search.active && search.active !== "active"
                ? { active: search.active }
                : {}),
            },
          });
        }}
      >
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="q" className="sr-only">
            Search
          </Label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search MRN, name, phone, email, national ID…"
          />
        </div>
        <Select
          value={search.type ?? "all"}
          onValueChange={(value) => {
            void router.navigate({
              to: "/crm/clients",
              search: {
                ...(q ? { q } : {}),
                ...(value !== "all" ? { type: value } : {}),
                ...(search.active && search.active !== "active"
                  ? { active: search.active }
                  : {}),
              },
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="individual">Individuals</SelectItem>
            <SelectItem value="organisation">Organisations</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={search.active ?? "active"}
          onValueChange={(value) => {
            void router.navigate({
              to: "/crm/clients",
              search: {
                ...(q ? { q } : {}),
                ...(search.type ? { type: search.type } : {}),
                ...(value !== "active" ? { active: value } : {}),
              },
            });
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All status</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <LimsDataGrid
        isEmpty={clients.length === 0}
        empty="No client records match this filter. Register a patient or facility to begin."
        footer={`${clients.length} record${clients.length === 1 ? "" : "s"}`}
        toolbar={
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Registry
          </p>
        }
      >
        <LimsGridTable>
          <LimsGridHead>
            <tr>
              <LimsGridTh>Lab MRN</LimsGridTh>
              <LimsGridTh>Name</LimsGridTh>
              <LimsGridTh>Type</LimsGridTh>
              <LimsGridTh>Sex</LimsGridTh>
              <LimsGridTh>Age</LimsGridTh>
              <LimsGridTh>Phone</LimsGridTh>
              <LimsGridTh>National ID</LimsGridTh>
              <LimsGridTh className="text-right">Orders</LimsGridTh>
              <LimsGridTh className="text-right">Open</LimsGridTh>
              <LimsGridTh>Last visit</LimsGridTh>
              <LimsGridTh>Status</LimsGridTh>
              <LimsGridTh className="text-right">Actions</LimsGridTh>
            </tr>
          </LimsGridHead>
          <LimsGridBody>
            {clients.map((client) => (
              <LimsGridRow key={client.id}>
                <LimsGridTd className="font-mono text-xs font-semibold">
                  {client.labMrn || `AKL-${String(client.id).padStart(5, "0")}`}
                </LimsGridTd>
                <LimsGridTd>
                  <Link
                    to="/crm/clients/$id"
                    params={{ id: String(client.id) }}
                    className="font-medium hover:underline"
                  >
                    {client.name}
                  </Link>
                  {client.email ? (
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  ) : null}
                </LimsGridTd>
                <LimsGridTd className="capitalize text-muted-foreground">{client.type}</LimsGridTd>
                <LimsGridTd className="capitalize text-muted-foreground">
                  {client.sex || "—"}
                </LimsGridTd>
                <LimsGridTd className="tabular-nums text-muted-foreground">
                  {client.age ?? "—"}
                </LimsGridTd>
                <LimsGridTd className="whitespace-nowrap text-muted-foreground">
                  {client.phone || "—"}
                </LimsGridTd>
                <LimsGridTd className="font-mono text-xs text-muted-foreground">
                  {client.nationalId || "—"}
                </LimsGridTd>
                <LimsGridTd className="text-right tabular-nums">{client.orderCount}</LimsGridTd>
                <LimsGridTd className="text-right tabular-nums">
                  {client.openOrderCount > 0 ? (
                    <Badge variant="secondary">{client.openOrderCount}</Badge>
                  ) : (
                    "0"
                  )}
                </LimsGridTd>
                <LimsGridTd className="whitespace-nowrap text-xs text-muted-foreground">
                  {client.lastOrderedAt
                    ? new Date(client.lastOrderedAt).toLocaleDateString()
                    : "—"}
                </LimsGridTd>
                <LimsGridTd>
                  <Badge variant={client.active === false ? "outline" : "secondary"}>
                    {client.active === false ? "Inactive" : "Active"}
                  </Badge>
                </LimsGridTd>
                <LimsGridTd className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/crm/clients/$id" params={{ id: String(client.id) }}>
                        Open
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/crm/lab-orders" search={{ clientId: String(client.id) }}>
                        Order
                      </Link>
                    </Button>
                  </div>
                </LimsGridTd>
              </LimsGridRow>
            ))}
          </LimsGridBody>
        </LimsGridTable>
      </LimsDataGrid>
    </div>
  );
}
