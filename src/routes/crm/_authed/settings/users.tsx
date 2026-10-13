import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  createStaffUser,
  listStaffUsers,
  resetStaffPassword,
  setStaffActive,
  setStaffRole,
} from "@/crm/fns/users.server";

export const Route = createFileRoute("/crm/_authed/settings/users")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: "/crm/settings" });
    }
  },
  loader: () => listStaffUsers(),
  head: () => ({ meta: [{ title: "Staff users - AKILI LIMS" }] }),
  component: StaffUsersPage,
});

function StaffUsersPage() {
  const users = Route.useLoaderData();
  const { user: me } = Route.useRouteContext();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [resetFor, setResetFor] = useState<{ id: number; name: string } | null>(null);
  const [resetPending, setResetPending] = useState(false);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await createStaffUser({
        data: {
          email: String(form.get("email") ?? ""),
          name: String(form.get("name") ?? ""),
          password: String(form.get("password") ?? ""),
          role,
        },
      });
      toast.success("Staff user created");
      event.currentTarget.reset();
      setRole("staff");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create user");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(id: number, active: boolean) {
    try {
      await setStaffActive({ data: { id, active } });
      toast.success(active ? "User activated" : "User deactivated");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function changeRole(id: number, nextRole: "admin" | "staff") {
    try {
      await setStaffRole({ data: { id, role: nextRole } });
      toast.success(`Role set to ${nextRole}`);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change role");
    }
  }

  async function onResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetFor) return;
    const form = new FormData(event.currentTarget);
    setResetPending(true);
    try {
      await resetStaffPassword({
        data: {
          id: resetFor.id,
          password: String(form.get("password") ?? ""),
        },
      });
      toast.success(`Password reset for ${resetFor.name}`);
      setResetFor(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password");
    } finally {
      setResetPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Staff accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage who can sign in to the LIMS portal.
        </p>
      </div>

      <form onSubmit={onCreate} className="rounded-sm border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">Add staff</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "admin" | "staff")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  {user.name}
                  {user.id === me.id ? (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onValueChange={(value) => void changeRole(user.id, value as "admin" | "staff")}
                    disabled={user.id === me.id}
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.active ? "secondary" : "outline"}>
                    {user.active ? "active" : "inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetFor({ id: user.id, name: user.name })}
                    >
                      Reset password
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={user.id === me.id}
                      onClick={() => void toggleActive(user.id, !user.active)}
                    >
                      {user.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(resetFor)} onOpenChange={(open) => !open && setResetFor(null)}>
        <DialogContent>
          <form onSubmit={onResetPassword}>
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>
                Set a new temporary password for {resetFor?.name}. They should change it after
                signing in.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="reset-password">New password</Label>
              <Input
                id="reset-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetFor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetPending}>
                {resetPending ? "Saving…" : "Reset password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
