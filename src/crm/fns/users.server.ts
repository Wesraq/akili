import { desc, eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware, hashPassword } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import { staffUsers } from "@/crm/db/schema";

export const listStaffUsers = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async ({ context }) => {
    if (context.user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    const db = getDb();
    return db
      .select({
        id: staffUsers.id,
        email: staffUsers.email,
        name: staffUsers.name,
        role: staffUsers.role,
        active: staffUsers.active,
        createdAt: staffUsers.createdAt,
      })
      .from(staffUsers)
      .orderBy(desc(staffUsers.createdAt))
      .all();
  });

export const createStaffUser = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      email: z.string().email(),
      name: z.string().trim().min(2).max(120),
      role: z.enum(["admin", "staff"]).default("staff"),
      password: z.string().min(8).max(100),
    }),
  )
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    const db = getDb();
    const email = data.email.trim().toLowerCase();
    const existing = db.select().from(staffUsers).where(eq(staffUsers.email, email)).get();
    if (existing) throw new Error("Email already in use");

    const passwordHash = await hashPassword(data.password);
    const result = db
      .insert(staffUsers)
      .values({
        email,
        name: data.name,
        role: data.role,
        passwordHash,
        active: true,
      })
      .returning({
        id: staffUsers.id,
        email: staffUsers.email,
        name: staffUsers.name,
        role: staffUsers.role,
        active: staffUsers.active,
        createdAt: staffUsers.createdAt,
      })
      .get();

    writeAudit({
      actor: context.user,
      action: "create",
      entityType: "staff_user",
      entityId: result.id,
      meta: { email: result.email, role: result.role },
    });

    return result;
  });

export const setStaffActive = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      active: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (data.id === context.user.id && !data.active) {
      throw new Error("You cannot deactivate your own account");
    }
    const db = getDb();
    const result = db
      .update(staffUsers)
      .set({ active: data.active })
      .where(eq(staffUsers.id, data.id))
      .returning({
        id: staffUsers.id,
        email: staffUsers.email,
        active: staffUsers.active,
      })
      .get();

    if (!result) throw new Error("User not found");

    writeAudit({
      actor: context.user,
      action: data.active ? "activate" : "deactivate",
      entityType: "staff_user",
      entityId: result.id,
    });
    return result;
  });

export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      role: z.enum(["admin", "staff"]),
    }),
  )
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (data.id === context.user.id && data.role !== "admin") {
      throw new Error("You cannot remove your own admin role");
    }
    const db = getDb();
    const result = db
      .update(staffUsers)
      .set({ role: data.role })
      .where(eq(staffUsers.id, data.id))
      .returning({
        id: staffUsers.id,
        email: staffUsers.email,
        role: staffUsers.role,
      })
      .get();

    if (!result) throw new Error("User not found");

    writeAudit({
      actor: context.user,
      action: "set_role",
      entityType: "staff_user",
      entityId: result.id,
      meta: { role: result.role },
    });
    return result;
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      password: z.string().min(8).max(100),
    }),
  )
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    const db = getDb();
    const target = db
      .select({ id: staffUsers.id })
      .from(staffUsers)
      .where(eq(staffUsers.id, data.id))
      .get();
    if (!target) throw new Error("User not found");

    const passwordHash = await hashPassword(data.password);
    db.update(staffUsers).set({ passwordHash }).where(eq(staffUsers.id, data.id)).run();

    writeAudit({
      actor: context.user,
      action: "reset_password",
      entityType: "staff_user",
      entityId: data.id,
    });

    return { ok: true as const };
  });
