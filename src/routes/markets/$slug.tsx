import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";

import labChemistry from "@/assets/lab-chemistry.jpg";
import labHaematology from "@/assets/lab-haematology.jpg";
import labHistopathology from "@/assets/lab-histopathology.jpg";
import labMolecular from "@/assets/lab-molecular.jpg";
import { LabGallery } from "@/components/site/LabGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countries,
  departments,
  getClientsByCountrySlug,
  getCountryBySlug,
} from "@/lib/site-data";

const labImages = {
  chemistry: labChemistry,
  haematology: labHaematology,
  molecular: labMolecular,
  histopathology: labHistopathology,
} as const;

export const Route = createFileRoute("/markets/$slug")({
  loader: ({ params }) => {
    const country = getCountryBySlug(params.slug);
    if (!country) {
      throw notFound();
    }
    return {
      country,
      clients: getClientsByCountrySlug(params.slug),
    };
  },
  head: ({ loaderData }) => {
    const country = loaderData?.country;
    if (!country) {
      return { meta: [{ title: "Market - AKILI LABS" }] };
    }
    return {
      meta: [
        { title: `${country.name} Distribution - AKILI LABS` },
        {
          name: "description",
          content: `${country.summary} Office in ${country.hub}: contacts, clients, cities and supply services.`,
        },
        { property: "og:title", content: `${country.name} - AKILI LABS` },
        { property: "og:description", content: country.summary },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/markets/${country.slug}` },
      ],
      links: [{ rel: "canonical", href: `/markets/${country.slug}` }],
    };
  },
  component: MarketProfilePage,
});

function MarketProfilePage() {
  const { country, clients } = Route.useLoaderData();
  const productLines = departments.filter((dept) =>
    country.productLineSlugs.includes(dept.slug),
  );
  const otherCountries = countries.filter((item) => item.slug !== country.slug);
  const heroSrc = labImages[country.labImage];

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroSrc}
          alt={`Laboratory equipment distributed by AKILI LABS in ${country.name}`}
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/85 to-primary-deep/40" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-primary-foreground md:py-28">
          <Badge className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">
            {country.code} | Distribution market
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold md:text-6xl">{country.name}</h1>
          <p className="mt-3 text-lg opacity-90 md:text-xl">
            Hub: {country.hub} - {country.focus}
          </p>
          <p className="mt-5 max-w-2xl text-base opacity-85 md:text-lg">{country.summary}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/quote">
                Request a quote
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/markets">
                <ArrowLeft className="size-4" />
                All markets
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid max-w-3xl grid-cols-2 gap-6 border-t border-primary-foreground/20 pt-8 md:grid-cols-4">
            {country.highlights.map((item) => (
              <div key={item.label}>
                <p className="text-xs opacity-75">{item.label}</p>
                <p className="mt-1 font-display text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-sm border border-border bg-card p-7 shadow-card">
            <p className="eyebrow text-primary">Distribution office</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">{country.office.name}</h2>
            <p className="mt-1 text-sm text-primary">{country.office.role}</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {country.office.address}
              </li>
              <li className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {country.office.hours}
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <a href={`tel:${country.office.phone}`} className="hover:underline">
                  {country.office.phone}
                </a>
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <a href={`mailto:${country.office.email}`} className="break-all hover:underline">
                  {country.office.email}
                </a>
              </li>
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <a href={`tel:${country.office.phone}`}>
                  <Phone className="size-4" />
                  Call office
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/${country.office.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`mailto:${country.office.email}`}>
                  <Mail className="size-4" />
                  Email
                </a>
              </Button>
            </div>
          </article>

          <article className="rounded-sm border border-border bg-primary-soft p-7">
            <p className="eyebrow text-primary">Cities we serve</p>
            <h2 className="mt-3 font-display text-xl font-semibold">Delivery coverage</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {country.cities.map((city) => (
                <li
                  key={city}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm text-foreground shadow-card"
                >
                  <Truck className="size-3.5 text-primary" aria-hidden />
                  {city}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Ask the {country.hub} office about delivery timelines outside these cities.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="eyebrow text-primary">What we sell here</p>
          <h2 className="mt-3 text-3xl font-semibold">Supply services in {country.name}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {country.services.map((service) => (
              <article
                key={service}
                className="flex gap-3 rounded-sm border border-border bg-card p-5 shadow-card"
              >
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <p className="text-sm font-medium">{service}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Catalogue focus</p>
            <h2 className="mt-3 text-3xl font-semibold">Product lines for this market</h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/departments">All product lines</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productLines.map((line) => (
            <Link
              key={line.slug}
              to="/departments"
              hash={line.slug}
              className="rounded-sm border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-primary-soft"
            >
              <line.icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-display text-base font-semibold">{line.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{line.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="eyebrow text-primary">Contacts</p>
          <h2 className="mt-3 text-3xl font-semibold">Sales contacts in {country.name}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {country.contacts.map((contact) => (
              <article
                key={contact.email}
                className="rounded-sm border border-border bg-card p-6 shadow-card"
              >
                <h3 className="font-display text-lg font-semibold">{contact.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{contact.role}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  <li className="flex gap-2 text-muted-foreground">
                    <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <a href={`tel:${contact.phone}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  </li>
                  <li className="flex gap-2 text-muted-foreground">
                    <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <a href={`mailto:${contact.email}`} className="break-all hover:underline">
                      {contact.email}
                    </a>
                  </li>
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="eyebrow text-primary">Clients in {country.name}</p>
        <h2 className="mt-3 text-3xl font-semibold">Who we supply</h2>
        {clients.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <article
                key={client.name}
                className="rounded-sm border border-border bg-card p-6 shadow-card"
              >
                <Building2 className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-base font-semibold">{client.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{client.type}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Client details for this market are available on request from the local sales desk.
          </p>
        )}
      </section>

      <section className="bg-primary-soft">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="eyebrow text-primary">Labs</p>
          <h2 className="mt-3 text-3xl font-semibold">Laboratories we supply in this market</h2>
          <div className="mt-10">
            <LabGallery countrySlug={country.slug} />
          </div>
        </div>
      </section>

      <section className="surface-clinical text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-16 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Need equipment in {country.name}?</h2>
            <p className="mt-3 max-w-xl opacity-85">
              Contact the {country.hub} distribution office for quotes, demos, delivery and after-sales
              support. AKILI LABS distributes laboratory and clinic equipment to facilities across this market.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/quote">Request a quote</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href={`tel:${country.office.phone}`}>Call {country.office.phone}</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="eyebrow text-primary">Other markets</p>
        <h2 className="mt-3 text-3xl font-semibold">Explore nearby countries</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherCountries.map((item) => (
            <Link
              key={item.slug}
              to="/markets/$slug"
              params={{ slug: item.slug }}
              className="rounded-sm border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary-soft"
            >
              <p className="text-xs font-semibold text-primary">{item.code}</p>
              <h3 className="mt-1 font-display text-base font-semibold">{item.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.hub} | {item.focus}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
