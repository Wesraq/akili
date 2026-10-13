import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { getDb } from "@/crm/db/client";
import {
  clients,
  clinicalTests,
  invoices,
  labOrderItems,
  labOrders,
  leads,
} from "@/crm/db/schema";

const rangeInput = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

function dayEnd(isoDate: string) {
  const date = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T23:59:59.999`);
  return date.toISOString();
}

function dayStart(isoDate: string) {
  const date = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T00:00:00.000`);
  return date.toISOString();
}

export const getReportsSummary = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(rangeInput)
  .handler(async ({ data }) => {
    const db = getDb();
    const from = dayStart(data.from);
    const to = dayEnd(data.to);

    const paidInvoices = db
      .select({
        invoice: invoices,
        clientName: clients.name,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(invoices.status, "paid"),
          gte(invoices.updatedAt, from),
          lte(invoices.updatedAt, to),
        ),
      )
      .orderBy(desc(invoices.updatedAt))
      .all()
      .map((row) => ({
        id: row.invoice.id,
        reference: row.invoice.reference,
        clientName: row.clientName,
        subtotal: row.invoice.subtotal,
        tax: row.invoice.tax,
        total: row.invoice.total,
        paidAt: row.invoice.updatedAt,
        sourceType: row.invoice.sourceType,
      }));

    const revenue = paidInvoices.reduce(
      (acc, row) => {
        acc.subtotal += row.subtotal;
        acc.tax += row.tax;
        acc.total += row.total;
        return acc;
      },
      { subtotal: 0, tax: 0, total: 0 },
    );

    const testRows = db
      .select({
        category: clinicalTests.category,
        code: clinicalTests.code,
        name: clinicalTests.name,
        orderStatus: labOrders.status,
        orderedAt: labOrders.orderedAt,
      })
      .from(labOrderItems)
      .innerJoin(labOrders, eq(labOrderItems.orderId, labOrders.id))
      .innerJoin(clinicalTests, eq(labOrderItems.testId, clinicalTests.id))
      .where(and(gte(labOrders.orderedAt, from), lte(labOrders.orderedAt, to)))
      .all();

    const volumeByCategory = new Map<string, number>();
    for (const row of testRows) {
      volumeByCategory.set(row.category, (volumeByCategory.get(row.category) ?? 0) + 1);
    }

    const leadRows = db
      .select()
      .from(leads)
      .where(and(gte(leads.createdAt, from), lte(leads.createdAt, to)))
      .all();

    const funnel = {
      total: leadRows.length,
      bySource: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      converted: leadRows.filter((row) => row.status === "converted" || row.clientId).length,
    };
    for (const lead of leadRows) {
      funnel.bySource[lead.source] = (funnel.bySource[lead.source] ?? 0) + 1;
      funnel.byStatus[lead.status] = (funnel.byStatus[lead.status] ?? 0) + 1;
    }

    return {
      from: data.from,
      to: data.to,
      revenue,
      paidInvoices,
      testVolume: testRows.length,
      volumeByCategory: Array.from(volumeByCategory.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      tests: testRows,
      funnel,
      leads: leadRows.map((lead) => ({
        id: lead.id,
        reference: lead.reference,
        fullName: lead.fullName,
        source: lead.source,
        status: lead.status,
        createdAt: lead.createdAt,
        converted: Boolean(lead.clientId),
      })),
    };
  });
