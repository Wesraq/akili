import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, MapPin, Package, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { aboutPoints, clients, countries, site } from "@/lib/site-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AKILI LABS" },
      {
        name: "description",
        content:
          "AKILI LABS is a laboratory equipment and medical device distributor serving Zambia, Malawi, Mozambique, Tanzania, CAR and Kenya.",
      },
      { property: "og:title", content: "About AKILI LABS" },
      {
        property: "og:description",
        content: "Who we are: distribution, installation and support for laboratory systems across Central and East Africa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="About AKILI LABS"
        description="We distribute laboratory equipment, medical devices and consumables. We do not provide clinical care - we supply the systems labs and hospitals run on."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/quote">Request a quote</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/markets">Where we operate</Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {aboutPoints.map((point) => (
            <article key={point.title} className="rounded-sm border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">{point.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-primary-soft">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="eyebrow text-primary">Footprint</p>
            <h2 className="mt-3 text-3xl font-semibold">Six markets, one supply desk</h2>
            <p className="mt-4 text-muted-foreground">
              Coordination from {site.address}. Local sales contacts in each country for delivery and
              after-sales support.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {countries.map((country) => (
              <Link
                key={country.slug}
                to="/markets/$slug"
                params={{ slug: country.slug }}
                className="rounded-sm border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
              >
                <p className="font-medium">{country.name}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden />
                  {country.hub}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-primary">Clients</p>
            <h2 className="mt-3 text-3xl font-semibold">Institutions we supply</h2>
            <p className="mt-4 text-muted-foreground">
              Hospitals, clinic networks and diagnostic laboratories across our markets - including
              named accounts such as Maina Soko Military Hospital.
            </p>
            <ul className="mt-6 space-y-3">
              {clients.slice(0, 6).map((client) => (
                <li key={client.name} className="flex gap-2 text-sm text-muted-foreground">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span>
                    <span className="font-medium text-foreground">{client.name}</span>
                    {` - ${client.country}`}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" variant="outline">
              <Link to="/markets">
                View markets
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="rounded-sm border border-border bg-card p-8 shadow-card">
            <Package className="size-8 text-primary" aria-hidden />
            <h3 className="mt-4 font-display text-xl font-semibold">How procurement works</h3>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {[
                "Request a quote with models or categories",
                "Receive pricing, lead times and warranty options",
                "Issue a PO or staged payment schedule",
                "Delivery, install, training and service handover",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8">
              <Link to="/quote">Start a quote</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
