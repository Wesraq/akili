import { desc, eq, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import { appointments, clients } from "@/crm/db/schema";

const appointmentInput = z.object({
  clientId: z.number().int().positive(),
  scheduledAt: z.string().min(1),
  serviceType: z.string().trim().min(2).max(120),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z
      .object({
        clientId: z.number().int().positive().optional(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const rows = db
      .select({
        appointment: appointments,
        clientName: clients.name,
        clientType: clients.type,
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .orderBy(desc(appointments.scheduledAt))
      .all();

    return rows
      .filter((row) => {
        if (data?.clientId && row.appointment.clientId !== data.clientId) return false;
        if (data?.status && row.appointment.status !== data.status) return false;
        return true;
      })
      .map((row) => ({
        ...row.appointment,
        clientName: row.clientName,
        clientType: row.clientType,
      }));
  });

export const createAppointment = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(appointmentInput)
  .handler(async ({ data, context }) => {
    const db = getDb();
    const client = db.select().from(clients).where(eq(clients.id, data.clientId)).get();
    if (!client) throw new Error("Client not found");

    const result = db
      .insert(appointments)
      .values({
        clientId: data.clientId,
        scheduledAt: data.scheduledAt,
        serviceType: data.serviceType,
        status: data.status,
        notes: data.notes || null,
        createdBy: context.user.id,
      })
      .returning()
      .get();

    writeAudit({
      actor: context.user,
      action: "create",
      entityType: "appointment",
      entityId: result.id,
      meta: { clientId: data.clientId, scheduledAt: data.scheduledAt },
    });
    return result;
  });

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const result = db
      .update(appointments)
      .set({
        status: data.status,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(appointments.id, data.id))
      .returning()
      .get();

    if (!result) throw new Error("Appointment not found");

    writeAudit({
      actor: context.user,
      action: "status_update",
      entityType: "appointment",
      entityId: result.id,
      meta: { status: data.status },
    });
    return result;
  });

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(appointmentInput.extend({ id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const db = getDb();
    const { id, ...rest } = data;
    const result = db
      .update(appointments)
      .set({
        clientId: rest.clientId,
        scheduledAt: rest.scheduledAt,
        serviceType: rest.serviceType,
        status: rest.status,
        notes: rest.notes || null,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(appointments.id, id))
      .returning()
      .get();

    if (!result) throw new Error("Appointment not found");

    writeAudit({
      actor: context.user,
      action: "update",
      entityType: "appointment",
      entityId: result.id,
    });
    return result;
  });
