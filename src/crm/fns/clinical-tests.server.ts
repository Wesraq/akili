import { and, asc, eq, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import { clinicalTests } from "@/crm/db/schema";

const testInput = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(80),
  sampleType: z.string().trim().min(1).max(80),
  turnaround: z.string().trim().min(1).max(80),
  priceCashZmw: z.number().min(0).max(1_000_000),
  priceVatZmw: z.number().min(0).max(1_000_000),
  resultUnit: z.string().trim().max(40).optional(),
  referenceRange: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  published: z.boolean().optional(),
});

/** Public website tariff menu — no auth. */
export const listPublishedTariffs = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  return db
    .select({
      id: clinicalTests.id,
      code: clinicalTests.code,
      name: clinicalTests.name,
      category: clinicalTests.category,
      sampleType: clinicalTests.sampleType,
      turnaround: clinicalTests.turnaround,
      priceCashZmw: clinicalTests.priceCashZmw,
      priceVatZmw: clinicalTests.priceVatZmw,
      updatedAt: clinicalTests.updatedAt,
    })
    .from(clinicalTests)
    .where(and(eq(clinicalTests.published, true), eq(clinicalTests.active, true)))
    .orderBy(asc(clinicalTests.category), asc(clinicalTests.name))
    .all();
});

/** Staff reference list — active tests only (no admin required). */
export const listActiveTariffs = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async () => {
    const db = getDb();
    return db
      .select({
        id: clinicalTests.id,
        code: clinicalTests.code,
        name: clinicalTests.name,
        category: clinicalTests.category,
        sampleType: clinicalTests.sampleType,
        turnaround: clinicalTests.turnaround,
        priceCashZmw: clinicalTests.priceCashZmw,
        priceVatZmw: clinicalTests.priceVatZmw,
        published: clinicalTests.published,
      })
      .from(clinicalTests)
      .where(eq(clinicalTests.active, true))
      .orderBy(asc(clinicalTests.category), asc(clinicalTests.name))
      .all();
  });

export const listAllClinicalTests = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async ({ context }) => {
    if (context.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    return db
      .select()
      .from(clinicalTests)
      .orderBy(asc(clinicalTests.category), asc(clinicalTests.name))
      .all();
  });

export const createClinicalTest = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(testInput)
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    try {
      const result = db
        .insert(clinicalTests)
        .values({
          code: data.code.toUpperCase(),
          name: data.name,
          category: data.category,
          sampleType: data.sampleType,
          turnaround: data.turnaround,
          priceCashZmw: data.priceCashZmw,
          priceVatZmw: data.priceVatZmw,
          price: data.priceVatZmw,
          resultUnit: data.resultUnit ?? "",
          referenceRange: data.referenceRange ?? "",
          active: data.active ?? true,
          published: data.published ?? true,
          updatedAt: sql`(datetime('now'))`,
        })
        .returning()
        .get();
      writeAudit({
        actor: context.user,
        action: "create",
        entityType: "clinical_test",
        entityId: result.id,
        meta: { code: result.code },
      });
      return result;
    } catch {
      throw new Error("Could not create test (code may already exist)");
    }
  });

export const updateClinicalTest = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(testInput.extend({ id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    const { id, ...rest } = data;
    try {
      const result = db
        .update(clinicalTests)
        .set({
          code: rest.code.toUpperCase(),
          name: rest.name,
          category: rest.category,
          sampleType: rest.sampleType,
          turnaround: rest.turnaround,
          priceCashZmw: rest.priceCashZmw,
          priceVatZmw: rest.priceVatZmw,
          price: rest.priceVatZmw,
          resultUnit: rest.resultUnit ?? "",
          referenceRange: rest.referenceRange ?? "",
          active: rest.active ?? true,
          published: rest.published ?? true,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(clinicalTests.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Test not found");
      writeAudit({
        actor: context.user,
        action: "update",
        entityType: "clinical_test",
        entityId: result.id,
        meta: { code: result.code, published: result.published },
      });
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === "Test not found") throw error;
      throw new Error("Could not update test (code may already exist)");
    }
  });

export const setClinicalTestActive = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive(), active: z.boolean() }))
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    const result = db
      .update(clinicalTests)
      .set({
        active: data.active,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(clinicalTests.id, data.id))
      .returning()
      .get();
    if (!result) throw new Error("Test not found");
    writeAudit({
      actor: context.user,
      action: data.active ? "activate" : "deactivate",
      entityType: "clinical_test",
      entityId: result.id,
    });
    return result;
  });

export const setClinicalTestPublished = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive(), published: z.boolean() }))
  .handler(async ({ data, context }) => {
    if (context.user.role !== "admin") throw new Error("Admin only");
    const db = getDb();
    const result = db
      .update(clinicalTests)
      .set({
        published: data.published,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(clinicalTests.id, data.id))
      .returning()
      .get();
    if (!result) throw new Error("Test not found");
    writeAudit({
      actor: context.user,
      action: data.published ? "publish" : "unpublish",
      entityType: "clinical_test",
      entityId: result.id,
    });
    return result;
  });
