import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site-data";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - AKILI LABS" },
      {
        name: "description",
        content:
          "How AKILI LABS collects, uses and protects personal information for laboratory bookings, quotes and equipment enquiries.",
      },
      { property: "og:title", content: "Privacy Policy - AKILI LABS" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "Who we are",
    body: [
      `${site.name} (“we”, “us”) provides clinical laboratory testing and distributes laboratory equipment and medical devices across Central and East Africa.`,
      `Our coordination office is in ${site.address}. For privacy questions, contact ${site.email} or ${site.phone}.`,
    ],
  },
  {
    title: "Information we collect",
    body: [
      "When you book a test, request a quote, contact us or visit our website, we may collect:",
    ],
    bullets: [
      "Identity and contact details — name, phone, email, organisation, age and sex (for test bookings)",
      "Clinical booking details — department, test requested, sample and sample type, preferred date, requesting doctor and sponsor where provided",
      "Procurement details — equipment interest, delivery address and notes for quotes",
      "Technical data — basic website logs such as IP address, browser type and pages visited, used to keep the site secure and working",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "We use personal information only as needed to:",
    ],
    bullets: [
      "Confirm appointments, sample preparation and result reporting",
      "Respond to quotes, demos, service and equipment enquiries",
      "Communicate about your request by phone, WhatsApp, email or SMS",
      "Issue invoices and keep records required for laboratory and business operations",
      "Improve our services and protect against misuse of our systems",
    ],
  },
  {
    title: "Health and laboratory information",
    body: [
      "Test bookings and laboratory results are treated as confidential. We share results with you, your referring clinician or the facility named on the request, unless the law requires disclosure.",
      "Please do not send sensitive medical history by email or WhatsApp unless we ask for it for a specific test.",
    ],
  },
  {
    title: "Sharing and processors",
    body: [
      "We do not sell your personal information. We may share it with:",
    ],
    bullets: [
      "Referring clinics, hospitals or clinicians involved in your request",
      "Trusted service providers who host our website, email or operations systems under confidentiality obligations",
      "Regulators, courts or authorities when required by applicable law",
    ],
  },
  {
    title: "Retention",
    body: [
      "We keep enquiry and booking records for as long as needed to complete your request and meet laboratory, tax and legal record-keeping duties. When information is no longer required, we delete or anonymise it where practical.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use reasonable technical and organisational measures to protect personal information in transit and at rest. No online system is completely secure; please use strong unique passwords if we give you any account access.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "Subject to applicable law, you may ask us to access, correct or delete personal information we hold about you, or to stop marketing contact. Contact us using the details above. We may need to verify your identity before responding.",
    ],
  },
  {
    title: "Children",
    body: [
      "Our public website and booking forms are intended for adults booking for themselves or for patients under their care. Guardians or clinicians should submit details for minors.",
    ],
  },
  {
    title: "Updates",
    body: [
      "We may update this privacy policy from time to time. The “Last updated” date at the top of this page will change when we do. Continued use of our website after an update means you accept the revised policy.",
    ],
  },
] as const;

function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        description="How we collect, use and look after personal information when you book a test, request a quote or contact AKILI LABS."
      />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Last updated: 30 September 2026</p>
        <p className="mt-4 text-sm text-muted-foreground">
          This notice applies to our public website, booking and quote forms. Staff systems and
          partner contracts may have additional terms.
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
              {"bullets" in section && section.bullets ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          See also our{" "}
          <Link to="/terms" className="font-medium text-foreground underline-offset-4 hover:underline">
            Terms &amp; conditions
          </Link>
          .
        </p>
      </section>
    </>
  );
}
