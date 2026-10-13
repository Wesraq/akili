import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, FileText, Mail } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { downloads, site } from "@/lib/site-data";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads - AKILI LABS" },
      {
        name: "description",
        content:
          "Request AKILI LABS catalogues, company profile, IQ/OQ checklists and service terms by email.",
      },
      { property: "og:title", content: "Downloads - AKILI LABS" },
      {
        property: "og:description",
        content: "Catalogues and technical documents for laboratory equipment procurement.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/downloads" },
    ],
    links: [{ rel: "canonical", href: "/downloads" }],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Downloads"
        description="Request catalogues and technical documents. Each link opens a prefilled email to our sales desk."
      >
        <Button asChild size="lg" variant="secondary">
          <a href={`mailto:${site.email}`}>
            <Mail className="size-4" aria-hidden />
            Email sales
          </a>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {downloads.map((doc) => (
            <article
              key={doc.title}
              className="flex flex-col rounded-sm border border-border bg-card p-6 shadow-card sm:flex-row sm:items-start sm:gap-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-primary-soft text-primary">
                <FileText className="size-5" aria-hidden />
              </span>
              <div className="mt-4 flex-1 sm:mt-0">
                <h2 className="font-display text-lg font-semibold">{doc.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {doc.type} · {doc.size}
                </p>
                <Button asChild variant="outline" className="mt-5">
                  <a href={doc.href}>
                    <Download className="size-4" aria-hidden />
                    Request file
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Looking for a specific datasheet?{" "}
          <Link to="/quote" className="font-medium text-primary hover:underline">
            Request a quote
          </Link>{" "}
          and include the model or SKU.
        </p>
      </section>
    </>
  );
}
