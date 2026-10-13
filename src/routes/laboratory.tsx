import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, FlaskConical, Search, ShieldCheck, Truck, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import labImage from "@/assets/lab.jpg";
import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { labCategories, labTests, locations } from "@/lib/site-data";

export const Route = createFileRoute("/laboratory")({
  head: () => ({
    meta: [
      { title: "Laboratory Equipment Catalogue - AKILI LABS" },
      {
        name: "description",
        content:
          "Browse AKILI LABS laboratory equipment: analysers, sample handling, microbiology, immunology, molecular and histopathology systems with indicative pricing and lead times.",
      },
      { property: "og:title", content: "Laboratory Equipment Catalogue - AKILI LABS" },
      {
        property: "og:description",
        content:
          "Lab analysers and systems supplied, installed and supported by AKILI LABS - not a diagnostic testing service.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/laboratory" },
    ],
    links: [{ rel: "canonical", href: "/laboratory" }],
  }),
  component: LaboratoryPage,
});

function LaboratoryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const results = useMemo(
    () =>
      labTests.filter((test) => {
        const matchesQuery =
          query.trim() === "" ||
          `${test.name} ${test.code} ${test.category}`.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "all" || test.category === category;
        return matchesQuery && matchesCategory;
      }),
    [query, category],
  );

  return (
    <>
      <PageHero
        eyebrow="Laboratory supply"
        title="Lab equipment catalogue"
        description="Analysers, sample handling and specialty laboratory systems we distribute to hospitals and diagnostic labs - with install and after-sales support."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/laboratory" hash="directory">
              Browse catalogue
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/quote">Request a quote</Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: FlaskConical,
              title: "Full lab workflows",
              body: "From pre-analytics and analysers to molecular and histopathology platforms.",
            },
            {
              icon: Clock,
              title: "Published lead times",
              body: "Every catalogue item lists typical delivery windows so procurement can plan.",
            },
            {
              icon: Truck,
              title: "Install & logistics",
              body: "Delivery, commissioning options and cold-chain for reagents where required.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-sm border border-border bg-card p-6 shadow-card">
              <item.icon className="size-6 text-primary" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="directory" className="mx-auto max-w-7xl scroll-mt-28 px-6 pb-16">
        <p className="eyebrow text-primary">Catalogue</p>
        <h2 className="mt-3 text-3xl font-semibold">Search equipment and specs</h2>

        <div className="mt-8 grid gap-4 rounded-sm border border-border bg-card p-6 shadow-card md:grid-cols-[2fr_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="testSearch">Search equipment</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="testSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. PCR, centrifuge, ANA-100"
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="testCategory">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="testCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {labCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-sm border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead>Includes</TableHead>
                <TableHead>Lead time</TableHead>
                <TableHead className="text-right">From</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((test) => (
                <TableRow key={test.code}>
                  <TableCell className="font-medium">
                    <Link
                      to="/laboratory/$code"
                      params={{ code: test.code }}
                      className="hover:text-primary hover:underline"
                    >
                      {test.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{test.code}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{test.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{test.sample}</TableCell>
                  <TableCell className="max-w-64 text-sm text-muted-foreground">
                    {test.preparation}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{test.turnaround}</TableCell>
                  <TableCell className="text-right text-sm font-medium">${test.price}</TableCell>
                </TableRow>
              ))}
              {results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No equipment matches that search. Contact sales for specialised or custom
                    configurations.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Prices are indicative list rates. Volume, configuration and service contracts are quoted
          separately.
        </p>
      </section>

      <section id="collection" className="scroll-mt-28 bg-primary-soft">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-primary">Demo & delivery</p>
            <h2 className="mt-3 text-3xl font-semibold">See it before you buy</h2>
            <p className="mt-4 text-muted-foreground">
              Request a showroom demo or on-site evaluation. We coordinate delivery, unpacking and
              optional installation for capital equipment.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "Showroom demonstrations by product category",
                "On-site evaluation for larger lab fit-outs",
                "Temperature-controlled shipping for reagents",
                "Handover packs with manuals and training notes",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <img
              src={labImage}
              alt="Laboratory equipment supplied and supported by AKILI LABS"
              width={1600}
              height={1008}
              loading="lazy"
              className="mt-8 rounded-sm shadow-card"
            />
          </div>
          <RequestForm variant="collection" options={labCategories} optionLabel="Equipment category" />
        </div>
      </section>

      <section id="results" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-primary">After sales</p>
            <h2 className="mt-3 text-3xl font-semibold">Service, parts and training</h2>
            <p className="mt-4 text-muted-foreground">
              Keep platforms running with preventive maintenance, calibrated spare parts and
              operator refresher training. Service plans are available with most capital purchases.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Wrench className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                Scheduled preventive maintenance and call-outs
              </li>
              <li className="flex gap-2">
                <Wrench className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                Genuine / approved spare parts stocking
              </li>
              <li className="flex gap-2">
                <Wrench className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                Operator training at handover and as needed
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/service">Service & warranty</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Talk to sales support</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-8 shadow-card">
            <h3 className="font-display text-lg font-semibold">Hubs & showrooms</h3>
            <ul className="mt-5 space-y-5">
              {locations.map((loc) => (
                <li key={loc.name} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-xs text-primary">{loc.type}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{loc.address}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{loc.hours}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
