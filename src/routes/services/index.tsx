import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FlaskConical, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublishedTariffs } from "@/crm/fns/clinical-tests.server";
import {
  clinicalDepartments,
  clinicalMenuVatNote,
  formatZmw,
  testsForDepartment,
} from "@/lib/clinical-menu";
import { clinicalServicePages } from "@/lib/clinical-services";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services/")({
  loader: () => listPublishedTariffs(),
  head: () => ({
    meta: [
      { title: "Clinical Services & Test Menu - AKILI LABS" },
      {
        name: "description",
        content:
          "AKILI LABS clinical laboratory services with published ZMW tariffs for haematology, chemistry, microbiology and histopathology, plus equipment supply.",
      },
      { property: "og:title", content: "Clinical Services - AKILI LABS" },
      {
        property: "og:description",
        content: "Book diagnostic tests or enquire about laboratory equipment and supply.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const tariffs = Route.useLoaderData();
  const [activeDept, setActiveDept] = useState<(typeof clinicalDepartments)[number]["id"]>(
    "haematology",
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const department = clinicalDepartments.find((item) => item.id === activeDept)!;
  const deptTests = useMemo(
    () => testsForDepartment(tariffs, activeDept),
    [tariffs, activeDept],
  );
  const needle = query.trim().toLowerCase();
  const searching = needle.length > 0;

  const categories = useMemo(() => {
    const source = searching ? tariffs : deptTests;
    return ["all", ...Array.from(new Set(source.map((test) => test.category)))];
  }, [deptTests, tariffs, searching]);

  const filtered = useMemo(() => {
    const pool = searching ? tariffs : deptTests;
    return pool.filter((test) => {
      if (category !== "all" && test.category !== category) return false;
      if (!needle) return true;
      return (
        test.code.toLowerCase().includes(needle) ||
        test.name.toLowerCase().includes(needle) ||
        test.category.toLowerCase().includes(needle)
      );
    });
  }, [deptTests, tariffs, query, category, needle, searching]);

  return (
    <>
      <PageHero
        eyebrow="Clinical services"
        title="Diagnostic testing with clear cash prices"
        description="Walk-in and referral laboratory services across haematology, chemistry, microbiology and histopathology. Browse the menu below, then book a test or ask your clinician to refer."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <a href="#menu">Browse test menu</a>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/book">Book a test</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/quote">Equipment quote</Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Service lines</p>
          <h2 className="mt-3 text-3xl font-semibold">Clinical departments</h2>
          <p className="mt-4 text-muted-foreground">
            Open a service for details, sample notes and laboratory photography, or browse the full
            cash tariff below.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {clinicalServicePages.map((service) => (
            <Link
              key={service.slug}
              to="/services/$slug"
              params={{ slug: service.slug }}
              className="group overflow-hidden border border-border bg-card transition-colors hover:border-primary/40"
            >
              <img
                src={service.heroImage}
                alt={service.heroAlt}
                width={900}
                height={560}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold group-hover:text-primary">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{service.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  View service
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-14 grid gap-8 border-t border-border pt-10 lg:grid-cols-3">
          <article>
            <FlaskConical className="size-6 text-primary" aria-hidden />
            <h3 className="mt-4 font-display text-xl font-semibold">Diagnostic laboratory</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {tariffs.length} tests with cash tariffs in ZMW for individuals, clinics and
              institutional programmes.
            </p>
          </article>
          <article>
            <h3 className="font-display text-xl font-semibold">Sample & referral flow</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Walk-in collection, clinician referrals and result reporting - coordinated through our
              Lusaka hub and partner facilities.
            </p>
          </article>
          <article>
            <Package className="size-6 text-primary" aria-hidden />
            <h3 className="mt-4 font-display text-xl font-semibold">Equipment & supply</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              When you need analysers, utensils or consumables, we quote, deliver, install and
              support your laboratory.
            </p>
            <Link
              to="/laboratory"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Open equipment catalogue
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </article>
        </div>
      </section>

      <section id="menu" className="scroll-mt-24 bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow text-primary">Test menu</p>
              <h2 className="mt-3 text-3xl font-semibold">Current cash tariff</h2>
              <p className="mt-3 text-sm text-muted-foreground">{clinicalMenuVatNote}</p>
            </div>
            <Button asChild>
              <Link to="/book">Book a test</Link>
            </Button>
          </div>

          {tariffs.length === 0 ? (
            <p className="mt-10 border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Test prices will appear here shortly. Call or WhatsApp us for the current cash tariff.
            </p>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap gap-2">
                {clinicalDepartments.map((dept) => (
                  <button
                    key={dept.id}
                    id={dept.id}
                    type="button"
                    onClick={() => {
                      setActiveDept(dept.id);
                      setCategory("all");
                      setQuery("");
                    }}
                    className={cn(
                      "scroll-mt-28 border px-4 py-2 text-sm font-medium transition-colors",
                      activeDept === dept.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {dept.title}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <p className="max-w-3xl text-sm text-muted-foreground">{department.summary}</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/services/$slug" params={{ slug: activeDept }}>
                    Service details
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search all tests…"
                    className="bg-card pl-9"
                    aria-label="Search tests"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={cn(
                        "border px-3 py-2 text-xs font-medium transition-colors",
                        category === item
                          ? "border-primary bg-primary-soft text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {item === "all" ? "All" : item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 overflow-x-auto border border-border bg-card">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Test</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Cash</th>
                      <th className="px-4 py-3 font-medium text-right">VAT incl.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((test) => (
                      <tr key={test.code} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{test.code}</td>
                        <td className="px-4 py-3 font-medium">{test.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{test.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatZmw(test.priceCashZmw)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatZmw(test.priceVatZmw)}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                          No tests match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {searching
                  ? `Showing ${filtered.length} of ${tariffs.length} across all departments.`
                  : `Showing ${filtered.length} of ${deptTests.length} in ${department.title}.`}{" "}
                Insurance and scheme rates available on request.
              </p>
            </>
          )}
        </div>
      </section>

      <section id="book" className="scroll-mt-24 mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-primary">Get started</p>
          <h2 className="mt-3 text-3xl font-semibold">Book a test or ask about supply</h2>
          <p className="mt-4 text-muted-foreground">
            Book a diagnostic appointment below, or request an equipment quote if you need
            analysers, devices or consumables.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>· Individual and institutional testing</li>
            <li>· Referral support for clinics and hospitals</li>
            <li>· Equipment supply, install and after-sales support</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/book">Book a test</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/quote">Equipment quote</Link>
            </Button>
          </div>
        </div>
        <RequestForm
          variant="booking"
          options={[
            ...clinicalDepartments.map((dept) => dept.title),
            "Not sure — please advise",
          ]}
          optionLabel="Test department"
          defaultOption={clinicalDepartments[0]?.title ?? ""}
          tests={tariffs}
        />
      </section>
    </>
  );
}
