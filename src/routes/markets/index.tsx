import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";

import { AfricaPresenceMap } from "@/components/site/AfricaPresenceMap";
import { LabGallery } from "@/components/site/LabGallery";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { clients, countries } from "@/lib/site-data";

export const Route = createFileRoute("/markets/")({
  head: () => ({
    meta: [
      { title: "Where We Operate - AKILI LABS" },
      {
        name: "description",
        content:
          "AKILI LABS distributes laboratory equipment and medical devices across Zambia, Malawi, Mozambique, Tanzania, Central African Republic and Kenya.",
      },
      { property: "og:title", content: "Where We Operate - AKILI LABS" },
      {
        property: "og:description",
        content:
          "Distribution markets, clients and laboratory environments we supply across Central and East Africa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/markets" },
    ],
    links: [{ rel: "canonical", href: "/markets" }],
  }),
  component: MarketsPage,
});

function MarketsPage() {
  return (
    <>
      <PageHero
        eyebrow="Markets"
        title="Where we operate"
        description="AKILI LABS is a distribution company for laboratory equipment and medical devices across Central and East Africa. Hover the map to see major clients in each country."
      >
        <Button asChild size="lg" variant="secondary">
          <Link to="/quote">Request a quote</Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="eyebrow text-primary">Africa footprint</p>
        <h2 className="mt-3 text-3xl font-semibold">Our distribution markets</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Highlighted countries are where we sell and distribute. Hover to list major clients -
          including Maina Soko Military Hospital in Zambia.
        </p>
        <div className="mt-10">
          <AfricaPresenceMap />
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="eyebrow text-primary">Countries</p>
          <h2 className="mt-3 text-3xl font-semibold">Six markets, one supply network</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => (
              <Link
                key={country.slug}
                to="/markets/$slug"
                params={{ slug: country.slug }}
                className="group rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
              >
                <p className="text-xs font-semibold tracking-wide text-primary">{country.code}</p>
                <h3 className="mt-2 font-display text-xl font-semibold">{country.name}</h3>
                <p className="mt-3 inline-flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="font-medium text-foreground">{country.hub}</span>
                    <span className="mt-1 block">{country.focus}</span>
                  </span>
                </p>
                <p className="mt-4 text-xs text-muted-foreground">{country.cities.join(" | ")}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  View market profile
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="eyebrow text-primary">Clients</p>
        <h2 className="mt-3 text-3xl font-semibold">Who we supply</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Major hospitals, laboratories and programmes that buy equipment and lab systems from us.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {clients.map((client) => (
            <Link
              key={`${client.countrySlug}-${client.name}`}
              to="/markets/$slug"
              params={{ slug: client.countrySlug }}
              className="rounded-sm border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-primary-soft"
            >
              <p className="text-xs text-primary">{client.country}</p>
              <h3 className="mt-2 font-display text-base font-semibold">{client.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{client.type}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">Labs we supply</p>
              <h2 className="mt-3 text-3xl font-semibold">Laboratory environments</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Chemistry, haematology, molecular and histopathology labs equipped with systems we
                distribute and support.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/laboratory">Lab equipment catalogue</Link>
            </Button>
          </div>
          <div className="mt-10">
            <LabGallery />
          </div>
        </div>
      </section>
    </>
  );
}
