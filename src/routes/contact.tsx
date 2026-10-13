import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";
import { Button } from "@/components/ui/button";
import { locations, site } from "@/lib/site-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Locations - AKILI LABS" },
      {
        name: "description",
        content:
          "Contact AKILI LABS sales by phone, WhatsApp or form. Find showrooms, warehouses and opening hours.",
      },
      { property: "og:title", content: "Contact & Locations - AKILI LABS" },
      {
        property: "og:description",
        content: "Reach AKILI LABS for equipment quotes, demos and after-sales support.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AKILI LABS",
          telephone: "+260-211-000-000",
          email: "kangpethias@gmail.com",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Lusaka",
            addressCountry: "ZM",
          },
          areaServed: [
            "Zambia",
            "Malawi",
            "Mozambique",
            "Tanzania",
            "Central African Republic",
            "Kenya",
          ],
          openingHours: "Mo-Fr 08:00-18:00",
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact and locations"
        description="Sales and distribution support for laboratory equipment, medical devices and consumables."
      />

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-sm border border-border bg-card p-6">
            <Phone className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-base font-semibold">Sales desk</h2>
            <a href={`tel:${site.phone}`} className="mt-2 block text-sm hover:underline">
              {site.phone}
            </a>
          </article>
          <article className="rounded-sm border border-border bg-card p-6">
            <MessageCircle className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-base font-semibold">WhatsApp</h2>
            <Button asChild variant="link" className="mt-1 h-auto p-0 text-sm">
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">
                Start a chat
              </a>
            </Button>
          </article>
          <article className="rounded-sm border border-border bg-card p-6">
            <Mail className="size-6 text-primary" aria-hidden />
            <h2 className="mt-4 font-display text-base font-semibold">Email</h2>
            <a href={`mailto:${site.email}`} className="mt-2 block text-sm break-all hover:underline">
              {site.email}
            </a>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 lg:grid-cols-[1fr_440px]">
        <div>
          <p className="eyebrow text-primary">Visit us</p>
          <h2 className="mt-3 text-3xl font-semibold">Hubs and showrooms</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {locations.map((loc) => (
              <article key={loc.name} className="rounded-sm border border-border bg-card p-6 shadow-card">
                <h3 className="font-display text-base font-semibold">{loc.name}</h3>
                <p className="mt-1 text-xs text-primary">{loc.type}</p>
                <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {loc.address}
                </p>
                <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {loc.hours}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-5">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                  </a>
                </Button>
              </article>
            ))}
          </div>
        </div>

        <RequestForm
          variant="contact"
          options={[
            "General enquiry",
            "Quote request",
            "Demo booking",
            "Service & parts",
            "Feedback",
          ]}
          optionLabel="Reason for contact"
        />
      </section>
    </>
  );
}
