import { asc, desc, eq, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import { clients, appointments, leads, staffUsers } from "@/crm/db/schema";

export const listLeads = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z
      .object({
        status: z.enum(["new", "contacted", "qualified", "converted", "closed"]).optional(),
        q: z.string().optional(),
        assignedTo: z.number().int().positive().optional(),
        unassigned: z.boolean().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    let rows = db
      .select({
        lead: leads,
        assigneeName: staffUsers.name,
      })
      .from(leads)
      .leftJoin(staffUsers, eq(leads.assignedTo, staffUsers.id))
      .orderBy(desc(leads.createdAt))
      .all()
      .map((row) => ({
        ...row.lead,
        assigneeName: row.assigneeName ?? null,
      }));

    if (data?.status) {
      rows = rows.filter((row) => row.status === data.status);
    }
    if (data?.assignedTo) {
      rows = rows.filter((row) => row.assignedTo === data.assignedTo);
    }
    if (data?.unassigned) {
      rows = rows.filter((row) => !row.assignedTo);
    }
    const q = data?.q?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (row) =>
          row.fullName.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.phone.toLowerCase().includes(q) ||
          row.reference.toLowerCase().includes(q) ||
          (row.orgName ?? "").toLowerCase().includes(q) ||
          (row.assigneeName ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  });

export const listStaffAssignees = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async () => {
    const db = getDb();
    return db
      .select({
        id: staffUsers.id,
        name: staffUsers.name,
        email: staffUsers.email,
      })
      .from(staffUsers)
      .where(eq(staffUsers.active, true))
      .orderBy(asc(staffUsers.name))
      .all();
  });

export const getLead = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const row = db
      .select({
        lead: leads,
        assigneeName: staffUsers.name,
      })
      .from(leads)
      .leftJoin(staffUsers, eq(leads.assignedTo, staffUsers.id))
      .where(eq(leads.id, data.id))
      .get();
    if (!row) throw new Error("Lead not found");
    return { ...row.lead, assigneeName: row.assigneeName ?? null };
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      status: z.enum(["new", "contacted", "qualified", "converted", "closed"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const result = db
      .update(leads)
      .set({
        status: data.status,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(leads.id, data.id))
      .returning()
      .get();
    if (!result) throw new Error("Lead not found");
    writeAudit({
      actor: context.user,
      action: "status_update",
      entityType: "lead",
      entityId: result.id,
      meta: { status: data.status },
    });
    return result;
  });

export const updateLeadNotes = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      notes: z.string().trim().max(4000).nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const result = db
      .update(leads)
      .set({
        notes: data.notes || null,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(leads.id, data.id))
      .returning()
      .get();
    if (!result) throw new Error("Lead not found");
    writeAudit({
      actor: context.user,
      action: "update_notes",
      entityType: "lead",
      entityId: result.id,
    });
    return result;
  });

export const assignLead = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      assignedTo: z.number().int().positive().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    if (data.assignedTo) {
      const staff = db
        .select({ id: staffUsers.id, active: staffUsers.active })
        .from(staffUsers)
        .where(eq(staffUsers.id, data.assignedTo))
        .get();
      if (!staff?.active) throw new Error("Assignee not found");
    }
    const result = db
      .update(leads)
      .set({
        assignedTo: data.assignedTo,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(leads.id, data.id))
      .returning()
      .get();
    if (!result) throw new Error("Lead not found");
    writeAudit({
      actor: context.user,
      action: "assign",
      entityType: "lead",
      entityId: result.id,
      meta: { assignedTo: data.assignedTo },
    });
    return result;
  });

export const convertLeadToClient = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const db = getDb();
    const lead = db.select().from(leads).where(eq(leads.id, data.id)).get();
    if (!lead) throw new Error("Lead not found");
    if (lead.clientId) {
      return { clientId: lead.clientId, lead };
    }

    const client = db
      .insert(clients)
      .values({
        type: lead.orgName ? "organisation" : "individual",
        name: lead.orgName || lead.fullName,
        phone: lead.phone,
        email: lead.email,
        notes: [
          `Converted from lead ${lead.reference}`,
          lead.interest ? `Interest: ${lead.interest}` : null,
          lead.notes ? `Notes: ${lead.notes}` : null,
          lead.orgName ? `Contact: ${lead.fullName}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        createdBy: context.user.id,
      })
      .returning()
      .get();

    const updated = db
      .update(leads)
      .set({
        clientId: client.id,
        status: "converted",
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(leads.id, lead.id))
      .returning()
      .get();

    writeAudit({
      actor: context.user,
      action: "convert",
      entityType: "lead",
      entityId: lead.id,
      meta: { clientId: client.id },
    });

    return { clientId: client.id, lead: updated };
  });

export const scheduleLeadAppointment = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      scheduledAt: z.string().min(1).optional(),
      serviceType: z.string().trim().min(2).max(120).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const lead = db.select().from(leads).where(eq(leads.id, data.id)).get();
    if (!lead) throw new Error("Lead not found");

    let clientId = lead.clientId;
    if (!clientId) {
      const client = db
        .insert(clients)
        .values({
          type: lead.orgName ? "organisation" : "individual",
          name: lead.orgName || lead.fullName,
          phone: lead.phone,
          email: lead.email,
          notes: [
            `Converted from lead ${lead.reference}`,
            lead.interest ? `Interest: ${lead.interest}` : null,
            lead.notes ? `Notes: ${lead.notes}` : null,
            lead.orgName ? `Contact: ${lead.fullName}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          createdBy: context.user.id,
        })
        .returning()
        .get();

      db.update(leads)
        .set({
          clientId: client.id,
          status: "converted",
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(leads.id, lead.id))
        .run();

      writeAudit({
        actor: context.user,
        action: "convert",
        entityType: "lead",
        entityId: lead.id,
        meta: { clientId: client.id },
      });

      clientId = client.id;
    }

    const preferred = lead.preferredDate?.trim();
    let scheduledAt = data.scheduledAt;
    if (!scheduledAt && preferred) {
      const parsed = new Date(preferred.includes("T") ? preferred : `${preferred}T09:00:00`);
      scheduledAt = Number.isNaN(parsed.getTime())
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : parsed.toISOString();
    }
    if (!scheduledAt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      scheduledAt = tomorrow.toISOString();
    }

    const serviceType =
      data.serviceType?.trim() ||
      lead.interest?.trim() ||
      (lead.source === "quote" ? "Equipment demo" : "Lab sample collection");

    const appointment = db
      .insert(appointments)
      .values({
        clientId,
        scheduledAt,
        serviceType,
        status: "scheduled",
        notes: [`From lead ${lead.reference}`, lead.notes ? `Lead notes: ${lead.notes}` : null]
          .filter(Boolean)
          .join("\n"),
        createdBy: context.user.id,
      })
      .returning()
      .get();

    writeAudit({
      actor: context.user,
      action: "create",
      entityType: "appointment",
      entityId: appointment.id,
      meta: { clientId, fromLeadId: lead.id },
    });

    writeAudit({
      actor: context.user,
      action: "schedule_appointment",
      entityType: "lead",
      entityId: lead.id,
      meta: { appointmentId: appointment.id, clientId },
    });

    return { clientId, appointmentId: appointment.id, scheduledAt, serviceType };
  });
