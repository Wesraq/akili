import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FlaskConical,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
} from "lucide-react";

import labImage from "@/assets/lab.jpg";
import heroImage from "@/assets/hero-lab-machinery.jpg";
import { Button } from "@/components/ui/button";
import { listPublishedTariffs } from "@/crm/fns/clinical-tests.server";
import {
  clinicalDepartments,
  featuredFromTariffs,
  formatZmw,
} from "@/lib/clinical-menu";
import { site } from "@/lib/site-data";

export const Route = createFileRoute("/")({
  loader: () => listPublishedTariffs(),
  head: () => ({
    meta: [
      { title: "AKILI LABS - Clinical Testing & Lab Supply" },
      {
        name: "description",
        content:
          "AKILI LABS provides clinical laboratory diagnostics and medical equipment supply across Zambia and Central & East Africa. Book a test or request lab systems.",
      },
      { property: "og:title", content: "AKILI LABS - Clinical Testing & Lab Supply" },
      {
        property: "og:description",
        content:
          "Diagnostic testing for patients and clinics, plus analysers, devices and consumables for facilities that need to keep running.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const steps = [
  {
    n: "01",
    title: "Choose what you need",
    body: "Book a diagnostic test, or ask for equipment and consumables for your facility.",
  },
  {
    n: "02",
    title: "We confirm pricing & timing",
    body: "Cash tariffs in ZMW for lab tests, plus quotes for analysers, install and support.",
  },
  {
    n: "03",
    title: "Collect, report or deliver",
    body: "Walk-in and referral testing at our hub - or supply, commission and train on site.",
  },
];

function Home() {
  const tariffs = Route.useLoaderData();
  const featured = featuredFromTariffs(tariffs);

  return (
    <>
      <section className="relative isolate min-h-[88svh] overflow-hidden bg-primary-deep">
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={1200}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep via-primary-deep/88 to-primary-deep/25" />
        <div className="relative mx-auto flex min-h-[88svh] max-w-7xl flex-col justify-end px-6 pb-16 pt-28 text-primary-foreground md:justify-center md:pb-24 md:pt-24">
          <p className="font-display text-sm font-semibold tracking-[0.22em] uppercase opacity-80">
            {site.name}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] font-semibold md:text-6xl">
            Clinical testing and lab supply, under one roof.
          </h1>
          <p className="mt-5 max-w-xl text-base opacity-90 md:text-lg">
            Diagnostic services for patients and referring clinics - and the equipment, utensils and
            consumables hospitals need to keep diagnostics running across Central and East Africa.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/book">
                Book a test
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/laboratory">Browse equipment</Link>
            </Button>
          </div>
          <p className="mt-8 text-xs tracking-[0.16em] uppercase opacity-70">
            {site.positioning}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Start here</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Two ways first-time visitors work with us</h2>
        </div>
        <div className="mt-10 grid gap-0 border border-border lg:grid-cols-2">
          <Link
            to="/services"
            className="group border-b border-border bg-card p-8 transition-colors hover:bg-primary-soft lg:border-b-0 lg:border-r"
          >
            <FlaskConical className="size-7 text-primary transition-transform group-hover:translate-y-[-2px]" aria-hidden />
            <h3 className="mt-5 font-display text-2xl font-semibold">Diagnostics</h3>
            <p className="mt-3 max-w-md text-muted-foreground">
              Haematology, chemistry, microbiology and histopathology - with published cash tariffs
              in ZMW and referral workflows for clinics.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              View services & prices
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
          <Link
            to="/laboratory"
            className="group bg-card p-8 transition-colors hover:bg-primary-soft"
          >
            <Package className="size-7 text-primary transition-transform group-hover:translate-y-[-2px]" aria-hidden />
            <h3 className="mt-5 font-display text-2xl font-semibold">Equipment & supply</h3>
            <p className="mt-3 max-w-md text-muted-foreground">
              Analysers, sample handling, clinic devices and consumables - quoted, installed and
              supported for hospitals and laboratories.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Browse the catalogue
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow text-primary">Clinical menu</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                {tariffs.length}+ tests on the cash menu
              </h2>
              <p className="mt-3 text-muted-foreground">
                A snapshot of popular panels. Browse the full department menus and prices on the
                services page.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/services">Full services menu</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {(featured.length > 0 ? featured : tariffs.slice(0, 6)).map((test) => (
              <div key={test.code} className="bg-card p-5">
                <p className="font-mono text-xs text-primary">{test.code}</p>
                <h3 className="mt-2 font-display text-base font-semibold">{test.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{test.category}</p>
                <p className="mt-4 font-display text-xl font-semibold">
                  {formatZmw(test.priceVatZmw || test.priceCashZmw)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {clinicalDepartments.map((dept) => (
              <Link
                key={dept.id}
                to="/services/$slug"
                params={{ slug: dept.id }}
                className="border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {dept.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="eyebrow text-primary">How it works</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
          From first enquiry to results or delivery
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="border-t border-border pt-6">
              <p className="font-display text-sm font-semibold tracking-[0.18em] text-primary">
                {step.n}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative isolate overflow-hidden">
        <img
          src={labImage}
          alt=""
          width={1600}
          height={1008}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-deep/90" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 text-primary-foreground lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="eyebrow opacity-70">Referring clinics</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
              Send patients or samples with a clear handover
            </h2>
            <p className="mt-4 max-w-xl opacity-85">
              Book a panel for your patient, drop specimens at our hub, or ask about equipment and
              consumables for your laboratory — we confirm prep, timing and reporting with you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button asChild size="lg">
              <Link to="/book">Book a test</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/enterprise">For institutions</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="eyebrow text-primary">Why AKILI</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
              A single partner for testing and the systems behind it
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {[
              "Cash tariffs for walk-in and referral testing",
              "Lab equipment distribution with install and training",
              "Six-market presence across Central and East Africa",
            ].map((item) => (
              <li key={item} className="border-t border-border pt-4 text-sm text-muted-foreground">
                <ShieldCheck className="mb-3 size-5 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-clinical text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-16 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Ready to book or equip?</h2>
            <p className="mt-3 max-w-xl opacity-85">
              Talk to sales about a diagnostic panel, a lab fit-out, or an institutional account.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={`tel:${site.phone}`}>
                <Phone className="size-4" aria-hidden />
                Call {site.phone}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/quote">Request a quote</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
