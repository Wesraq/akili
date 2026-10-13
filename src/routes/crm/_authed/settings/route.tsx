import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SettingsShell } from "@/components/crm/SettingsShell";

export const Route = createFileRoute("/crm/_authed/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  const { user } = Route.useRouteContext();
  return (
    <SettingsShell user={user}>
      <Outlet />
    </SettingsShell>
  );
}
