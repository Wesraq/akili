import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPassword, updateMyProfile } from "@/crm/fns/settings.server";

export const Route = createFileRoute("/crm/_authed/settings/profile")({
  head: () => ({ meta: [{ title: "My profile - AKILI LIMS" }] }),
  component: ProfileSettingsPage,
});

function ProfileSettingsPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfilePending(true);
    try {
      await updateMyProfile({
        data: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
        },
      });
      toast.success("Profile updated — sign in again if your email changed");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setProfilePending(false);
    }
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");
    if (newPassword !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPasswordPending(true);
    try {
      await changeMyPassword({
        data: {
          currentPassword: String(form.get("currentPassword") ?? ""),
          newPassword,
        },
      });
      toast.success("Password changed");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password");
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">My profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personal account details for your LIMS login.
        </p>
      </div>

      <form onSubmit={onSaveProfile} className="rounded-sm border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">Account</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" name="name" required defaultValue={user.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue={user.email} />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Input value={user.role === "admin" ? "Administrator" : "Staff"} disabled />
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={profilePending}>
          {profilePending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <form
        onSubmit={onChangePassword}
        className="rounded-sm border border-border bg-card p-6 shadow-card"
      >
        <h3 className="font-display text-lg font-semibold">Change password</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2 sm:max-w-sm">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={passwordPending}>
          {passwordPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
