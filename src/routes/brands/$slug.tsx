import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { getBrandBySlug, labTests } from "@/lib/site-data";

export const Route = createFileRoute("/brands/$slug")({
  loader: ({ params }) => {
    const brand = getBrandBySlug(params.slug);
    if (!brand) throw notFound();
    return {
      brand,
      products: labTests.filter((item) => brand.productCodes.includes(item.code)),
    };
  },
  head: ({ loaderData }) => {
    const brand = loaderData?.brand;
    if (!brand) return { meta: [{ title: "Brand - AKILI LABS" }] };
    return {
      meta: [
        { title: `${brand.name} - AKILI LABS` },
        { name: "description", content: brand.summary },
        { property: "og:title", content: `${brand.name} - AKILI LABS` },
        { property: "og:description", content: brand.summary },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/brands/${brand.slug}` },
      ],
      links: [{ rel: "canonical", href: `/brands/${brand.slug}` }],
    };
  },
  component: BrandDetailPage,
});

function BrandDetailPage() {
  const { brand, products } = Route.useLoaderData();

  return (
    <>
      <PageHero eyebrow="Brand" title={brand.name} description={brand.summary}>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/quote">Request a quote</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/brands">
              <ArrowLeft className="size-4" aria-hidden />
              All brands
            </Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm text-primary">{brand.focus}</p>
        <h2 className="mt-3 text-3xl font-semibold">Catalogue items</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <article
              key={product.code}
              className="rounded-sm border border-border bg-card p-6 shadow-card"
            >
              <p className="text-xs text-muted-foreground">{product.code}</p>
              <h3 className="mt-1 font-display text-lg font-semibold">{product.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{product.summary}</p>
              <p className="mt-4 text-sm font-medium">From ${product.price}</p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/laboratory/$code" params={{ code: product.code }}>
                  Product details
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
