import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBrandBySlug, getLabProductByCode, labTests } from "@/lib/site-data";

export const Route = createFileRoute("/laboratory/$code")({
  loader: ({ params }) => {
    const product = getLabProductByCode(params.code);
    if (!product) throw notFound();
    const brand = getBrandBySlug(product.brandSlug);
    const related = labTests
      .filter((item) => item.category === product.category && item.code !== product.code)
      .slice(0, 3);
    return { product, brand, related };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) return { meta: [{ title: "Equipment - AKILI LABS" }] };
    return {
      meta: [
        { title: `${product.name} (${product.code}) - AKILI LABS` },
        { name: "description", content: product.summary },
        { property: "og:title", content: `${product.name} - AKILI LABS` },
        { property: "og:description", content: product.summary },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/laboratory/${product.code}` },
      ],
      links: [{ rel: "canonical", href: `/laboratory/${product.code}` }],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product, brand, related } = Route.useLoaderData();

  return (
    <>
      <PageHero
        eyebrow={product.category}
        title={product.name}
        description={product.summary}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/quote">Request a quote</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/laboratory">
              <ArrowLeft className="size-4" aria-hidden />
              Back to catalogue
            </Link>
          </Button>
        </div>
      </PageHero>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.code}</Badge>
            {brand ? (
              <Link
                to="/brands/$slug"
                params={{ slug: brand.slug }}
                className="text-sm font-medium text-primary hover:underline"
              >
                {product.brand}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">{product.brand}</span>
            )}
          </div>

          <h2 className="mt-6 text-2xl font-semibold">Specifications</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Specs", value: product.sample },
              { label: "Includes", value: product.preparation },
              { label: "Lead time", value: product.turnaround },
              { label: "Warranty", value: product.warranty },
            ].map((row) => (
              <div key={row.label} className="rounded-sm border border-border bg-card p-4">
                <dt className="text-xs text-muted-foreground">{row.label}</dt>
                <dd className="mt-1 text-sm font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-10 text-2xl font-semibold">Key features</h2>
          <ul className="mt-4 space-y-3">
            {product.features.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-2xl font-semibold">From ${product.price}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Indicative list price. Volume, configuration and service contracts quoted separately.
          </p>

          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold">Related in {product.category}</h2>
              <ul className="mt-4 space-y-3">
                {related.map((item) => (
                  <li key={item.code}>
                    <Link
                      to="/laboratory/$code"
                      params={{ code: item.code }}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      {item.name}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <RequestForm
            variant="quote"
            options={[product.name, product.category]}
            optionLabel="Equipment"
            defaultOption={product.name}
          />
        </div>
      </section>
    </>
  );
}
