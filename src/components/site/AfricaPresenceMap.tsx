import { Link, useNavigate } from "@tanstack/react-router";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

import topology from "@/assets/countries-110m.json";
import {
  countries,
  getFeaturedClientsByCountrySlug,
  type CountryProfile,
} from "@/lib/site-data";
import { cn } from "@/lib/utils";

type CountryProperties = { name: string };
type CountriesTopology = Topology<{
  countries: GeometryCollection<CountryProperties>;
}>;

type AfricaFeature = Feature<Geometry, CountryProperties>;

const OPERATING_BY_ID: Record<string, string> = {
  "894": "zambia",
  "454": "malawi",
  "508": "mozambique",
  "834": "tanzania",
  "140": "central-african-republic",
  "404": "kenya",
};

const WIDTH = 720;
const HEIGHT = 780;

export function AfricaPresenceMap() {
  const navigate = useNavigate();
  const [activeSlug, setActiveSlug] = useState<string>("zambia");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { africaFeatures, pathGenerator } = useMemo(() => {
    if (!mounted) {
      return { africaFeatures: [] as AfricaFeature[], pathGenerator: null };
    }

    const topo = topology as unknown as CountriesTopology;
    const collection = feature(topo, topo.objects.countries) as FeatureCollection<
      Geometry,
      CountryProperties
    >;
    const projection = geoMercator()
      .center([18, 2])
      .scale(520)
      .translate([WIDTH / 2, HEIGHT / 2]);
    const pathGenerator = geoPath(projection);

    const africaFeatures = collection.features.filter((f) => {
      const bounds = pathGenerator.bounds(f as GeoPermissibleObjects);
      const x0 = bounds[0]?.[0];
      const y0 = bounds[0]?.[1];
      const x1 = bounds[1]?.[0];
      const y1 = bounds[1]?.[1];
      if (
        x0 === undefined ||
        y0 === undefined ||
        x1 === undefined ||
        y1 === undefined ||
        !Number.isFinite(x0)
      ) {
        return false;
      }
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      return cx > 40 && cx < WIDTH - 40 && cy > 20 && cy < HEIGHT - 20;
    });

    return { africaFeatures, pathGenerator };
  }, [mounted]);

  const activeCountry: CountryProfile | undefined = countries.find(
    (c) => c.slug === activeSlug,
  );
  const activeClients = getFeaturedClientsByCountrySlug(activeSlug);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <div className="rounded-sm border border-border bg-card p-4 shadow-card md:p-6">
        <p className="mb-3 text-sm text-muted-foreground">
          Hover a highlighted country to see major clients. Click to open the market profile.
        </p>
        {!mounted || !pathGenerator ? (
          <div className="flex aspect-[720/780] max-w-xl items-center justify-center rounded-sm bg-muted/40 text-sm text-muted-foreground">
            Loading Africa map…
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="Map of Africa showing AKILI LABS distribution markets"
            className="mx-auto h-auto w-full max-w-xl"
          >
            <rect width={WIDTH} height={HEIGHT} fill="transparent" />
            {africaFeatures.map((f) => {
              const id = String(f.id);
              const slug = OPERATING_BY_ID[id];
              const isOperating = Boolean(slug);
              const isActive = slug === activeSlug;
              const d = pathGenerator(f as GeoPermissibleObjects);
              if (!d) return null;

              if (!isOperating || !slug) {
                return (
                  <path
                    key={id}
                    d={d}
                    className="fill-muted stroke-background"
                    strokeWidth={0.6}
                    pointerEvents="none"
                  />
                );
              }

              return (
                <path
                  key={id}
                  d={d}
                  tabIndex={0}
                  role="link"
                  aria-label={`${f.properties.name}: major clients and market profile`}
                  className={cn(
                    "cursor-pointer stroke-background outline-none transition-all duration-200 focus-visible:stroke-accent focus-visible:stroke-2",
                    isActive
                      ? "fill-primary stroke-primary-foreground/40"
                      : "fill-primary/70 hover:fill-primary",
                  )}
                  strokeWidth={isActive ? 1.4 : 0.8}
                  onMouseEnter={() => setActiveSlug(slug)}
                  onFocus={() => setActiveSlug(slug)}
                  onClick={() =>
                    navigate({ to: "/markets/$slug", params: { slug } })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate({ to: "/markets/$slug", params: { slug } });
                    }
                  }}
                />
              );
            })}
          </svg>
        )}
        <ul className="mt-4 flex flex-wrap gap-2">
          {countries.map((country) => (
            <li key={country.slug}>
              <button
                type="button"
                onMouseEnter={() => setActiveSlug(country.slug)}
                onFocus={() => setActiveSlug(country.slug)}
                onClick={() => setActiveSlug(country.slug)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSlug === country.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-primary-soft",
                )}
              >
                {country.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <aside className="rounded-sm border border-border bg-card p-6 shadow-lift lg:sticky lg:top-28">
        {activeCountry ? (
          <>
            <p className="text-xs font-semibold tracking-wide text-primary">
              {activeCountry.code} · {activeCountry.hub}
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold">{activeCountry.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{activeCountry.focus}</p>

            <p className="eyebrow mt-8 text-primary">Major clients</p>
            <ul className="mt-4 space-y-3">
              {activeClients.length > 0 ? (
                activeClients.map((client) => (
                  <li
                    key={client.name}
                    className="rounded-sm border border-border bg-secondary/60 px-4 py-3"
                  >
                    <p className="font-display text-sm font-semibold">{client.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{client.type}</p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  Client list for this market is available on request.
                </li>
              )}
            </ul>

            <Link
              to="/markets/$slug"
              params={{ slug: activeCountry.slug }}
              className="mt-8 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Open {activeCountry.name} market profile →
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Hover a highlighted country on the map to see major clients.
          </p>
        )}
      </aside>
    </div>
  );
}
