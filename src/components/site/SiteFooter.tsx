import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/site/BrandLogo";
import { site } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary-deep text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo
            variant="dark"
            markClassName="size-12"
            wordmarkClassName="text-primary-foreground"
            tagline={site.tagline}
            taglineClassName="text-primary-foreground/70"
          />
          <p className="mt-4 max-w-xs text-sm opacity-80">
            Clinical testing and laboratory supply for clinics, hospitals and diagnostic labs across
            Central and East Africa.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary-foreground/10 px-3 py-2 text-xs">
            <ShieldCheck className="size-4" aria-hidden />
            {site.positioning}
          </p>
        </div>

        <nav aria-label="Catalogue" className="text-sm">
          <h2 className="eyebrow opacity-70">Services & catalogue</h2>
          <ul className="mt-4 space-y-2.5 opacity-90">
            <li>
              <Link to="/services" className="hover:underline">
                All clinical services
              </Link>
            </li>
            <li>
              <Link to="/services/$slug" params={{ slug: "haematology" }} className="hover:underline">
                Haematology & coagulation
              </Link>
            </li>
            <li>
              <Link to="/services/$slug" params={{ slug: "chemistry" }} className="hover:underline">
                Clinical chemistry
              </Link>
            </li>
            <li>
              <Link
                to="/services/$slug"
                params={{ slug: "microbiology" }}
                className="hover:underline"
              >
                Microbiology & infectious disease
              </Link>
            </li>
            <li>
              <Link to="/services/$slug" params={{ slug: "histo" }} className="hover:underline">
                Histopathology & cytology
              </Link>
            </li>
            <li>
              <Link to="/laboratory" className="hover:underline">
                Lab equipment
              </Link>
            </li>
            <li>
              <Link to="/book" className="hover:underline">
                Book a test
              </Link>
            </li>
            <li>
              <Link to="/quote" className="hover:underline">
                Equipment quote
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company" className="text-sm">
          <h2 className="eyebrow opacity-70">Company</h2>
          <ul className="mt-4 space-y-2.5 opacity-90">
            <li>
              <Link to="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link to="/markets" className="hover:underline">
                Where we operate
              </Link>
            </li>
            <li>
              <Link to="/service" className="hover:underline">
                Service & warranty
              </Link>
            </li>
            <li>
              <Link to="/enterprise" className="hover:underline">
                For institutions
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact sales
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="eyebrow opacity-70">Contact</h2>
          <ul className="mt-4 space-y-3 opacity-90">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {site.address}
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`tel:${site.phone}`} className="hover:underline">
                {site.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`mailto:${site.email}`} className="hover:underline">
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs opacity-75 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link to="/privacy" className="hover:underline">
              Privacy policy
            </Link>
            <span aria-hidden>·</span>
            <Link to="/terms" className="hover:underline">
              Terms &amp; conditions
            </Link>
            <span aria-hidden>·</span>
            <Link to="/crm" className="opacity-60 hover:opacity-100 hover:underline">
              Staff sign-in
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
