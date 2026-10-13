import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CreditCard, MessageCircle, Phone, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";
import { Button } from "@/components/ui/button";
import { departments, site } from "@/lib/site-data";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quote - AKILI LABS" },
      {
        name: "description",
        content:
          "Request a quote for healthcare equipment or laboratory systems from AKILI LABS. Choose a product line and preferred contact window.",
      },
      { property: "og:title", content: "Request a Quote - AKILI LABS" },
      {
        property: "og:description",
        content: "Secure online quote requests for medical and laboratory equipment supply.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/quote" },
    ],
    links: [{ rel: "canonical", href: "/quote" }],
  }),
  component: QuotePage,
});

const steps = [
  { title: "Submit your request", body: "Tell us the product line, quantities and delivery site." },
  { title: "We confirm details", body: "Sales replies within one working day to clarify specs." },
  { title: "Receive your quote", body: "You get pricing, lead times and optional install/service options." },
  { title: "Order & handover", body: "Place a PO, schedule delivery and complete installation if needed." },
];

function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Sales"
        title="Request an equipment quote"
        description="Online quotes for medical equipment, laboratory systems and consumables. For diagnostic appointments, use Book a test."
      >
        <Button asChild size="lg" variant="secondary">
          <Link to="/book">Book a lab test instead</Link>
        </Button>
      </PageHero>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1fr_420px]">
        <RequestForm
          variant="quote"
          options={departments.map((d) => d.name)}
          optionLabel="Product line"
        />

        <aside className="space-y-6">
          <div className="rounded-sm border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">How it works</h2>
            <ol className="mt-5 space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-sm border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Prefer to talk?</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 text-primary" aria-hidden />
                <a href={`tel:${site.phone}`} className="hover:underline">
                  {site.phone}
                </a>
              </li>
              <li className="flex gap-2">
                <MessageCircle className="mt-0.5 size-4 text-primary" aria-hidden />
                <a
                  href={`https://wa.me/${site.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  WhatsApp sales
                </a>
              </li>
              <li className="flex gap-2">
                <CalendarClock className="mt-0.5 size-4 text-primary" aria-hidden />
                {site.hours}
              </li>
            </ul>
          </div>

          <div className="rounded-sm border border-border bg-primary-soft p-6">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
              <CreditCard className="size-5 text-primary" aria-hidden />
              Procurement & payment
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We work with purchase orders, institutional billing and staged payments for larger
              fit-outs. Quotes include warranty and optional service plans.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-accent" aria-hidden />
              Your submission is encrypted and handled confidentially.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}

