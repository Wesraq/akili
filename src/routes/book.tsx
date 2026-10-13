import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, FlaskConical, MessageCircle, Package, Phone, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";
import { Button } from "@/components/ui/button";
import { listPublishedTariffs } from "@/crm/fns/clinical-tests.server";
import { clinicalDepartments } from "@/lib/clinical-menu";
import { sampleDeliveryChecklist } from "@/lib/sample-packaging";
import { site } from "@/lib/site-data";

export const Route = createFileRoute("/book")({
  loader: () => listPublishedTariffs(),
  head: () => ({
    meta: [
      { title: "Book a Lab Test - AKILI LABS" },
      {
        name: "description",
        content:
          "Book a clinical laboratory test with AKILI LABS. Walk-in and referral testing for haematology, chemistry, microbiology and histopathology.",
      },
      { property: "og:title", content: "Book a Lab Test - AKILI LABS" },
      {
        property: "og:description",
        content: "Request a diagnostic appointment or referral for laboratory testing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/book" },
    ],
    links: [{ rel: "canonical", href: "/book" }],
  }),
  component: BookTestPage,
});

const bookingOptions = [
  ...clinicalDepartments.map((dept) => dept.title),
  "Not sure — please advise",
];

function BookTestPage() {
  const tests = Route.useLoaderData();

  return (
    <>
      <PageHero
        eyebrow="Clinical services"
        title="Book a lab test"
        description="Request a walk-in or referral appointment for diagnostic testing. For equipment and consumables, use the quote form instead."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/services">View test menu & prices</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/quote">Equipment quote</Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1fr_400px]">
        <RequestForm
          variant="booking"
          options={bookingOptions}
          optionLabel="Test department"
          defaultOption={bookingOptions[0] ?? ""}
          tests={tests}
        />

        <aside className="space-y-6">
          <div className="rounded-sm border border-border bg-card p-6 shadow-card">
            <FlaskConical className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-lg font-semibold">What happens next</h2>
            <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
              <li>1. We confirm the panel, sample prep and appointment window.</li>
              <li>2. You visit our hub or your referring clinic collects the sample.</li>
              <li>3. Results are reviewed and validated.</li>
              <li>4. Final results are released to you or your clinician.</li>
            </ol>
          </div>

          <div className="rounded-sm border border-border bg-card p-6 shadow-card">
            <Package className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-lg font-semibold">
              Bringing or sending a sample
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              For patients, clinics and hospitals delivering specimens to AKILI LABS.
            </p>
            <ul className="mt-4 space-y-4">
              {sampleDeliveryChecklist.map((item) => (
                <li key={item.title} className="text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-sm border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-950">
              Example: haematology / EDTA tests — deliver in a <strong>purple-top</strong> bottle
              (lavender EDTA vacuum tube), inverted gently after draw, upright, not frozen.
            </p>
          </div>

          <div className="rounded-sm border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Need help choosing?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse our published cash tariffs to compare tests, sample requirements and prices.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/services#menu">Open tariff menu</Link>
            </Button>
          </div>

          <div className="rounded-sm border border-border bg-muted/40 p-6 text-sm">
            <p className="inline-flex items-center gap-2 font-medium">
              <Clock className="size-4 text-primary" aria-hidden />
              {site.hours}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a href={`tel:${site.phone}`} className="inline-flex items-center gap-2 hover:underline">
                <Phone className="size-4" aria-hidden />
                {site.phone}
              </a>
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:underline"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp bookings
              </a>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden />
              Looking for equipment? Use the quote form instead
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
