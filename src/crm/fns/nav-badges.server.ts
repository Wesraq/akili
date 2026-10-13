import { eq, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";

import { crmAuthMiddleware } from "@/crm/auth";
import { getDb } from "@/crm/db/client";
import { appointments, invoices, labOrders, leads } from "@/crm/db/schema";

export type NavBadges = {
  leads: number;
  labOrders: number;
  invoices: number;
  appointments: number;
};

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Counts shown as number badges on the LIMS side menu. */
export const getNavBadges = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async (): Promise<NavBadges> => {
    const db = getDb();
    const { start, end } = todayBounds();

    const leadsCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.status, "new"))
        .get()?.count ?? 0;

    const labOrdersCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(labOrders)
        .where(sql`${labOrders.status} IN ('reported', 'amended')`)
        .get()?.count ?? 0;

    const invoicesCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.status, "issued"))
        .get()?.count ?? 0;

    const appointmentsCount =
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          sql`${appointments.status} = 'scheduled' AND ${appointments.scheduledAt} >= ${start} AND ${appointments.scheduledAt} < ${end}`,
        )
        .get()?.count ?? 0;

    return {
      leads: Number(leadsCount) || 0,
      labOrders: Number(labOrdersCount) || 0,
      invoices: Number(invoicesCount) || 0,
      appointments: Number(appointmentsCount) || 0,
    };
  });
