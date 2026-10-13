import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/site/BrandLogo";
import { getCurrentStaff, loginStaff } from "@/crm/auth";

export const Route = createFileRoute("/crm/login")({
  loader: async () => {
    const user = await getCurrentStaff();
    if (user) {
      throw redirect({ to: "/crm" });
    }
    return null;
  },
  head: () => ({
    meta: [{ title: "LIMS Login - AKILI LABS" }],
  }),
  component: CrmLoginPage,
});

function CrmLoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await loginStaff({
        data: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      toast.success("Signed in");
      await router.navigate({ to: "/crm" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-sm border border-border bg-card p-8 shadow-card"
      >
        <BrandLogo markClassName="size-14" tagline="LIMS" />
        <p className="mt-4 text-sm text-muted-foreground">
          Sign in to manage lab orders, appointments and clients.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              defaultValue="admin@akililabs.local"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
