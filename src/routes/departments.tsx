import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShieldCheck, Truck, Wrench, Headphones } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { departments } from "@/lib/site-data";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Product Lines - AKILI LABS" },
      {
        name: "description",
        content:
          "Explore AKILI LABS product lines: cardiac equipment, imaging systems, surgical instruments, lab devices, maternity equipment and more.",
      },
      { property: "og:title", content: "Product Lines - AKILI LABS" },
      {
        property: "og:description",
        content: "Lab equipment and medical device categories distributed by AKILI LABS.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/departments" },
    ],
    links: [{ rel: "canonical", href: "/departments" }],
  }),
  component: DepartmentsPage,
});

const facilities = [
  {
    icon: Package,
    title: "Certified devices",
    body: "Medical and laboratory equipment from vetted manufacturers with documentation for procurement.",
  },
  {
    icon: Wrench,
    title: "Install & commission",
    body: "On-site installation, IQ/OQ support and operator training for capital equipment.",
  },
  {
    icon: Truck,
    title: "Logistics",
    body: "Warehouse stock, cold-chain for reagents and coordinated multi-site deliveries.",
  },
  {
    icon: Headphones,
    title: "After-sales service",
    body: "Preventive maintenance, spare parts and field support for uptime-critical systems.",
  },
];

function DepartmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title="Product lines"
        description="Product lines we distribute to clinics, hospitals and diagnostic laboratories - analysers, devices, imaging systems and consumables."
      >
        <Button asChild size="lg" variant="secondary">
          <Link to="/quote">Request a quote</Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {departments.map((dept) => (
            <article
              key={dept.slug}
              id={dept.slug}
              className="scroll-mt-28 rounded-sm border border-border bg-card p-7 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-12 place-items-center rounded-sm bg-primary-soft">
                  <dept.icon className="size-6 text-primary" aria-hidden />
                </div>
                <span className="text-xs text-muted-foreground">{dept.skuCount} SKUs in line</span>
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">{dept.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{dept.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {dept.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-3">
                <Button asChild size="sm">
                  <Link to="/quote">Request quote</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/markets">See where we operate</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="eyebrow text-primary">How we work</p>
          <h2 className="mt-3 text-3xl font-semibold">Supply, install, support</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((facility) => (
              <article key={facility.title} className="rounded-sm border border-border bg-card p-6">
                <facility.icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-base font-semibold">{facility.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{facility.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-accent" aria-hidden />
            AKILI LABS is a lab equipment distribution company serving clinics and hospitals.
          </p>
        </div>
      </section>
    </>
  );
}
