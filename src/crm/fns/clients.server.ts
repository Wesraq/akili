import { desc, eq, like, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import { clients, labOrders } from "@/crm/db/schema";

const sexEnum = z.enum(["male", "female", "other", "unknown"]);

const clientInput = z.object({
  type: z.enum(["individual", "organisation"]),
  name: z.string().trim().min(2).max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  nationalId: z.string().trim().max(80).optional().nullable(),
  labMrn: z.string().trim().max(40).optional().nullable(),
  dateOfBirth: z.string().trim().max(40).optional().nullable(),
  sex: sexEnum.optional().nullable(),
  address: z.string().trim().max(400).optional().nullable(),
  nextOfKin: z.string().trim().max(160).optional().nullable(),
  nextOfKinPhone: z.string().trim().max(40).optional().nullable(),
  active: z.boolean().optional(),
  notes: z.string().trim().max(4000).optional().nullable(),
});

function nextLabMrn(db: ReturnType<typeof getDb>) {
  const maxId = db.select({ id: clients.id }).from(clients).orderBy(desc(clients.id)).get()?.id ?? 0;
  return `AKL-${String(maxId + 1).padStart(5, "0")}`;
}

function ageFromDob(dob: string | null | undefined) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}

export const listClients = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z
      .object({
        q: z.string().optional(),
        type: z.enum(["individual", "organisation"]).optional(),
        active: z.enum(["all", "active", "inactive"]).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    let rows = db.select().from(clients).orderBy(desc(clients.updatedAt)).all();

    if (data?.type) {
      rows = rows.filter((row) => row.type === data.type);
    }
    const activeFilter = data?.active ?? "active";
    if (activeFilter === "active") {
      rows = rows.filter((row) => row.active !== false);
    } else if (activeFilter === "inactive") {
      rows = rows.filter((row) => row.active === false);
    }

    const q = data?.q?.trim();
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.name.toLowerCase().includes(needle) ||
          (row.phone ?? "").toLowerCase().includes(needle) ||
          (row.email ?? "").toLowerCase().includes(needle) ||
          (row.nationalId ?? "").toLowerCase().includes(needle) ||
          (row.labMrn ?? "").toLowerCase().includes(needle) ||
          (row.address ?? "").toLowerCase().includes(needle),
      );
    }

    const orderStats = db
      .select({
        clientId: labOrders.clientId,
        orderCount: sql<number>`count(*)`,
        openCount: sql<number>`sum(case when ${labOrders.status} in ('ordered', 'received', 'in_progress', 'reported', 'amended') then 1 else 0 end)`,
        lastOrderedAt: sql<string | null>`max(${labOrders.orderedAt})`,
      })
      .from(labOrders)
      .groupBy(labOrders.clientId)
      .all();

    const statsByClient = new Map(
      orderStats.map((row) => [
        row.clientId,
        {
          orderCount: Number(row.orderCount) || 0,
          openCount: Number(row.openCount) || 0,
          lastOrderedAt: row.lastOrderedAt,
        },
      ]),
    );

    return rows.map((row) => {
      const stats = statsByClient.get(row.id) ?? {
        orderCount: 0,
        openCount: 0,
        lastOrderedAt: null as string | null,
      };
      return {
        ...row,
        age: ageFromDob(row.dateOfBirth),
        orderCount: stats.orderCount,
        openOrderCount: stats.openCount,
        lastOrderedAt: stats.lastOrderedAt,
      };
    });
  });

export const getClient = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const client = db.select().from(clients).where(eq(clients.id, data.id)).get();
    if (!client) throw new Error("Client not found");
    return { ...client, age: ageFromDob(client.dateOfBirth) };
  });

export const createClient = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(clientInput)
  .handler(async ({ data, context }) => {
    const user = context.user;
    const db = getDb();
    const labMrn = data.labMrn?.trim() || nextLabMrn(db);

    const existingMrn = db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.labMrn, labMrn))
      .get();
    if (existingMrn) throw new Error(`Lab MRN ${labMrn} is already in use`);

    const result = db
      .insert(clients)
      .values({
        type: data.type,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        nationalId: data.nationalId || null,
        labMrn,
        dateOfBirth: data.dateOfBirth || null,
        sex: data.sex || null,
        address: data.address || null,
        nextOfKin: data.nextOfKin || null,
        nextOfKinPhone: data.nextOfKinPhone || null,
        active: data.active ?? true,
        notes: data.notes || null,
        createdBy: user.id,
      })
      .returning()
      .get();

    writeAudit({
      actor: user,
      action: "create",
      entityType: "client",
      entityId: result.id,
      meta: { name: result.name, labMrn: result.labMrn },
    });
    return result;
  });

export const updateClient = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(clientInput.extend({ id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const user = context.user;
    const db = getDb();
    const { id, ...rest } = data;

    if (rest.labMrn?.trim()) {
      const clash = db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.labMrn, rest.labMrn.trim()))
        .get();
      if (clash && clash.id !== id) {
        throw new Error(`Lab MRN ${rest.labMrn.trim()} is already in use`);
      }
    }

    const result = db
      .update(clients)
      .set({
        type: rest.type,
        name: rest.name,
        phone: rest.phone || null,
        email: rest.email || null,
        nationalId: rest.nationalId || null,
        labMrn: rest.labMrn?.trim() || null,
        dateOfBirth: rest.dateOfBirth || null,
        sex: rest.sex || null,
        address: rest.address || null,
        nextOfKin: rest.nextOfKin || null,
        nextOfKinPhone: rest.nextOfKinPhone || null,
        active: rest.active ?? true,
        notes: rest.notes || null,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(clients.id, id))
      .returning()
      .get();

    if (!result) throw new Error("Client not found");

    writeAudit({
      actor: user,
      action: "update",
      entityType: "client",
      entityId: result.id,
      meta: { labMrn: result.labMrn },
    });
    return result;
  });

export const searchClientsLite = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ q: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const db = getDb();
    const q = data?.q?.trim();
    const rows = q
      ? db
          .select({
            id: clients.id,
            name: clients.name,
            type: clients.type,
            labMrn: clients.labMrn,
          })
          .from(clients)
          .where(like(clients.name, `%${q}%`))
          .orderBy(clients.name)
          .limit(30)
          .all()
      : db
          .select({
            id: clients.id,
            name: clients.name,
            type: clients.type,
            labMrn: clients.labMrn,
          })
          .from(clients)
          .orderBy(clients.name)
          .limit(50)
          .all();
    return rows;
  });
