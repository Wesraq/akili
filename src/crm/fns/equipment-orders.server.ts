import { desc, eq, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import { clients, equipmentOrderItems, equipmentOrders, leads } from "@/crm/db/schema";
import { labTests } from "@/lib/catalog";

const orderStatuses = ["quoted", "confirmed", "fulfilling", "delivered", "cancelled"] as const;

export const listEquipmentCatalogue = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async () => {
    return labTests.map((product) => ({
      code: product.code,
      name: product.name,
      category: product.category,
      brand: product.brand,
      price: Number(product.price) || 0,
      turnaround: product.turnaround,
    }));
  });

export const listEquipmentOrders = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z
      .object({
        clientId: z.number().int().positive().optional(),
        status: z.enum(orderStatuses).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const rows = db
      .select({
        order: equipmentOrders,
        clientName: clients.name,
      })
      .from(equipmentOrders)
      .innerJoin(clients, eq(equipmentOrders.clientId, clients.id))
      .orderBy(desc(equipmentOrders.orderedAt))
      .all();

    return rows
      .filter((row) => {
        if (data?.clientId && row.order.clientId !== data.clientId) return false;
        if (data?.status && row.order.status !== data.status) return false;
        return true;
      })
      .map((row) => {
        const items = db
          .select()
          .from(equipmentOrderItems)
          .where(eq(equipmentOrderItems.orderId, row.order.id))
          .all();
        const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        return {
          ...row.order,
          clientName: row.clientName,
          itemCount: items.length,
          total,
        };
      });
  });

export const getEquipmentOrder = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const orderRow = db
      .select({
        order: equipmentOrders,
        clientName: clients.name,
        clientType: clients.type,
        clientPhone: clients.phone,
        clientEmail: clients.email,
      })
      .from(equipmentOrders)
      .innerJoin(clients, eq(equipmentOrders.clientId, clients.id))
      .where(eq(equipmentOrders.id, data.id))
      .get();

    if (!orderRow) throw new Error("Equipment order not found");

    const items = db
      .select()
      .from(equipmentOrderItems)
      .where(eq(equipmentOrderItems.orderId, data.id))
      .all();

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return {
      ...orderRow.order,
      clientName: orderRow.clientName,
      clientType: orderRow.clientType,
      clientPhone: orderRow.clientPhone,
      clientEmail: orderRow.clientEmail,
      items,
      total,
    };
  });

export const createEquipmentOrder = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      clientId: z.number().int().positive(),
      leadId: z.number().int().positive().optional().nullable(),
      notes: z.string().trim().max(4000).optional().nullable(),
      items: z
        .array(
          z.object({
            productCode: z.string().trim().min(1).max(40),
            quantity: z.number().int().positive().max(999),
          }),
        )
        .min(1),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const client = db.select().from(clients).where(eq(clients.id, data.clientId)).get();
    if (!client) throw new Error("Client not found");

    if (data.leadId) {
      const lead = db.select().from(leads).where(eq(leads.id, data.leadId)).get();
      if (!lead) throw new Error("Lead not found");
    }

    const resolved = data.items.map((item) => {
      const product = labTests.find((entry) => entry.code === item.productCode);
      if (!product) throw new Error(`Unknown product code: ${item.productCode}`);
      return {
        productCode: product.code,
        productName: product.name,
        category: product.category,
        brand: product.brand,
        quantity: item.quantity,
        unitPrice: Number(product.price) || 0,
      };
    });

    const order = db
      .insert(equipmentOrders)
      .values({
        clientId: data.clientId,
        leadId: data.leadId || null,
        notes: data.notes || null,
        orderedBy: context.user.id,
        status: "quoted",
      })
      .returning()
      .get();

    for (const item of resolved) {
      db.insert(equipmentOrderItems)
        .values({
          orderId: order.id,
          ...item,
        })
        .run();
    }

    writeAudit({
      actor: context.user,
      action: "create",
      entityType: "equipment_order",
      entityId: order.id,
      meta: { clientId: data.clientId, itemCount: resolved.length },
    });

    return order;
  });

export const updateEquipmentOrderStatus = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      status: z.enum(orderStatuses),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const result = db
      .update(equipmentOrders)
      .set({
        status: data.status,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(equipmentOrders.id, data.id))
      .returning()
      .get();

    if (!result) throw new Error("Equipment order not found");

    writeAudit({
      actor: context.user,
      action: "status_update",
      entityType: "equipment_order",
      entityId: result.id,
      meta: { status: data.status },
    });
    return result;
  });

export const updateEquipmentOrderItem = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      quantity: z.number().int().positive().max(999).optional(),
      unitPrice: z.number().min(0).max(1_000_000).optional(),
      notes: z.string().trim().max(1000).optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const existing = db
      .select()
      .from(equipmentOrderItems)
      .where(eq(equipmentOrderItems.id, data.id))
      .get();
    if (!existing) throw new Error("Order item not found");

    const result = db
      .update(equipmentOrderItems)
      .set({
        quantity: data.quantity ?? existing.quantity,
        unitPrice: data.unitPrice ?? existing.unitPrice,
        notes: data.notes === undefined ? existing.notes : data.notes || null,
      })
      .where(eq(equipmentOrderItems.id, data.id))
      .returning()
      .get();

    db.update(equipmentOrders)
      .set({ updatedAt: sql`(datetime('now'))` })
      .where(eq(equipmentOrders.id, existing.orderId))
      .run();

    writeAudit({
      actor: context.user,
      action: "update_item",
      entityType: "equipment_order",
      entityId: existing.orderId,
      meta: { itemId: data.id },
    });

    return result;
  });
