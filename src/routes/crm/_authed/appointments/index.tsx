import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AppointmentCalendar,
  dayWithHour,
  toDatetimeLocalValue,
  type CalendarAppointment,
} from "@/components/crm/AppointmentCalendar";
import { FormField } from "@/components/crm/LimsForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  createAppointment,
  listAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "@/crm/fns/appointments.server";
import { searchClientsLite } from "@/crm/fns/clients.server";

const statuses = ["scheduled", "completed", "cancelled", "no_show"] as const;
const servicePresets = [
  "Lab sample collection",
  "Consultation",
  "Results review",
  "Equipment demo",
  "Follow-up",
];

export const Route = createFileRoute("/crm/_authed/appointments/")({
  validateSearch: (search: Record<string, unknown>): {
    clientId?: string;
    status?: string;
    view?: string;
  } => {
    const clientId = typeof search["clientId"] === "string" ? search["clientId"] : undefined;
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    const view = typeof search["view"] === "string" ? search["view"] : undefined;
    return {
      ...(clientId ? { clientId } : {}),
      ...(status ? { status } : {}),
      ...(view ? { view } : {}),
    };
  },
  loaderDeps: ({ search }) => ({
    clientId: search.clientId ?? "",
    status: search.status ?? "",
  }),
  loader: async ({ deps }) => {
    const clientId = deps.clientId ? Number(deps.clientId) : undefined;
    const status =
      deps.status && statuses.includes(deps.status as (typeof statuses)[number])
        ? (deps.status as (typeof statuses)[number])
        : undefined;
    const [appointments, clientOptions] = await Promise.all([
      listAppointments({
        data: {
          ...(clientId ? { clientId } : {}),
          ...(status ? { status } : {}),
        },
      }),
      searchClientsLite({ data: {} }),
    ]);
    return { appointments, clientOptions, prefClientId: deps.clientId };
  },
  head: () => ({ meta: [{ title: "Appointments - AKILI LIMS" }] }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const { appointments, clientOptions, prefClientId } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const pageView = search.view === "list" ? "list" : "calendar";

  const [bookOpen, setBookOpen] = useState(Boolean(prefClientId));
  const [detail, setDetail] = useState<CalendarAppointment | null>(null);
  const [pending, setPending] = useState(false);
  const [clientId, setClientId] = useState(prefClientId || "");
  const [scheduledAt, setScheduledAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [serviceType, setServiceType] = useState(servicePresets[0] ?? "");

  useEffect(() => {
    if (prefClientId) {
      setClientId(prefClientId);
      setBookOpen(true);
    }
  }, [prefClientId]);

  const calendarItems = useMemo(
    () =>
      appointments.map((item) => ({
        id: item.id,
        clientId: item.clientId,
        clientName: item.clientName,
        scheduledAt: item.scheduledAt,
        serviceType: item.serviceType,
        status: item.status,
        notes: item.notes,
      })),
    [appointments],
  );

  function openBookAt(day: Date, hour: number) {
    setScheduledAt(toDatetimeLocalValue(dayWithHour(day, hour)));
    setBookOpen(true);
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientId) {
      toast.error("Select a client");
      return;
    }
    if (!serviceType.trim()) {
      toast.error("Enter a service");
      return;
    }
    setPending(true);
    try {
      await createAppointment({
        data: {
          clientId: Number(clientId),
          scheduledAt: new Date(scheduledAt).toISOString(),
          serviceType: serviceType.trim(),
          status: "scheduled",
          notes: String(new FormData(event.currentTarget).get("notes") ?? "") || null,
        },
      });
      toast.success("Appointment booked");
      setBookOpen(false);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not book");
    } finally {
      setPending(false);
    }
  }

  async function onStatus(id: number, next: (typeof statuses)[number]) {
    try {
      await updateAppointmentStatus({ data: { id, status: next } });
      toast.success("Status updated");
      setDetail((current) => (current && current.id === id ? { ...current, status: next } : current));
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await updateAppointment({
        data: {
          id: detail.id,
          clientId: detail.clientId,
          scheduledAt: new Date(String(form.get("scheduledAt") ?? "")).toISOString(),
          serviceType: String(form.get("serviceType") ?? detail.serviceType),
          status: detail.status,
          notes: String(form.get("notes") ?? "") || null,
        },
      });
      toast.success("Appointment updated");
      setDetail(null);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">LIMS</p>
          <h1 className="mt-2 text-3xl font-semibold">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Calendar scheduling for clinical visits, collections and demos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-sm border border-border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={pageView === "calendar" ? "secondary" : "ghost"}
              onClick={() =>
                void router.navigate({
                  to: "/crm/appointments",
                  search: {
                    ...(search.clientId ? { clientId: search.clientId } : {}),
                    ...(search.status ? { status: search.status } : {}),
                  },
                })
              }
            >
              Calendar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={pageView === "list" ? "secondary" : "ghost"}
              onClick={() =>
                void router.navigate({
                  to: "/crm/appointments",
                  search: {
                    view: "list",
                    ...(search.clientId ? { clientId: search.clientId } : {}),
                    ...(search.status ? { status: search.status } : {}),
                  },
                })
              }
            >
              List
            </Button>
          </div>
          <Button type="button" onClick={() => setBookOpen(true)}>
            Book appointment
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={search.status ?? "all"}
          onValueChange={(value) =>
            void router.navigate({
              to: "/crm/appointments",
              search: {
                ...(pageView === "list" ? { view: "list" } : {}),
                ...(search.clientId ? { clientId: search.clientId } : {}),
                ...(value !== "all" ? { status: value } : {}),
              },
            })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{appointments.length} shown</Badge>
      </div>

      {pageView === "calendar" ? (
        <AppointmentCalendar
          appointments={calendarItems}
          onSelectDay={() => undefined}
          onSelectAppointment={(item) => setDetail(item)}
          onSelectSlot={openBookAt}
        />
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-medium hover:underline"
                      onClick={() =>
                        setDetail({
                          id: item.id,
                          clientId: item.clientId,
                          clientName: item.clientName,
                          scheduledAt: item.scheduledAt,
                          serviceType: item.serviceType,
                          status: item.status,
                          notes: item.notes,
                        })
                      }
                    >
                      {format(parseISO(item.scheduledAt), "dd MMM yyyy HH:mm")}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/crm/clients/$id"
                      params={{ id: String(item.clientId) }}
                      className="font-medium hover:underline"
                    >
                      {item.clientName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.serviceType}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">
                      {item.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={item.status}
                      onValueChange={(value) =>
                        void onStatus(item.id, value as (typeof statuses)[number])
                      }
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((statusOption) => (
                          <SelectItem key={statusOption} value={statusOption}>
                            {statusOption.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="grid gap-4">
            <FormField label="Client" required>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
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
            <FormField label="Date & time" htmlFor="scheduledAt" required>
              <Input
                id="scheduledAt"
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </FormField>
            <FormField
              label="Service"
              required
              hint="Pick a preset or type a custom service below"
            >
              <div className="grid gap-2">
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {servicePresets.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={serviceType}
                  onChange={(event) => setServiceType(event.target.value)}
                  placeholder="Or type a custom service"
                  required
                />
              </div>
            </FormField>
            <FormField label="Notes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={2} placeholder="Optional" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBookOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Book appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.clientName}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onReschedule} className="grid gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {detail.status.replace("_", " ")}
                  </Badge>
                  <Button asChild variant="link" className="h-auto p-0">
                    <Link to="/crm/clients/$id" params={{ id: String(detail.clientId) }}>
                      Open client
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editScheduledAt">Date & time</Label>
                  <Input
                    id="editScheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    required
                    defaultValue={toDatetimeLocalValue(parseISO(detail.scheduledAt))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editService">Service</Label>
                  <Input
                    id="editService"
                    name="serviceType"
                    required
                    defaultValue={detail.serviceType}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editNotes">Notes</Label>
                  <Textarea id="editNotes" name="notes" rows={2} defaultValue={detail.notes ?? ""} />
                </div>
                <div className="grid gap-2">
                  <Label>Quick status</Label>
                  <Select
                    value={detail.status}
                    onValueChange={(value) =>
                      void onStatus(detail.id, value as (typeof statuses)[number])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDetail(null)}>
                    Close
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Saving…" : "Save changes"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
