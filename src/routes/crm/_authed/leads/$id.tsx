import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField, FormSection, StickyFormActions } from "@/components/crm/LimsForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  assignLead,
  convertLeadToClient,
  getLead,
  listStaffAssignees,
  scheduleLeadAppointment,
  updateLeadNotes,
  updateLeadStatus,
} from "@/crm/fns/leads.server";

const statuses = ["new", "contacted", "qualified", "converted", "closed"] as const;

export const Route = createFileRoute("/crm/_authed/leads/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw new Error("Invalid lead");
    const [lead, staff] = await Promise.all([
      getLead({ data: { id } }),
      listStaffAssignees(),
    ]);
    return { lead, staff };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.lead.reference ?? "Lead"} - AKILI LIMS` }],
  }),
  component: LeadDetailPage,
});

function LeadDetailPage() {
  const { lead, staff } = Route.useLoaderData();
  const router = useRouter();
  const [scheduling, setScheduling] = useState(false);
  const [notesPending, setNotesPending] = useState(false);

  async function onStatus(status: (typeof statuses)[number]) {
    try {
      await updateLeadStatus({ data: { id: lead.id, status } });
      toast.success("Status updated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onAssign(value: string) {
    try {
      await assignLead({
        data: {
          id: lead.id,
          assignedTo: value === "unassigned" ? null : Number(value),
        },
      });
      toast.success(value === "unassigned" ? "Lead unassigned" : "Lead assigned");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assign failed");
    }
  }

  async function onSaveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNotesPending(true);
    try {
      await updateLeadNotes({
        data: {
          id: lead.id,
          notes: String(form.get("notes") ?? "") || null,
        },
      });
      toast.success("Notes saved");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notes");
    } finally {
      setNotesPending(false);
    }
  }

  async function onConvert() {
    try {
      const result = await convertLeadToClient({ data: { id: lead.id } });
      toast.success("Converted to client");
      await router.navigate({
        to: "/crm/clients/$id",
        params: { id: String(result.clientId) },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Convert failed");
    }
  }

  async function onSchedule() {
    setScheduling(true);
    try {
      const result = await scheduleLeadAppointment({ data: { id: lead.id } });
      toast.success("Appointment scheduled");
      await router.navigate({
        to: "/crm/appointments",
        search: { clientId: String(result.clientId) },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule");
    } finally {
      setScheduling(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="link" className="h-auto px-0">
            <Link to="/crm/leads">← Leads</Link>
          </Button>
          <h1 className="mt-2 text-3xl font-semibold">{lead.fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.reference} · {new Date(lead.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lead.status}</Badge>
          <Button variant="outline" disabled={scheduling} onClick={() => void onSchedule()}>
            {scheduling ? "Scheduling…" : "Schedule appointment"}
          </Button>
          {!lead.clientId && (
            <Button onClick={() => void onConvert()}>Convert to client</Button>
          )}
          {lead.clientId && (
            <>
              <Button asChild variant="outline">
                <Link to="/crm/clients/$id" params={{ id: String(lead.clientId) }}>
                  View client
                </Link>
              </Button>
              <Button asChild>
                <Link
                  to="/crm/equipment-orders"
                  search={{ clientId: String(lead.clientId), leadId: String(lead.id) }}
                >
                  Create equipment order
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Contact</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="font-medium">{lead.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="font-medium">{lead.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Organisation</dt>
              <dd className="font-medium">{lead.orgName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Source</dt>
              <dd className="font-medium capitalize">{lead.source}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-sm border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Enquiry</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Interest</dt>
              <dd className="font-medium">{lead.interest || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Preferred date</dt>
              <dd className="font-medium">{lead.preferredDate || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Address</dt>
              <dd className="font-medium">{lead.address || "—"}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <p className="text-xs text-muted-foreground">Assignee</p>
              <Select
                value={lead.assignedTo ? String(lead.assignedTo) : "unassigned"}
                onValueChange={(value) => void onAssign(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((person) => (
                    <SelectItem key={person.id} value={String(person.id)}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <p className="text-xs text-muted-foreground">Update status</p>
              <Select
                value={lead.status}
                onValueChange={(value) => void onStatus(value as (typeof statuses)[number])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>

      <form onSubmit={(event) => void onSaveNotes(event)} className="space-y-4">
        <FormSection
          title="Staff notes"
          description="Follow-up notes for this enquiry (shown to staff only)."
        >
          <FormField label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              key={lead.updatedAt}
              defaultValue={lead.notes ?? ""}
              placeholder="Call back, quote sent, site visit…"
            />
          </FormField>
        </FormSection>
        <StickyFormActions>
          <Button type="submit" disabled={notesPending}>
            {notesPending ? "Saving…" : "Save notes"}
          </Button>
        </StickyFormActions>
      </form>
    </div>
  );
}
