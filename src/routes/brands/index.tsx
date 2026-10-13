import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { brands, labTests } from "@/lib/site-data";

export const Route = createFileRoute("/brands/")({
  head: () => ({
    meta: [
      { title: "Brands We Distribute - AKILI LABS" },
      {
        name: "description",
        content:
          "Browse brands and platforms distributed by AKILI LABS: haematology, chemistry, molecular, immunoassay, histopathology and containment systems.",
      },
      { property: "og:title", content: "Brands We Distribute - AKILI LABS" },
      {
        property: "og:description",
        content: "Equipment brands and platforms supplied to laboratories across Central and East Africa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/brands" },
    ],
    links: [{ rel: "canonical", href: "/brands" }],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title="Brands & platforms"
        description="Platforms we source and support for hospital labs and diagnostic centres. Ask sales for current availability in your market."
      >
        <Button asChild size="lg" variant="secondary">
          <Link to="/quote">Request a brand quote</Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => {
            const products = labTests.filter((item) => brand.productCodes.includes(item.code));
            return (
              <article
                key={brand.slug}
                className="flex flex-col rounded-sm border border-border bg-card p-6 shadow-card"
              >
                <p className="text-xs font-medium tracking-wide text-primary uppercase">{brand.focus}</p>
                <h2 className="mt-2 font-display text-xl font-semibold">{brand.name}</h2>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{brand.summary}</p>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {products.map((product) => (
                    <li key={product.code}>{product.name}</li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link to="/brands/$slug" params={{ slug: brand.slug }}>
                    View brand
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
