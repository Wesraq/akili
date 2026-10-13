import { Link, useRouter } from "@tanstack/react-router";
import {
  CalendarDays,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  TestTube2,
  Users,
  BarChart3,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AccessionSearch } from "@/components/crm/AccessionSearch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/site/BrandLogo";
import { logoutStaff } from "@/crm/auth";
import type { NavBadges } from "@/crm/fns/nav-badges.server";
import type { SessionUser } from "@/crm/types";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badgeKey?: keyof NavBadges;
};

type NavGroup = { title: string; items: NavItem[] };

/** Clinical LIMS IA: work queues → registry → commercial → catalogues. */
const navGroups: NavGroup[] = [
  {
    title: "Work",
    items: [
      { to: "/crm", label: "Workboard", icon: LayoutDashboard, exact: true },
      {
        to: "/crm/lab-orders",
        label: "Accessioning",
        icon: FlaskConical,
        badgeKey: "labOrders",
      },
      {
        to: "/crm/appointments",
        label: "Appointments",
        icon: CalendarDays,
        badgeKey: "appointments",
      },
    ],
  },
  {
    title: "Registry",
    items: [
      { to: "/crm/clients", label: "Patients / clients", icon: Users },
      { to: "/crm/leads", label: "Inbound requests", icon: Inbox, badgeKey: "leads" },
    ],
  },
  {
    title: "Commercial",
    items: [
      { to: "/crm/equipment-orders", label: "Equipment", icon: Package },
      { to: "/crm/invoices", label: "Invoices", icon: Receipt, badgeKey: "invoices" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { to: "/crm/tariffs", label: "Test menu", icon: TestTube2 },
      { to: "/crm/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

function NavCount({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums"
      aria-label={`${count} pending`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLink({
  item,
  counts,
  onNavigate,
}: {
  item: NavItem;
  counts: NavBadges;
  onNavigate?: () => void;
}) {
  const count = item.badgeKey ? counts[item.badgeKey] : 0;
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact ?? false }}
      onClick={onNavigate}
      className="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary"
      activeProps={{
        className:
          "inline-flex items-center gap-2 rounded-sm bg-secondary px-3 py-2 text-sm font-medium text-foreground",
      }}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
      <NavCount count={count} />
    </Link>
  );
}

function SidebarNav({
  counts,
  onNavigate,
}: {
  counts: NavBadges;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3" aria-label="LIMS">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                counts={counts}
                {...(onNavigate ? { onNavigate } : {})}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarAccount({
  user,
  isAdmin,
  onLogout,
}: {
  user: SessionUser;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user.role === "admin" ? "Administrator" : "Lab staff"} · {user.email}
          </p>
        </div>
        {isAdmin ? (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Link to="/crm/settings" aria-label="Settings">
              <Settings className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onLogout}>
        <LogOut className="size-3.5" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}

export function CrmShell({
  user,
  badges,
  children,
}: {
  user: SessionUser;
  badges?: NavBadges;
  children: ReactNode;
}) {
  const router = useRouter();
  const isAdmin = user.role === "admin";
  const counts = badges ?? { leads: 0, labOrders: 0, invoices: 0, appointments: 0 };
  const [mobileOpen, setMobileOpen] = useState(false);

  async function onLogout() {
    try {
      await logoutStaff();
      toast.success("Signed out");
      await router.navigate({ to: "/crm/login" });
    } catch {
      toast.error("Could not sign out");
    }
  }

  return (
    <div className="flex h-svh overflow-hidden bg-muted/30">
      {/* Single nav pattern: sidebar (desktop always; mobile via sheet) */}
      <aside className="crm-no-print hidden h-full w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <BrandLogo markClassName="size-9" wordmarkClassName="text-sm" tagline="LIMS" />
        </div>
        <SidebarNav counts={counts} />
        <SidebarAccount user={user} isAdmin={isAdmin} onLogout={onLogout} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="crm-no-print flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0 sm:max-w-xs">
              <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
                <SheetTitle className="sr-only">LIMS navigation</SheetTitle>
                <BrandLogo markClassName="size-9" wordmarkClassName="text-sm" tagline="LIMS" />
              </SheetHeader>
              <SidebarNav counts={counts} onNavigate={() => setMobileOpen(false)} />
              <SidebarAccount
                user={user}
                isAdmin={isAdmin}
                onLogout={() => {
                  setMobileOpen(false);
                  void onLogout();
                }}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 md:hidden">
            <BrandLogo markClassName="size-8" wordmarkClassName="text-sm" tagline="LIMS" />
          </div>

          {/* Top bar is lookup only — not a second menu */}
          <AccessionSearch className="max-w-xl" />
        </header>

        <main className="crm-shell-main min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
