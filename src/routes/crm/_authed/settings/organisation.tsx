import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLabSettings, updateLabSettings } from "@/crm/fns/settings.server";

export const Route = createFileRoute("/crm/_authed/settings/organisation")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: "/crm/settings" });
    }
  },
  loader: () => getLabSettings(),
  head: () => ({ meta: [{ title: "Organisation - AKILI LIMS" }] }),
  component: OrganisationSettingsPage,
});

function OrganisationSettingsPage() {
  const settings = Route.useLoaderData();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await updateLabSettings({
        data: {
          orgName: String(form.get("orgName") ?? ""),
          tagline: String(form.get("tagline") ?? ""),
          phone: String(form.get("phone") ?? ""),
          whatsapp: String(form.get("whatsapp") ?? ""),
          email: String(form.get("email") ?? ""),
          address: String(form.get("address") ?? ""),
          hours: String(form.get("hours") ?? ""),
          currency: String(form.get("currency") ?? "ZMW").trim().toUpperCase(),
          vatRate: Number(form.get("vatRate") ?? 16),
          invoiceFooter: String(form.get("invoiceFooter") ?? ""),
          reportFooter: String(form.get("reportFooter") ?? ""),
        },
      });
      toast.success("Organisation settings saved");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Organisation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Details used on invoices, lab reports and internal documents. Current currency:{" "}
          <span className="font-medium text-foreground">{settings.currency}</span>
        </p>
      </div>

      <form key={settings.updatedAt} onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-sm border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold">Identity</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="orgName">Organisation name</Label>
              <Input id="orgName" name="orgName" required defaultValue={settings.orgName} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" name="tagline" defaultValue={settings.tagline} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency code</Label>
              <Input
                id="currency"
                name="currency"
                required
                defaultValue={settings.currency}
                placeholder="USD"
                className="uppercase"
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">ISO code used on invoices and quotes (e.g. USD, ZMW).</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vatRate">VAT rate (%)</Label>
              <Input
                id="vatRate"
                name="vatRate"
                type="number"
                min={0}
                max={100}
                step={0.01}
                required
                defaultValue={settings.vatRate}
              />
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold">Contact</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={settings.phone} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp (digits)</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={settings.email} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" rows={2} defaultValue={settings.address} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="hours">Opening hours</Label>
              <Input id="hours" name="hours" defaultValue={settings.hours} />
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold">Document footers</h3>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invoiceFooter">Invoice footer</Label>
              <Textarea
                id="invoiceFooter"
                name="invoiceFooter"
                rows={3}
                defaultValue={settings.invoiceFooter}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reportFooter">Lab report footer</Label>
              <Textarea
                id="reportFooter"
                name="reportFooter"
                rows={3}
                defaultValue={settings.reportFooter}
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Last updated {settings.updatedAt}
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save organisation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
