import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAuditEvents } from "@/crm/fns/settings.server";
import { entityHref } from "@/crm/lib/ops";

export const Route = createFileRoute("/crm/_authed/settings/audit")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: "/crm/settings" });
    }
  },
  validateSearch: (search: Record<string, unknown>): {
    entityType?: string;
    action?: string;
    q?: string;
  } => {
    const entityType = typeof search["entityType"] === "string" ? search["entityType"] : undefined;
    const action = typeof search["action"] === "string" ? search["action"] : undefined;
    const q = typeof search["q"] === "string" ? search["q"] : undefined;
    return {
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
      ...(q ? { q } : {}),
    };
  },
  loaderDeps: ({ search }) => ({
    entityType: search.entityType ?? "",
    action: search.action ?? "",
    q: search.q ?? "",
  }),
  loader: ({ deps }) =>
    listAuditEvents({
      data: {
        ...(deps.entityType ? { entityType: deps.entityType } : {}),
        ...(deps.action ? { action: deps.action } : {}),
        ...(deps.q ? { q: deps.q } : {}),
      },
    }),
  head: () => ({ meta: [{ title: "Activity log - AKILI LIMS" }] }),
  component: AuditSettingsPage,
});

function AuditSettingsPage() {
  const events = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();

  const entityTypes = useMemo(
    () => Array.from(new Set(events.map((event) => event.entityType))).sort(),
    [events],
  );
  const actions = useMemo(
    () => Array.from(new Set(events.map((event) => event.action))).sort(),
    [events],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Activity log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Last {events.length} recorded staff actions.
        </p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void router.navigate({
            to: "/crm/settings/audit",
            search: {
              ...(String(form.get("q") ?? "") ? { q: String(form.get("q")) } : {}),
              ...(search.entityType ? { entityType: search.entityType } : {}),
              ...(search.action ? { action: search.action } : {}),
            },
          });
        }}
      >
        <Input
          name="q"
          defaultValue={search.q ?? ""}
          placeholder="Search actor, action, entity…"
          className="max-w-sm"
        />
        <Select
          value={search.entityType ?? "all"}
          onValueChange={(value) =>
            void router.navigate({
              to: "/crm/settings/audit",
              search: {
                ...(search.q ? { q: search.q } : {}),
                ...(search.action ? { action: search.action } : {}),
                ...(value !== "all" ? { entityType: value } : {}),
              },
            })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={search.action ?? "all"}
          onValueChange={(value) =>
            void router.navigate({
              to: "/crm/settings/audit",
              search: {
                ...(search.q ? { q: search.q } : {}),
                ...(search.entityType ? { entityType: search.entityType } : {}),
                ...(value !== "all" ? { action: value } : {}),
              },
            })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
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
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const href = entityHref(event.entityType, event.entityId);
                return (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{event.at}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{event.actorName ?? "System"}</p>
                      {event.actorEmail ? (
                        <p className="text-xs text-muted-foreground">{event.actorEmail}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{event.action}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {href ? (
                        <a href={href} className="font-medium hover:underline">
                          {event.entityType} #{event.entityId}
                        </a>
                      ) : (
                        <>
                          <span className="font-medium">{event.entityType}</span>
                          <span className="text-muted-foreground"> #{event.entityId}</span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
