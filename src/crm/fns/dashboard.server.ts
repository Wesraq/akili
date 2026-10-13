import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";

import { crmAuthMiddleware } from "@/crm/auth";
import { getDb } from "@/crm/db/client";
import {
  appointments,
  clients,
  clinicalTests,
  equipmentOrders,
  invoices,
  labOrderItems,
  labOrders,
  leads,
} from "@/crm/db/schema";
import { addHoursIso, parseTurnaroundHours } from "@/crm/lib/ops";

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async () => {
    const db = getDb();
    const { start, end } = todayBounds();

    const clientCount = db.select({ count: sql<number>`count(*)` }).from(clients).get()?.count ?? 0;

    const todayAppointments = db
      .select({
        appointment: appointments,
        clientName: clients.name,
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(
        and(
          gte(appointments.scheduledAt, start),
          lt(appointments.scheduledAt, end),
          eq(appointments.status, "scheduled"),
        ),
      )
      .orderBy(appointments.scheduledAt)
      .all()
      .map((row) => ({
        ...row.appointment,
        clientName: row.clientName,
      }));

    const pendingOrders = db
      .select({
        order: labOrders,
        clientName: clients.name,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .where(sql`${labOrders.status} IN ('ordered', 'received', 'in_progress')`)
      .orderBy(desc(labOrders.orderedAt))
      .limit(8)
      .all()
      .map((row) => ({
        ...row.order,
        clientName: row.clientName,
      }));

    const awaitingValidation = db
      .select({
        order: labOrders,
        clientName: clients.name,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .where(sql`${labOrders.status} IN ('reported', 'amended')`)
      .orderBy(desc(labOrders.updatedAt))
      .limit(8)
      .all()
      .map((row) => ({
        ...row.order,
        clientName: row.clientName,
      }));

    const awaitingValidationCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(labOrders)
        .where(sql`${labOrders.status} IN ('reported', 'amended')`)
        .get()?.count ?? 0;

    const pendingEquipment = db
      .select({
        order: equipmentOrders,
        clientName: clients.name,
      })
      .from(equipmentOrders)
      .innerJoin(clients, eq(equipmentOrders.clientId, clients.id))
      .where(sql`${equipmentOrders.status} IN ('quoted', 'confirmed', 'fulfilling')`)
      .orderBy(desc(equipmentOrders.orderedAt))
      .limit(8)
      .all()
      .map((row) => ({
        ...row.order,
        clientName: row.clientName,
      }));

    const scheduledCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(eq(appointments.status, "scheduled"))
        .get()?.count ?? 0;

    const openOrdersCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(labOrders)
        .where(sql`${labOrders.status} IN ('ordered', 'received', 'in_progress')`)
        .get()?.count ?? 0;

    const openEquipmentCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(equipmentOrders)
        .where(sql`${equipmentOrders.status} IN ('quoted', 'confirmed', 'fulfilling')`)
        .get()?.count ?? 0;

    const newLeadsCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.status, "new"))
        .get()?.count ?? 0;

    const unpaidInvoicesCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.status, "issued"))
        .get()?.count ?? 0;

    const unpaidInvoices = db
      .select({
        invoice: invoices,
        clientName: clients.name,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.status, "issued"))
      .orderBy(desc(invoices.issuedAt))
      .limit(8)
      .all()
      .map((row) => ({
        ...row.invoice,
        clientName: row.clientName,
      }));

    const openLabRows = db
      .select({
        order: labOrders,
        clientName: clients.name,
        turnaround: clinicalTests.turnaround,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .leftJoin(labOrderItems, eq(labOrderItems.orderId, labOrders.id))
      .leftJoin(clinicalTests, eq(labOrderItems.testId, clinicalTests.id))
      .where(sql`${labOrders.status} IN ('ordered', 'received', 'in_progress')`)
      .all();

    const dueByOrder = new Map<
      number,
      {
        id: number;
        accessionNumber: string | null;
        clientName: string;
        status: string;
        orderedAt: string;
        dueAt: string | null;
      }
    >();
    for (const row of openLabRows) {
      const hours = parseTurnaroundHours(row.turnaround) ?? 48;
      const dueAt = addHoursIso(row.order.orderedAt, hours);
      const existing = dueByOrder.get(row.order.id);
      if (!existing || (existing.dueAt && dueAt < existing.dueAt)) {
        dueByOrder.set(row.order.id, {
          id: row.order.id,
          accessionNumber: row.order.accessionNumber,
          clientName: row.clientName,
          status: row.order.status,
          orderedAt: row.order.orderedAt,
          dueAt,
        });
      }
    }
    const now = Date.now();
    const staleLabOrders = Array.from(dueByOrder.values())
      .filter((row) => row.dueAt && new Date(row.dueAt).getTime() < now)
      .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))
      .slice(0, 8);
    const staleLabOrdersCount = Array.from(dueByOrder.values()).filter(
      (row) => row.dueAt && new Date(row.dueAt).getTime() < now,
    ).length;

    const recentLeads = db
      .select()
      .from(leads)
      .where(eq(leads.status, "new"))
      .orderBy(desc(leads.createdAt))
      .limit(8)
      .all();

    const stageCounts = {
      ordered:
        db
          .select({ count: sql<number>`count(*)` })
          .from(labOrders)
          .where(eq(labOrders.status, "ordered"))
          .get()?.count ?? 0,
      received:
        db
          .select({ count: sql<number>`count(*)` })
          .from(labOrders)
          .where(eq(labOrders.status, "received"))
          .get()?.count ?? 0,
      in_progress:
        db
          .select({ count: sql<number>`count(*)` })
          .from(labOrders)
          .where(eq(labOrders.status, "in_progress"))
          .get()?.count ?? 0,
      reported:
        db
          .select({ count: sql<number>`count(*)` })
          .from(labOrders)
          .where(eq(labOrders.status, "reported"))
          .get()?.count ?? 0,
      amended:
        db
          .select({ count: sql<number>`count(*)` })
          .from(labOrders)
          .where(eq(labOrders.status, "amended"))
          .get()?.count ?? 0,
      validated:
        db
          .select({ count: sql<number>`count(*)` })
          .from(labOrders)
          .where(eq(labOrders.status, "validated"))
          .get()?.count ?? 0,
      rejected:
        db
          .select({ count: sql<number>`count(*)` })
          .from(labOrders)
          .where(eq(labOrders.status, "rejected"))
          .get()?.count ?? 0,
    };

    const recentAccessions = db
      .select({
        order: labOrders,
        clientName: clients.name,
        labMrn: clients.labMrn,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .orderBy(desc(labOrders.orderedAt))
      .limit(10)
      .all()
      .map((row) => ({
        ...row.order,
        clientName: row.clientName,
        labMrn: row.labMrn,
      }));

    const myQueue = db
      .select({
        order: labOrders,
        clientName: clients.name,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .where(sql`${labOrders.status} IN ('ordered', 'received', 'in_progress', 'reported', 'amended')`)
      .orderBy(desc(labOrders.updatedAt))
      .limit(12)
      .all()
      .map((row) => ({
        ...row.order,
        clientName: row.clientName,
      }));

    return {
      clientCount,
      scheduledCount,
      openOrdersCount,
      openEquipmentCount,
      newLeadsCount,
      unpaidInvoicesCount,
      staleLabOrdersCount,
      awaitingValidationCount,
      stageCounts: {
        ordered: Number(stageCounts.ordered) || 0,
        received: Number(stageCounts.received) || 0,
        in_progress: Number(stageCounts.in_progress) || 0,
        reported: Number(stageCounts.reported) || 0,
        amended: Number(stageCounts.amended) || 0,
        validated: Number(stageCounts.validated) || 0,
        rejected: Number(stageCounts.rejected) || 0,
      },
      todayAppointments,
      pendingOrders,
      pendingEquipment,
      recentLeads,
      unpaidInvoices,
      staleLabOrders,
      awaitingValidation,
      recentAccessions,
      myQueue,
    };
  });
