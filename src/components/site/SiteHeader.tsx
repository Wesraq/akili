import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/site/BrandLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { clinicalServicePages } from "@/lib/clinical-services";
import { site } from "@/lib/site-data";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/laboratory", label: "Equipment" },
  { to: "/markets", label: "Markets" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(true);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="hidden bg-primary-deep text-primary-foreground lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-2 text-xs">
          <p className="opacity-90">{site.hours}</p>
          <div className="flex items-center gap-6">
            <a
              className="inline-flex items-center gap-2 opacity-90 transition-opacity hover:opacity-100"
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-3.5" aria-hidden />
              WhatsApp sales
            </a>
            <a className="inline-flex items-center gap-2 font-semibold" href={`tel:${site.phone}`}>
              <Phone className="size-3.5" aria-hidden />
              Sales {site.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo tagline={site.tagline} markClassName="size-11" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Services
                  <ChevronDown className="size-3.5 opacity-70" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[280px]">
                <DropdownMenuItem asChild>
                  <Link to="/services" className="cursor-pointer font-medium">
                    All clinical services
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {clinicalServicePages.map((service) => (
                  <DropdownMenuItem key={service.slug} asChild>
                    <Link
                      to="/services/$slug"
                      params={{ slug: service.slug }}
                      className="cursor-pointer"
                    >
                      <span className="flex flex-col gap-0.5">
                        <span>{service.title}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {service.summary}
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-sm px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/book">Book a test</Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] max-w-sm">
                <SheetTitle className="px-4 pt-4">
                  <BrandLogo tagline={site.tagline} />
                </SheetTitle>
                <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
                  <button
                    type="button"
                    className="flex items-center justify-between rounded-sm px-3 py-3 text-left text-sm font-medium hover:bg-secondary"
                    onClick={() => setMobileServicesOpen((value) => !value)}
                    aria-expanded={mobileServicesOpen}
                  >
                    Services
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        mobileServicesOpen ? "rotate-180" : "",
                      )}
                      aria-hidden
                    />
                  </button>
                  {mobileServicesOpen ? (
                    <div className="mb-1 ml-2 border-l border-border pl-3">
                      <Link
                        to="/services"
                        onClick={() => setOpen(false)}
                        className="block rounded-sm px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                      >
                        All clinical services
                      </Link>
                      {clinicalServicePages.map((service) => (
                        <Link
                          key={service.slug}
                          to="/services/$slug"
                          params={{ slug: service.slug }}
                          onClick={() => setOpen(false)}
                          className="block rounded-sm px-3 py-2.5 text-sm hover:bg-secondary"
                        >
                          {service.title}
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {nav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="rounded-sm px-3 py-3 text-sm font-medium hover:bg-secondary"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Button asChild className="mt-3">
                    <Link to="/book" onClick={() => setOpen(false)}>
                      Book a test
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="mt-2">
                    <Link to="/quote" onClick={() => setOpen(false)}>
                      Request a quote
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
