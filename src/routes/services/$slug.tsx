import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listPublishedTariffs } from "@/crm/fns/clinical-tests.server";
import { clinicalDepartments, formatZmw } from "@/lib/clinical-menu";
import {
  clinicalServicePages,
  featuredTestsForService,
  getClinicalServiceBySlug,
} from "@/lib/clinical-services";

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const service = getClinicalServiceBySlug(params.slug);
    if (!service) throw notFound();
    const tariffs = await listPublishedTariffs();
    return {
      service,
      tests: featuredTestsForService(tariffs, service.slug),
      others: clinicalServicePages.filter((page) => page.slug !== service.slug),
    };
  },
  head: ({ loaderData }) => {
    const service = loaderData?.service;
    if (!service) return { meta: [{ title: "Clinical service - AKILI LABS" }] };
    return {
      meta: [
        { title: `${service.title} - AKILI LABS` },
        { name: "description", content: service.summary },
        { property: "og:title", content: `${service.title} - AKILI LABS` },
        { property: "og:description", content: service.summary },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/services/${service.slug}` },
      ],
      links: [{ rel: "canonical", href: `/services/${service.slug}` }],
    };
  },
  component: ClinicalServicePage,
});

function ClinicalServicePage() {
  const { service, tests, others } = Route.useLoaderData();

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={service.heroImage}
          alt={service.heroAlt}
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/80 to-primary-deep/35" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-primary-foreground md:py-28">
          <p className="eyebrow opacity-80">Clinical service</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold md:text-6xl">{service.title}</h1>
          <p className="mt-5 max-w-2xl text-base opacity-90 md:text-lg">{service.summary}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/book">
                Book a test
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/services">
                <ArrowLeft className="size-4" />
                All services
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="eyebrow text-primary">Overview</p>
            <h2 className="mt-3 text-3xl font-semibold">What this service covers</h2>
            <p className="mt-4 text-muted-foreground">{service.intro}</p>
            <ul className="mt-8 space-y-3">
              {service.whatWeOffer.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="border border-border bg-muted/30 p-7">
            <p className="eyebrow text-primary">Who it is for</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {service.whoFor.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-foreground">{service.turnaroundNote}</p>
          </aside>
        </div>
      </section>

      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="eyebrow text-primary">In the laboratory</p>
          <h2 className="mt-3 text-3xl font-semibold">Facilities & sample handling</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Photography from AKILI LABS partner and hub laboratories that run this service line.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {service.gallery.map((shot) => (
              <figure key={shot.caption} className="overflow-hidden border border-border bg-card">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  width={1200}
                  height={750}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
                <figcaption className="p-5 text-sm text-muted-foreground">{shot.caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 max-w-2xl">
            <h3 className="font-display text-lg font-semibold">Sample notes</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {service.sampleNotes.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {tests.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">Published menu</p>
              <h2 className="mt-3 text-3xl font-semibold">Example tests in this service</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/services">
                Full test menu
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Test</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Cash</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.code} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{test.code}</td>
                    <td className="px-4 py-3 font-medium">{test.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{test.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatZmw(test.priceCashZmw)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-12">
          <div>
            <p className="eyebrow text-primary">Ready to proceed</p>
            <h2 className="mt-3 text-2xl font-semibold">
              Book {service.shortTitle.toLowerCase()} testing
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/book">
                <FlaskConical className="size-4" />
                Book a test
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact the lab</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14">
          <h3 className="font-display text-lg font-semibold">Other clinical services</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((page) => (
              <Link
                key={page.slug}
                to="/services/$slug"
                params={{ slug: page.slug }}
                className="group border border-border bg-card transition-colors hover:border-primary/40"
              >
                <img
                  src={page.heroImage}
                  alt={page.heroAlt}
                  width={800}
                  height={500}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="p-5">
                  <h4 className="font-display font-semibold group-hover:text-primary">
                    {page.title}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">{page.summary}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            {clinicalDepartments.length} service lines · cash tariffs on the full menu
          </p>
        </div>
      </section>
    </>
  );
}
