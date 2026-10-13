import { asc, desc, eq, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import {
  clients,
  clinicalTests,
  equipmentOrderItems,
  equipmentOrders,
  invoiceLines,
  invoices,
  labOrderItems,
  labOrders,
  labSettings,
} from "@/crm/db/schema";
import { computeVat } from "@/crm/lib/ops";

const invoiceStatuses = ["draft", "issued", "paid", "void"] as const;

function nextInvoiceReference(db: ReturnType<typeof getDb>) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const count =
    db.select({ count: sql<number>`count(*)` }).from(invoices).get()?.count ?? 0;
  return `INV-${stamp}-${String(count + 1).padStart(4, "0")}`;
}

function dueInDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function readVatRate(db: ReturnType<typeof getDb>) {
  return (
    db.select({ vatRate: labSettings.vatRate }).from(labSettings).where(eq(labSettings.id, 1)).get()
      ?.vatRate ?? 16
  );
}

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z
      .object({
        clientId: z.number().int().positive().optional(),
        status: z.enum(invoiceStatuses).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const rows = db
      .select({
        invoice: invoices,
        clientName: clients.name,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .orderBy(desc(invoices.createdAt))
      .all();

    return rows
      .filter((row) => {
        if (data?.clientId && row.invoice.clientId !== data.clientId) return false;
        if (data?.status && row.invoice.status !== data.status) return false;
        return true;
      })
      .map((row) => ({
        ...row.invoice,
        clientName: row.clientName,
      }));
  });

export const getInvoice = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const row = db
      .select({
        invoice: invoices,
        clientName: clients.name,
        clientType: clients.type,
        clientPhone: clients.phone,
        clientEmail: clients.email,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, data.id))
      .get();

    if (!row) throw new Error("Invoice not found");

    const lines = db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, data.id))
      .orderBy(asc(invoiceLines.sortOrder))
      .all();

    return {
      ...row.invoice,
      clientName: row.clientName,
      clientType: row.clientType,
      clientPhone: row.clientPhone,
      clientEmail: row.clientEmail,
      lines,
    };
  });

export const createInvoiceFromLabOrder = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ labOrderId: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const db = getDb();
    const existing = db
      .select()
      .from(invoices)
      .where(
        sql`${invoices.sourceType} = 'lab_order' AND ${invoices.sourceId} = ${data.labOrderId} AND ${invoices.status} != 'void'`,
      )
      .get();
    if (existing) return existing;

    const order = db.select().from(labOrders).where(eq(labOrders.id, data.labOrderId)).get();
    if (!order) throw new Error("Lab order not found");
    if (order.status === "cancelled") throw new Error("Cannot invoice a cancelled order");

    const items = db
      .select({
        item: labOrderItems,
        testCode: clinicalTests.code,
        testName: clinicalTests.name,
        priceCashZmw: clinicalTests.priceCashZmw,
        priceVatZmw: clinicalTests.priceVatZmw,
        price: clinicalTests.price,
      })
      .from(labOrderItems)
      .innerJoin(clinicalTests, eq(labOrderItems.testId, clinicalTests.id))
      .where(eq(labOrderItems.orderId, data.labOrderId))
      .all();

    if (items.length === 0) throw new Error("Lab order has no tests");

    const lines = items.map((row, index) => {
      const unitPrice =
        row.priceCashZmw > 0 ? row.priceCashZmw : row.priceVatZmw > 0 ? row.priceVatZmw : row.price;
      return {
        description: `${row.testCode} · ${row.testName}`,
        quantity: 1,
        unitPrice,
        sortOrder: index,
      };
    });
    const cashSubtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const vatInclusiveSubtotal = items.reduce((sum, row) => {
      const vatPrice = row.priceVatZmw > 0 ? row.priceVatZmw : row.priceCashZmw || row.price;
      return sum + vatPrice;
    }, 0);
    const { subtotal, tax, total } = computeVat({
      cashSubtotal,
      vatInclusiveSubtotal,
      vatRatePercent: readVatRate(db),
    });

    const invoice = db
      .insert(invoices)
      .values({
        reference: nextInvoiceReference(db),
        clientId: order.clientId,
        sourceType: "lab_order",
        sourceId: order.id,
        status: "issued",
        issuedAt: new Date().toISOString(),
        dueAt: dueInDays(14),
        notes: order.notes,
        subtotal,
        tax,
        total,
        createdBy: context.user.id,
      })
      .returning()
      .get();

    for (const line of lines) {
      db.insert(invoiceLines)
        .values({ invoiceId: invoice.id, ...line })
        .run();
    }

    writeAudit({
      actor: context.user,
      action: "create_from_lab_order",
      entityType: "invoice",
      entityId: invoice.id,
      meta: { labOrderId: data.labOrderId, subtotal, tax, total, reference: invoice.reference },
    });
    writeAudit({
      actor: context.user,
      action: "invoice_create",
      entityType: "lab_order",
      entityId: data.labOrderId,
      meta: {
        invoiceId: invoice.id,
        accessionNumber: order.accessionNumber,
        reference: invoice.reference,
        total,
      },
    });

    try {
      const { notifyClientInvoiceIssued } = await import("@/crm/notify-client.server");
      await notifyClientInvoiceIssued(invoice.id);
    } catch (error) {
      console.error("[akili-invoice] client email failed", error);
    }

    return invoice;
  });

