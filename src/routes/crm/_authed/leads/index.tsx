import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignLead, listLeads, listStaffAssignees, updateLeadStatus } from "@/crm/fns/leads.server";

const statuses = ["new", "contacted", "qualified", "converted", "closed"] as const;

export const Route = createFileRoute("/crm/_authed/leads/")({
  validateSearch: (search: Record<string, unknown>): { status?: string; q?: string } => {
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    const q = typeof search["q"] === "string" ? search["q"] : undefined;
    return {
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
    };
  },
  loaderDeps: ({ search }) => ({ status: search.status ?? "", q: search.q ?? "" }),
  loader: async ({ deps }) => {
    const [leads, staff] = await Promise.all([
      listLeads({
        data: {
          ...(deps.status && statuses.includes(deps.status as (typeof statuses)[number])
            ? { status: deps.status as (typeof statuses)[number] }
            : {}),
          ...(deps.q ? { q: deps.q } : {}),
        },
      }),
      listStaffAssignees(),
    ]);
    return { leads, staff };
  },
  head: () => ({ meta: [{ title: "Leads - AKILI LIMS" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { leads, staff } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();

  async function onStatus(id: number, status: (typeof statuses)[number]) {
    try {
      await updateLeadStatus({ data: { id, status } });
      toast.success("Lead updated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function onAssign(id: number, value: string) {
    try {
      await assignLead({
        data: { id, assignedTo: value === "unassigned" ? null : Number(value) },
      });
      toast.success("Assignee updated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assign failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-primary">LIMS</p>
        <h1 className="mt-2 text-3xl font-semibold">Website leads</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quote, contact and service enquiries captured from the public site.
        </p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void router.navigate({
            to: "/crm/leads",
            search: {
              ...(String(form.get("q") ?? "") ? { q: String(form.get("q")) } : {}),
              ...(search.status ? { status: search.status } : {}),
            },
          });
        }}
      >
        <Input
          name="q"
          defaultValue={search.q ?? ""}
          placeholder="Search name, email, phone, reference"
          className="max-w-md"
        />
        <Select
          value={search.status ?? "all"}
          onValueChange={(value) => {
            void router.navigate({
              to: "/crm/leads",
              search: {
                ...(search.q ? { q: search.q } : {}),
                ...(value !== "all" ? { status: value } : {}),
              },
            });
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Interest</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{lead.reference}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{lead.fullName}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{lead.source}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.interest || "—"}</td>
                <td className="px-4 py-3">
                  <Select
                    value={lead.assignedTo ? String(lead.assignedTo) : "unassigned"}
                    onValueChange={(value) => void onAssign(lead.id, value)}
                  >
                    <SelectTrigger className="h-8 w-40">
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
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={lead.status}
                    onValueChange={(value) =>
                      void onStatus(lead.id, value as (typeof statuses)[number])
                    }
                  >
                    <SelectTrigger className="h-8 w-36">
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
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="link" className="h-auto p-0">
                    <Link to="/crm/leads/$id" params={{ id: String(lead.id) }}>
                      Open
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No leads yet. Submit a quote or contact form on the public site.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
