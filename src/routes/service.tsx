import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wrench } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";
import { Button } from "@/components/ui/button";
import { servicePlans } from "@/lib/site-data";

export const Route = createFileRoute("/service")({
  head: () => ({
    meta: [
      { title: "Service & Warranty - AKILI LABS" },
      {
        name: "description",
        content:
          "Installation, training, preventive maintenance, spare parts and warranty options for laboratory equipment supplied by AKILI LABS.",
      },
      { property: "og:title", content: "Service & Warranty - AKILI LABS" },
      {
        property: "og:description",
        content: "After-sales service plans for analysers and lab systems across our markets.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/service" },
    ],
    links: [{ rel: "canonical", href: "/service" }],
  }),
  component: ServicePage,
});

function ServicePage() {
  return (
    <>
      <PageHero
        eyebrow="After sales"
        title="Service & warranty"
        description="Commissioning, operator training, preventive maintenance and spare-parts support for platforms we supply."
      >
        <Button asChild size="lg" variant="secondary">
          <Link to="/quote">Ask about a service plan</Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicePlans.map((plan) => (
            <article key={plan.name} className="rounded-sm border border-border bg-card p-6 shadow-card">
              <Wrench className="size-6 text-primary" aria-hidden />
              <h2 className="mt-4 font-display text-lg font-semibold">{plan.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{plan.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-primary-soft">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-primary">Response</p>
            <h2 className="mt-3 text-3xl font-semibold">Keep platforms productive</h2>
            <p className="mt-4 text-muted-foreground">
              Most capital purchases include 12 months parts and labour. Extended cover and
              scheduled maintenance can be added at quote stage.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>Remote triage before engineer dispatch</li>
              <li>Calibration and IQ/OQ documentation on request</li>
              <li>Consumable planning with your account manager</li>
            </ul>
            <Button asChild className="mt-8" variant="outline">
              <Link to="/downloads">
                Download service terms
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <RequestForm
            variant="contact"
            options={servicePlans.map((plan) => plan.name)}
            optionLabel="Service interest"
          />
        </div>
      </section>
    </>
  );
}