export const createInvoiceFromEquipmentOrder = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ equipmentOrderId: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const db = getDb();
    const existing = db
      .select()
      .from(invoices)
      .where(
        sql`${invoices.sourceType} = 'equipment_order' AND ${invoices.sourceId} = ${data.equipmentOrderId} AND ${invoices.status} != 'void'`,
      )
      .get();
    if (existing) return existing;

    const order = db
      .select()
      .from(equipmentOrders)
      .where(eq(equipmentOrders.id, data.equipmentOrderId))
      .get();
    if (!order) throw new Error("Equipment order not found");
    if (order.status === "cancelled") throw new Error("Cannot invoice a cancelled order");

    const items = db
      .select()
      .from(equipmentOrderItems)
      .where(eq(equipmentOrderItems.orderId, data.equipmentOrderId))
      .all();
    if (items.length === 0) throw new Error("Equipment order has no lines");

    const lines = items.map((item, index) => ({
      description: `${item.productCode} · ${item.productName}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sortOrder: index,
    }));
    const cashSubtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const { subtotal, tax, total } = computeVat({
      cashSubtotal,
      vatInclusiveSubtotal: cashSubtotal,
      vatRatePercent: readVatRate(db),
    });

    const invoice = db
      .insert(invoices)
      .values({
        reference: nextInvoiceReference(db),
        clientId: order.clientId,
        sourceType: "equipment_order",
        sourceId: order.id,
        status: "issued",
        issuedAt: new Date().toISOString(),
        dueAt: dueInDays(30),
        notes: order.notes,
        subtotal,
        tax,
        total,
        createdBy: context.user.id,
      })
      .returning()
      .get();

    for (const line of lines) {
      db.insert(invoiceLines)
        .values({ invoiceId: invoice.id, ...line })
        .run();
    }

    writeAudit({
      actor: context.user,
      action: "create_from_equipment_order",
      entityType: "invoice",
      entityId: invoice.id,
      meta: { equipmentOrderId: data.equipmentOrderId, subtotal, tax, total },
    });

    try {
      const { notifyClientInvoiceIssued } = await import("@/crm/notify-client.server");
      await notifyClientInvoiceIssued(invoice.id);
    } catch (error) {
      console.error("[akili-invoice] client email failed", error);
    }

    return invoice;
  });

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      status: z.enum(invoiceStatuses),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const previous = db.select().from(invoices).where(eq(invoices.id, data.id)).get();
    if (!previous) throw new Error("Invoice not found");

    const patch: {
      status: (typeof invoiceStatuses)[number];
      updatedAt: ReturnType<typeof sql>;
      issuedAt?: string;
    } = {
      status: data.status,
      updatedAt: sql`(datetime('now'))`,
    };
    if (data.status === "issued") {
      patch.issuedAt = new Date().toISOString();
    }

    const result = db
      .update(invoices)
      .set(patch)
      .where(eq(invoices.id, data.id))
      .returning()
      .get();
    if (!result) throw new Error("Invoice not found");

    writeAudit({
      actor: context.user,
      action: "status_update",
      entityType: "invoice",
      entityId: result.id,
      meta: { status: data.status },
    });

    if (data.status === "issued" && previous.status !== "issued") {
      try {
        const { notifyClientInvoiceIssued } = await import("@/crm/notify-client.server");
        await notifyClientInvoiceIssued(result.id);
      } catch (error) {
        console.error("[akili-invoice] client email failed", error);
      }
    }

    return result;
  });

export const findInvoiceForSource = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      sourceType: z.enum(["lab_order", "equipment_order"]),
      sourceId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    return (
      db
        .select()
        .from(invoices)
        .where(
          sql`${invoices.sourceType} = ${data.sourceType} AND ${invoices.sourceId} = ${data.sourceId} AND ${invoices.status} != 'void'`,
        )
        .get() ?? null
    );
  });
