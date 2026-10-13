import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { CrmShell } from "@/components/crm/CrmShell";
import { getCurrentStaff } from "@/crm/auth";
import { getNavBadges } from "@/crm/fns/nav-badges.server";
import { getLabSettings } from "@/crm/fns/settings.server";

export const Route = createFileRoute("/crm/_authed")({
  beforeLoad: async () => {
    const user = await getCurrentStaff();
    if (!user) {
      throw redirect({ to: "/crm/login" });
    }
    const lab = await getLabSettings();
    return { user, lab };
  },
  loader: async () => {
    const badges = await getNavBadges();
    return { badges };
  },
  // Keep side-menu counts fresh as staff moves around the portal.
  staleTime: 0,
  component: AuthedCrmLayout,
});

function AuthedCrmLayout() {
  const { user } = Route.useRouteContext();
  const { badges } = Route.useLoaderData();
  return (
    <CrmShell user={user} badges={badges}>
      <Outlet />
    </CrmShell>
  );
}
