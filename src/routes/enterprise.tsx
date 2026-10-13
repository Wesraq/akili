import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  BarChart3,
  DatabaseBackup,
  Gauge,
  Layers,
  LifeBuoy,
  Lock,
  Network,
  Search,
  Users,
} from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { enterpriseCapabilities } from "@/lib/site-data";

export const Route = createFileRoute("/enterprise")({
  head: () => ({
    meta: [
      { title: "For Institutions - AKILI LABS" },
      {
        name: "description",
        content:
          "Multi-site procurement, installation, training and service programmes for hospitals, clinic groups and diagnostic laboratory networks from AKILI LABS.",
      },
      { property: "og:title", content: "For Institutions - AKILI LABS" },
      {
        property: "og:description",
        content:
          "Institutional supply programmes: catalogues, commissioning, service SLAs and multi-site logistics.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/enterprise" },
    ],
    links: [{ rel: "canonical", href: "/enterprise" }],
  }),
  component: EnterprisePage,
});

const pillars = [
  {
    icon: Layers,
    title: "Standardised catalogues",
    body: "Approved SKUs across sites so procurement and biomedical teams work from one source of truth.",
  },
  {
    icon: Users,
    title: "Account teams",
    body: "Named account managers for lab, imaging and clinic devices with escalation paths for urgent orders.",
  },
  {
    icon: Network,
    title: "Multi-site logistics",
    body: "Coordinated deliveries, staging warehouses and cold-chain for reagents across your network.",
  },
  {
    icon: Lock,
    title: "Compliance documentation",
    body: "Certificates, manuals and IQ/OQ packs ready for accreditation and internal audit.",
  },
  {
    icon: BarChart3,
    title: "Usage & spend visibility",
    body: "Order history, consumable run-rates and renewal forecasts for finance and biomedical leads.",
  },
  {
    icon: Gauge,
    title: "Uptime focus",
    body: "Service SLAs, loaner options where available and priority parts for critical platforms.",
  },
  {
    icon: Search,
    title: "Needs assessment",
    body: "Site surveys and capacity planning before you commit to analysers or imaging systems.",
  },
  {
    icon: Accessibility,
    title: "Training programmes",
    body: "Operator and biomedical engineer sessions at handover and as refresher modules.",
  },
  {
    icon: DatabaseBackup,
    title: "Lifecycle planning",
    body: "Warranty tracking, refresh cycles and trade-in options for ageing fleets.",
  },
  {
    icon: LifeBuoy,
    title: "Dedicated support",
    body: "Monitored response channels and a named account contact with defined SLAs.",
  },
];

const phases = [
  {
    phase: "01",
    name: "Discovery & requirements",
    body: "Workshops with biomedical, lab and procurement teams; site readiness and budget mapping.",
  },
  {
    phase: "02",
    name: "Specification & quote",
    body: "Bill of materials, options for install/training and multi-year service proposals.",
  },
  {
    phase: "03",
    name: "Supply & install",
    body: "Delivery staging, commissioning, IQ/OQ support and operator training.",
  },
  {
    phase: "04",
    name: "Handover & assurance",
    body: "Documentation pack, acceptance sign-off and warranty registration.",
  },
  {
    phase: "05",
    name: "Operate & renew",
    body: "Preventive maintenance, consumable contracts and planned equipment refresh.",
  },
];

function EnterprisePage() {
  return (
    <>
      <PageHero
        eyebrow="Institutional supply"
        title="Built for hospitals, clinics and lab networks"
        description="AKILI LABS distributes medical and laboratory equipment at scale to clinics, hospitals and lab networks."
      >
        <Button asChild size="lg" variant="secondary">
          <Link to="/contact">Talk to institutional sales</Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {enterpriseCapabilities.map((cap) => (
            <article key={cap.title} className="rounded-sm border border-border bg-card p-7 shadow-card">
              <cap.icon className="size-6 text-primary" aria-hidden />
              <h2 className="mt-4 font-display text-lg font-semibold">{cap.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{cap.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="eyebrow text-primary">Capabilities</p>
          <h2 className="mt-3 text-3xl font-semibold">How we support institutions</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-sm border border-border bg-card p-6">
                <pillar.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-sm font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="eyebrow text-primary">Delivery</p>
        <h2 className="mt-3 text-3xl font-semibold">How a supply programme runs</h2>
        <ol className="mt-10 space-y-4">
          {phases.map((phase) => (
            <li
              key={phase.phase}
              className="grid gap-4 rounded-sm border border-border bg-card p-6 sm:grid-cols-[80px_1fr] sm:items-start"
            >
              <span className="font-display text-3xl font-semibold text-primary/40">{phase.phase}</span>
              <div>
                <h3 className="font-display text-lg font-semibold">{phase.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{phase.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="surface-clinical text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-16 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Ready to equip your network?</h2>
            <p className="mt-3 max-w-xl opacity-85">
              Lab fit-outs, imaging fleets or multi-site device standards - we supply and support
              the equipment your clinics, hospitals and labs need to operate.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/contact">Start a conversation</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
