import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site-data";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions - AKILI LABS" },
      {
        name: "description",
        content:
          "Terms governing use of the AKILI LABS website, laboratory test bookings, quotes and equipment supply enquiries.",
      },
      { property: "og:title", content: "Terms & Conditions - AKILI LABS" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

const sections = [
  {
    title: "Agreement",
    body: [
      `These terms apply when you use the ${site.name} website, submit a booking or quote request, or purchase laboratory testing or equipment supply services from us.`,
      "By continuing to use the site or submitting a form, you agree to these terms. If you do not agree, please do not use the site or submit a request.",
    ],
  },
  {
    title: "Who we are",
    body: [
      `${site.name} provides clinical laboratory diagnostics and distributes laboratory equipment, devices and consumables. We are not a hospital and we do not replace your treating clinician.`,
      `Contact: ${site.email} · ${site.phone} · ${site.address}.`,
    ],
  },
  {
    title: "Website use",
    body: [
      "You may browse published information for personal or organisational use. You must not misuse the site (including attempting to disrupt it, scrape it abusively, or submit false or harmful content).",
      "Tariffs, product descriptions and availability on the website are guides only and may change without notice until confirmed by us in writing.",
    ],
  },
  {
    title: "Test bookings",
    body: [
      "Submitting a booking request does not guarantee an appointment until we confirm it. You (or the referring facility) are responsible for providing accurate patient and sample details.",
      "Some tests require fasting, a specific sample type or a clinician request. We may decline or reschedule a booking if preparation or sample requirements are not met.",
      "Results are issued to the patient, referring clinician or facility named on the request. Turnaround times are estimates and may vary with sample quality, equipment and referral volume.",
    ],
  },
  {
    title: "Samples and referrals",
    body: [
      "Samples delivered by patients, clinics or hospitals must be correctly labelled, capped and packed. We may reject samples that are mislabelled, leaking, unsuitable for the test, or outside acceptance criteria.",
      "Referring facilities remain responsible for obtaining any consent needed from their patients before sending samples or personal information to us.",
    ],
  },
  {
    title: "Equipment quotes and supply",
    body: [
      "Quotes for equipment, consumables, install or training are invitations to treat until we issue a formal quotation or order confirmation. Prices, lead times and warranty terms in a confirmed quote prevail over website text.",
      "Delivery, installation, training and after-sales support follow the scope set out in the accepted quote, purchase order or supply agreement.",
    ],
  },
  {
    title: "Payments",
    body: [
      "Laboratory tests and equipment sales are payable according to the invoice or quotation we issue. Institutional purchase orders and staged payments may be agreed in writing. Late or incomplete payment may delay testing, release of results or delivery.",
    ],
  },
  {
    title: "Clinical responsibility",
    body: [
      "Laboratory results support clinical decisions; they do not themselves constitute a diagnosis or prescription. Interpretation and treatment remain the responsibility of the requesting clinician or care provider.",
    ],
  },
  {
    title: "Liability",
    body: [
      "To the fullest extent permitted by law, we are not liable for indirect or consequential loss (including loss of profit or business interruption) arising from website use, delayed results or supply lead times.",
      "Nothing in these terms excludes liability that cannot be excluded under applicable law, including for fraud or death or personal injury caused by negligence where such exclusion is prohibited.",
    ],
  },
  {
    title: "Privacy",
    body: [
      "Personal information is handled as described in our Privacy policy. By submitting a form you also consent to us contacting you about that request.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update these terms from time to time. The “Last updated” date will change when we do. Continued use of the website after an update constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "Governing law",
    body: [
      "These terms are governed by the laws of Zambia, without prejudice to mandatory consumer protections that may apply in your country of residence. Disputes will first be addressed in good faith between the parties.",
    ],
  },
] as const;

function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & conditions"
        description="The rules that apply when you use our website, book a laboratory test or request equipment supply from AKILI LABS."
      />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Last updated: 30 September 2026</p>
        <p className="mt-4 text-sm text-muted-foreground">
          For institutional contracts, the signed quotation, purchase order or supply agreement
          takes priority where it conflicts with this page.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="font-display text-xl font-semibold">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Read our{" "}
          <Link
            to="/privacy"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Privacy policy
          </Link>{" "}
          for how we handle personal information.
        </p>
      </section>
    </>
  );
}
