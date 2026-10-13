import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CreditCard, Package, MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/site/PageHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { announcements, faqs, equipmentPackages } from "@/lib/site-data";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources, Packages & FAQs - AKILI LABS" },
      {
        name: "description",
        content:
          "Equipment packages, procurement guidance and FAQs for clinics and hospitals buying laboratory equipment from AKILI LABS.",
      },
      { property: "og:title", content: "Resources & Equipment Packages - AKILI LABS" },
      {
        property: "og:description",
        content: "Packages, procurement tips and FAQs for AKILI LABS customers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/resources" },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }),
      },
    ],
  }),
  component: ResourcesPage,
});

const resources = [
  {
    icon: BookOpen,
    title: "Before you order",
    body: "Site readiness, power and space requirements, and documentation needed for capital equipment quotes.",
  },
  {
    icon: CreditCard,
    title: "Procurement & payment",
    body: "Purchase orders, institutional billing, staged payments for large fit-outs and warranty terms.",
  },
  {
    icon: Package,
    title: "Delivery & handover",
    body: "Lead times, installation options, training schedules and after-sales service plans.",
  },
];

function ResourcesPage() {
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Buyer resources"
        title="Packages, guidance and FAQs"
        description="Ready-made equipment packages and answers for hospitals, clinics and labs sourcing from AKILI LABS."
      />

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="eyebrow text-primary">Notices</p>
          <ul className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted-foreground">
            {announcements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="eyebrow text-primary">Bundles</p>
        <h2 className="mt-3 text-3xl font-semibold">Equipment packages</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {equipmentPackages.map((pack) => (
            <article
              key={pack.name}
              className={`rounded-sm border bg-card p-7 ${
                pack.featured ? "border-primary shadow-lift" : "border-border shadow-card"
              }`}
            >
              {pack.featured && <Badge className="mb-4">Most requested</Badge>}
              <h3 className="font-display text-xl font-semibold">{pack.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pack.for}</p>
              <p className="mt-5 font-display text-3xl font-semibold text-primary">${pack.price}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {pack.includes.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
              <Button asChild className="mt-7 w-full" variant={pack.featured ? "default" : "outline"}>
                <Link to="/quote">Request this package</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-primary-soft">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {resources.map((resource) => (
              <article key={resource.title} className="rounded-sm border border-border bg-card p-6">
                <resource.icon className="size-6 text-primary" aria-hidden />
                <h2 className="mt-4 font-display text-base font-semibold">{resource.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{resource.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow text-primary">Answers</p>
          <h2 className="mt-3 text-3xl font-semibold">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-left font-display text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="rounded-sm border border-border bg-card p-7 shadow-card">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
            <MessageSquare className="size-5 text-primary" aria-hidden />
            Share your feedback
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us how we can improve quotes, delivery and after-sales support.
          </p>

          {sent ? (
            <p className="mt-8 rounded-sm bg-primary-soft p-6 text-sm">
              Thank you. Your feedback has been logged for the sales and service team.
            </p>
          ) : (
            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (rating === 0) {
                  toast.error("Please select a rating.");
                  return;
                }
                setSent(true);
                toast.success("Feedback submitted");
              }}
            >
              <fieldset>
                <legend className="text-sm font-medium">How was your experience with us?</legend>
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`${value} star${value > 1 ? "s" : ""}`}
                      aria-pressed={rating === value}
                      className="rounded-sm p-1"
                    >
                      <Star
                        className={`size-7 ${
                          value <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                        }`}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-5 grid gap-2">
                <Label htmlFor="feedback">Your comments</Label>
                <Textarea
                  id="feedback"
                  rows={5}
                  placeholder="Tell us what went well or what we can improve"
                />
              </div>
              <Button type="submit" className="mt-5 w-full">
                Submit feedback
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

