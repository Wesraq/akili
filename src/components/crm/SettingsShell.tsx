import { Link } from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  LayoutGrid,
  TestTube2,
  UserRound,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import type { SessionUser } from "@/crm/types";
import { cn } from "@/lib/utils";

const links = [
  { to: "/crm/settings", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/crm/settings/profile", label: "My profile", icon: UserRound },
  { to: "/crm/settings/organisation", label: "Organisation", icon: Building2, adminOnly: true },
  { to: "/crm/settings/users", label: "Staff", icon: Users, adminOnly: true },
  { to: "/crm/settings/tests", label: "Configure tariffs", icon: TestTube2, adminOnly: true },
  { to: "/crm/settings/audit", label: "Activity log", icon: ClipboardList, adminOnly: true },
] as const;

export function SettingsShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const isAdmin = user.role === "admin";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:gap-10">
      <aside className="crm-no-print w-full shrink-0 lg:w-52">
        <div className="mb-4 lg:mb-6">
          <p className="eyebrow text-primary">LIMS</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Account, lab and system preferences</p>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="Settings"
        >
          {links
            .filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin)
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: "exact" in item ? item.exact : false }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-foreground/75 hover:bg-secondary",
                )}
                activeProps={{
                  className:
                    "inline-flex shrink-0 items-center gap-2 rounded-sm bg-secondary px-3 py-2 text-sm font-medium text-foreground",
                }}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
