import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { site } from "@/lib/site-data";

const enquirySchema = z.object({
  variant: z.enum(["quote", "collection", "contact", "booking"]),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160),
  orgName: z.string().trim().max(160).optional().default(""),
  option: z.string().trim().max(120).optional().default(""),
  preferredDate: z.string().trim().max(40).optional().default(""),
  address: z.string().trim().max(240).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  age: z.string().trim().max(10).optional().default(""),
  sex: z.string().trim().max(40).optional().default(""),
  testCode: z.string().trim().max(40).optional().default(""),
  testName: z.string().trim().max(200).optional().default(""),
  sample: z.string().trim().max(80).optional().default(""),
  sampleType: z.string().trim().max(120).optional().default(""),
  patientNumber: z.string().trim().max(80).optional().default(""),
  requestingDoctor: z.string().trim().max(120).optional().default(""),
  broughtBy: z.string().trim().max(120).optional().default(""),
  sponsor: z.string().trim().max(120).optional().default(""),
  ward: z.string().trim().max(80).optional().default(""),
  dateCollected: z.string().trim().max(40).optional().default(""),
  section: z.string().trim().max(40).optional().default(""),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

function buildEmail(data: EnquiryInput, reference: string) {
  const label =
    data.variant === "quote"
      ? "Quote request"
      : data.variant === "collection"
        ? "Demo / delivery request"
        : data.variant === "booking"
          ? "Lab test booking"
          : "Contact message";

  const subject = `[${reference}] ${label} - ${data.fullName}`;
  const testLine =
    data.testCode || data.testName
      ? `Test: ${[data.testCode, data.testName].filter(Boolean).join(" · ")}`
      : null;

  const lines = [
    `${label} via AKILI LABS website`,
    `Reference: ${reference}`,
    "",
    `Name: ${data.fullName}`,
    data.age ? `Age: ${data.age}` : null,
    data.sex ? `Sex: ${data.sex}` : null,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    data.patientNumber ? `Patient / MR number: ${data.patientNumber}` : null,
    data.orgName ? `Received from / organisation: ${data.orgName}` : null,
    data.requestingDoctor ? `Requesting doctor: ${data.requestingDoctor}` : null,
    data.broughtBy ? `Brought by: ${data.broughtBy}` : null,
    data.sponsor ? `Sponsor: ${data.sponsor}` : null,
    data.ward ? `Ward: ${data.ward}` : null,
    data.dateCollected ? `Date collected: ${data.dateCollected}` : null,
    data.section ? `Section: ${data.section}` : null,
    data.option ? `Department / selection: ${data.option}` : null,
    testLine,
    data.sample ? `Sample: ${data.sample}` : null,
    data.sampleType ? `Specimen type: ${data.sampleType}` : null,
    data.preferredDate
      ? `${data.variant === "booking" ? "Preferred appointment" : "Preferred contact date"}: ${data.preferredDate}`
      : null,
    data.address ? `Address: ${data.address}` : null,
    "",
    "Notes:",
    data.notes || "(none)",
  ].filter((line): line is string => line !== null);

  return { subject, body: lines.join("\n") };
}

function buildLeadNotes(data: EnquiryInput) {
  const parts = [
    data.patientNumber ? `Patient / MR number: ${data.patientNumber}` : null,
    data.age ? `Age: ${data.age}` : null,
    data.sex ? `Sex: ${data.sex}` : null,
    data.ward ? `Ward: ${data.ward}` : null,
    data.requestingDoctor ? `Requesting doctor: ${data.requestingDoctor}` : null,
    data.broughtBy ? `Brought by: ${data.broughtBy}` : null,
    data.sponsor ? `Sponsor: ${data.sponsor}` : null,
    data.dateCollected ? `Date collected: ${data.dateCollected}` : null,
    data.section ? `Section: ${data.section}` : null,
    data.testCode || data.testName
      ? `Test: ${[data.testCode, data.testName].filter(Boolean).join(" · ")}`
      : null,
    data.sample ? `Sample: ${data.sample}` : null,
    data.sampleType ? `Specimen type: ${data.sampleType}` : null,
    data.notes || null,
  ].filter((line): line is string => Boolean(line));
  return parts.join("\n") || null;
}

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator(enquirySchema)
  .handler(async ({ data }) => {
    let reference = `AKL-${Date.now().toString(36).toUpperCase()}`;

    try {
      const { saveEnquiryLead } = await import("@/crm/leads-ingest.server");
      const result = saveEnquiryLead({
        reference,
        source: data.variant === "booking" ? "services" : data.variant,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        orgName: data.orgName,
        interest:
          [data.option, data.testCode, data.testName].filter(Boolean).join(" · ") || data.option,
        preferredDate: data.preferredDate,
        address: data.address,
        notes: buildLeadNotes(data),
      });
      // Confirm with the existing lead reference when the request was merged.
      if (!result.created && result.lead?.reference) {
        reference = result.lead.reference;
      }
    } catch (error) {
      console.error("[akili-enquiry] CRM lead save failed", error);
    }

    const { subject, body } = buildEmail(data, reference);
    const notifyTo = site.email;

    console.info("[akili-enquiry]", {
      reference,
      variant: data.variant,
      email: data.email,
      option: data.option,
      testCode: data.testCode,
      sampleType: data.sampleType,
    });

    try {
      const { sendMail } = await import("@/lib/mail.server");
      await sendMail({
        to: notifyTo,
        subject,
        text: body,
        replyTo: data.email,
      });
    } catch (error) {
      console.error("[akili-enquiry] email notification failed", error);
    }

    const webhook = process.env["ENQUIRY_WEBHOOK_URL"];
    if (webhook) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reference,
            subject,
            body,
            ...data,
            to: notifyTo,
          }),
        });
      } catch (error) {
        console.error("[akili-enquiry] webhook failed", error);
      }
    }

    const mailto = `mailto:${notifyTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return {
      ok: true as const,
      reference,
      mailto,
      salesEmail: notifyTo,
    };
  });
