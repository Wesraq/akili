import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/crm/db/client";
import { clients, leads } from "@/crm/db/schema";

export type EnquiryLeadInput = {
  reference: string;
  source: "quote" | "collection" | "contact" | "services" | "other";
  fullName: string;
  phone: string;
  email: string;
  orgName?: string | null;
  interest?: string | null;
  preferredDate?: string | null;
  address?: string | null;
  notes?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function appendRequestLog(
  existingNotes: string | null | undefined,
  input: EnquiryLeadInput,
) {
  const stamp = new Date().toLocaleString();
  const block = [
    `--- Follow-up request ${input.reference} · ${stamp} ---`,
    `Source: ${input.source}`,
    input.interest ? `Interest: ${input.interest}` : null,
    input.preferredDate ? `Preferred date: ${input.preferredDate}` : null,
    input.address ? `Address: ${input.address}` : null,
    input.notes || null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const prior = existingNotes?.trim();
  return prior ? `${prior}\n\n${block}` : block;
}

/**
 * Save a website enquiry. If the same email already has a lead (or matches a
 * client), append the new request to that lead instead of creating another one.
 */
export function saveEnquiryLead(input: EnquiryLeadInput) {
  const db = getDb();
  const email = normalizeEmail(input.email);

  const existingClient = db
    .select()
    .from(clients)
    .where(sql`lower(${clients.email}) = ${email}`)
    .get();

  // Prefer an open pipeline lead; otherwise the most recent lead for this email.
  const openLead =
    db
      .select()
      .from(leads)
      .where(
        sql`lower(${leads.email}) = ${email} AND ${leads.status} IN ('new', 'contacted', 'qualified')`,
      )
      .orderBy(desc(leads.updatedAt))
      .get() ??
    db
      .select()
      .from(leads)
      .where(sql`lower(${leads.email}) = ${email}`)
      .orderBy(desc(leads.updatedAt))
      .get();

  if (openLead) {
    const mergedInterest = [input.interest, openLead.interest]
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .join(" · ");

    const updated = db
      .update(leads)
      .set({
        fullName: input.fullName.trim() || openLead.fullName,
        phone: input.phone.trim() || openLead.phone,
        email,
        orgName: input.orgName || openLead.orgName,
        interest: mergedInterest || openLead.interest,
        preferredDate: input.preferredDate || openLead.preferredDate,
        address: input.address || openLead.address,
        notes: appendRequestLog(openLead.notes, input),
        source: input.source,
        // Re-surface closed/converted leads so staff see the new request.
        status: "new",
        clientId: openLead.clientId ?? existingClient?.id ?? null,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(leads.id, openLead.id))
      .returning()
      .get();

    return { lead: updated, created: false as const, mergedIntoReference: openLead.reference };
  }

  const created = db
    .insert(leads)
    .values({
      reference: input.reference,
      source: input.source,
      status: "new",
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email,
      orgName: input.orgName || null,
      interest: input.interest || null,
      preferredDate: input.preferredDate || null,
      address: input.address || null,
      notes: input.notes || null,
      clientId: existingClient?.id ?? null,
    })
    .returning()
    .get();

  return { lead: created, created: true as const, mergedIntoReference: null };
}
