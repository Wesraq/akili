import { desc, eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware, hashPassword } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import { auditEvents, labSettings, staffUsers } from "@/crm/db/schema";
import { verifyPassword } from "@/crm/passwords";

const labSettingsInput = z.object({
  orgName: z.string().trim().min(2).max(160),
  tagline: z.string().trim().max(200),
  phone: z.string().trim().max(60),
  whatsapp: z.string().trim().max(40),
  email: z.string().trim().max(120),
  address: z.string().trim().max(300),
  hours: z.string().trim().max(200),
  currency: z
    .string()
    .trim()
    .min(3)
    .max(8)
    .transform((value) => value.toUpperCase()),

  vatRate: z.number().min(0).max(100),
  invoiceFooter: z.string().trim().max(1000),
  reportFooter: z.string().trim().max(1000),
});

export const getLabSettings = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async () => {
    const db = getDb();
    const row = db.select().from(labSettings).where(eq(labSettings.id, 1)).get();
    if (!row) throw new Error("Lab settings missing");
    return row;
  });

export const updateLabSettings = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(labSettingsInput)
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("Enter a valid organisation email");
    }
    const db = getDb();
    const result = db
      .update(labSettings)
      .set({
        ...data,
        updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        updatedBy: context.user.id,
      })
      .where(eq(labSettings.id, 1))
      .returning()
      .get();

    if (!result) throw new Error("Lab settings missing");

    writeAudit({
      actor: context.user,
      action: "update",
      entityType: "lab_settings",
      entityId: 1,
      meta: { orgName: result.orgName },
    });

    return result;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().email(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const email = data.email.trim().toLowerCase();
    const clash = db
      .select({ id: staffUsers.id })
      .from(staffUsers)
      .where(eq(staffUsers.email, email))
      .get();
    if (clash && clash.id !== context.user.id) {
      throw new Error("Email already in use");
    }

    const result = db
      .update(staffUsers)
      .set({ name: data.name, email })
      .where(eq(staffUsers.id, context.user.id))
      .returning({
        id: staffUsers.id,
        email: staffUsers.email,
        name: staffUsers.name,
        role: staffUsers.role,
        active: staffUsers.active,
      })
      .get();

    if (!result) throw new Error("User not found");

    writeAudit({
      actor: context.user,
      action: "update_profile",
      entityType: "staff_user",
      entityId: result.id,
    });

    return result;
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(100),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const user = db.select().from(staffUsers).where(eq(staffUsers.id, context.user.id)).get();
    if (!user) throw new Error("User not found");

    const ok = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!ok) throw new Error("Current password is incorrect");

    const passwordHash = await hashPassword(data.newPassword);
    db.update(staffUsers).set({ passwordHash }).where(eq(staffUsers.id, user.id)).run();

    writeAudit({
      actor: context.user,
      action: "change_password",
      entityType: "staff_user",
      entityId: user.id,
    });

    return { ok: true as const };
  });

export const listAuditEvents = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z
      .object({
        entityType: z.string().optional(),
        action: z.string().optional(),
        q: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ context, data }) => {
    if (context.user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    const db = getDb();
    let rows = db
      .select({
        id: auditEvents.id,
        action: auditEvents.action,
        entityType: auditEvents.entityType,
        entityId: auditEvents.entityId,
        at: auditEvents.at,
        meta: auditEvents.meta,
        actorId: auditEvents.actorId,
        actorName: staffUsers.name,
        actorEmail: staffUsers.email,
      })
      .from(auditEvents)
      .leftJoin(staffUsers, eq(auditEvents.actorId, staffUsers.id))
      .orderBy(desc(auditEvents.at))
      .limit(200)
      .all();

    if (data?.entityType) {
      rows = rows.filter((row) => row.entityType === data.entityType);
    }
    if (data?.action) {
      rows = rows.filter((row) => row.action === data.action);
    }
    const q = data?.q?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (row) =>
          row.action.toLowerCase().includes(q) ||
          row.entityType.toLowerCase().includes(q) ||
          row.entityId.toLowerCase().includes(q) ||
          (row.actorName ?? "").toLowerCase().includes(q) ||
          (row.actorEmail ?? "").toLowerCase().includes(q),
      );
    }
    return rows.slice(0, 100);
  });
