import { asc, eq } from "drizzle-orm";

import { getDb } from "@/crm/db/client";
import {
  clients,
  clinicalTests,
  invoiceLines,
  invoices,
  labOrderItems,
  labOrders,
  labSettings,
} from "@/crm/db/schema";
import { site } from "@/lib/site-data";

function money(amount: number, currency = "ZMW") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "ZMW" ? 2 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function labReplyTo(db: ReturnType<typeof getDb>) {
  return (
    db.select({ email: labSettings.email }).from(labSettings).where(eq(labSettings.id, 1)).get()
      ?.email ||
    site.email ||
    "kangpethias@gmail.com"
  );
}

function labOrgName(db: ReturnType<typeof getDb>) {
  return (
    db.select({ orgName: labSettings.orgName }).from(labSettings).where(eq(labSettings.id, 1)).get()
      ?.orgName || site.name
  );
}

/** Email the client when an invoice is issued. Skips silently if no client email. */
export async function notifyClientInvoiceIssued(invoiceId: number) {
  const db = getDb();
  const row = db
    .select({
      invoice: invoices,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, invoiceId))
    .get();

  if (!row) return false;
  const to = row.clientEmail?.trim();
  if (!to) {
    console.warn("[akili-mail] invoice issued but client has no email", {
      invoiceId,
      reference: row.invoice.reference,
    });
    return false;
  }

  const lines = db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId))
    .orderBy(asc(invoiceLines.sortOrder))
    .all();

  const currency =
    db.select({ currency: labSettings.currency }).from(labSettings).where(eq(labSettings.id, 1)).get()
      ?.currency || "ZMW";
  const org = labOrgName(db);
  const replyTo = labReplyTo(db);

  const lineText = lines
    .map(
      (line) =>
        `• ${line.description} × ${line.quantity} @ ${money(line.unitPrice, currency)} = ${money(line.quantity * line.unitPrice, currency)}`,
    )
    .join("\n");

  const due = row.invoice.dueAt
    ? new Date(row.invoice.dueAt).toLocaleDateString()
    : "as agreed";

  const subject = `[${row.invoice.reference}] Invoice from ${org}`;
  const text = [
    `Dear ${row.clientName},`,
    "",
    `Please find your invoice details from ${org}.`,
    "",
    `Invoice: ${row.invoice.reference}`,
    `Status: ${row.invoice.status}`,
    `Issued: ${row.invoice.issuedAt ? new Date(row.invoice.issuedAt).toLocaleString() : "—"}`,
    `Due: ${due}`,
    "",
    "Items:",
    lineText || "(no lines)",
    "",
    `Subtotal: ${money(row.invoice.subtotal, currency)}`,
    `VAT: ${money(row.invoice.tax, currency)}`,
    `Total: ${money(row.invoice.total, currency)}`,
    row.invoice.notes ? `\nNotes:\n${row.invoice.notes}` : null,
    "",
    "If you have questions about this invoice, reply to this email or call the laboratory.",
    "",
    `— ${org}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const { sendMail } = await import("@/lib/mail.server");
  return sendMail({ to, subject, text, replyTo });
}

/** Email the client when a lab report is validated (final authorised results). */
export async function notifyClientLabReportValidated(orderId: number) {
  const db = getDb();
  const row = db
    .select({
      order: labOrders,
      clientName: clients.name,
      clientEmail: clients.email,
      clientPhone: clients.phone,
    })
    .from(labOrders)
    .innerJoin(clients, eq(labOrders.clientId, clients.id))
    .where(eq(labOrders.id, orderId))
    .get();

  if (!row) return false;
  const to = row.clientEmail?.trim();
  if (!to) {
    console.warn("[akili-mail] lab report validated but client has no email", {
      orderId,
      orderRef: `LAB-${row.order.id}`,
    });
    return false;
  }

  const items = db
    .select({
      testCode: clinicalTests.code,
      testName: clinicalTests.name,
      resultValue: labOrderItems.resultValue,
      resultUnit: labOrderItems.resultUnit,
      resultFlag: labOrderItems.resultFlag,
      microscopy: labOrderItems.microscopy,
      culture: labOrderItems.culture,
      urinalysis: labOrderItems.urinalysis,
      sensitivity: labOrderItems.sensitivity,
    })
    .from(labOrderItems)
    .innerJoin(clinicalTests, eq(labOrderItems.testId, clinicalTests.id))
    .where(eq(labOrderItems.orderId, orderId))
    .all();

  const org = labOrgName(db);
  const replyTo = labReplyTo(db);
  const orderRef = `LAB-${row.order.id}`;

  const resultLines = items.map((item) => {
    const parts = [
      `${item.testCode} · ${item.testName}`,
      item.resultValue
        ? `  Result: ${item.resultValue}${item.resultUnit ? ` ${item.resultUnit}` : ""}${item.resultFlag ? ` (${item.resultFlag})` : ""}`
        : null,
      item.urinalysis ? `  Urinalysis: ${item.urinalysis}` : null,
      item.microscopy ? `  Microscopy: ${item.microscopy}` : null,
      item.culture ? `  Culture: ${item.culture}` : null,
      item.sensitivity ? `  Sensitivity: ${item.sensitivity}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  });

  const subject = `[${orderRef}] Laboratory report ready — ${org}`;
  const text = [
    `Dear ${row.clientName},`,
    "",
    `Your laboratory report from ${org} is ready (final authorised results).`,
    "",
    `Order: ${orderRef}`,
    row.order.patientNumber ? `Patient / MR number: ${row.order.patientNumber}` : null,
    row.order.validatedAt
      ? `Validated: ${new Date(row.order.validatedAt).toLocaleString()}`
      : null,
    "",
    "Results:",
    resultLines.join("\n\n") || "(see laboratory for details)",
    "",
    "This message is confidential and intended for the requesting clinician or patient.",
    "Contact the laboratory if you need clarification or a printed copy.",
    "",
    `— ${org}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const { sendMail } = await import("@/lib/mail.server");
  return sendMail({ to, subject, text, replyTo });
}
