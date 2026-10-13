import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  TestTube2,
  UserRound,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/crm/_authed/settings/")({
  head: () => ({ meta: [{ title: "Settings - AKILI LIMS" }] }),
  component: SettingsOverviewPage,
});

function SettingsOverviewPage() {
  const { user } = Route.useRouteContext();
  const isAdmin = user.role === "admin";

  const cards = [
    {
      to: "/crm/settings/profile",
      title: "My profile",
      body: "Update your name, email and password.",
      icon: UserRound,
      adminOnly: false,
    },
    {
      to: "/crm/settings/organisation",
      title: "Organisation",
      body: "Lab identity, contact details, currency and document footers.",
      icon: Building2,
      adminOnly: true,
    },
    {
      to: "/crm/settings/users",
      title: "Staff accounts",
      body: "Invite staff, set roles, reset passwords and deactivate access.",
      icon: Users,
      adminOnly: true,
    },
    {
      to: "/crm/settings/tests",
      title: "Configure tariffs",
      body: "Edit ZMW prices and publish the clinical menu to the website.",
      icon: TestTube2,
      adminOnly: true,
    },
    {
      to: "/crm/settings/audit",
      title: "Activity log",
      body: "Review recent staff actions across orders, tariffs and accounts.",
      icon: ClipboardList,
      adminOnly: true,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Welcome, {user.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user.email} · {user.role === "admin" ? "Administrator" : "Staff"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards
          .filter((card) => !card.adminOnly || isAdmin)
          .map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="rounded-sm border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
            >
              <card.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-display text-base font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}
