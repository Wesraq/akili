import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { writeAudit } from "@/crm/audit.server";
import { getDb } from "@/crm/db/client";
import {
  auditEvents,
  clients,
  clinicalTests,
  labOrderItems,
  labOrders,
  specimens,
  staffUsers,
} from "@/crm/db/schema";
import { addHoursIso, parseTurnaroundHours } from "@/crm/lib/ops";
import {
  bodySitesSummary,
  parseBodySites,
  serializeBodySites,
  type BodySiteMark,
} from "@/lib/body-sites";

const bodySiteMarkSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  view: z.enum(["front", "back"]),
});

function normalizeSpecimenSites(
  sites: BodySiteMark[] | null | undefined,
): string | null {
  if (sites === undefined || sites === null) return null;
  return serializeBodySites(sites);
}

export const labOrderStatuses = [
  "ordered",
  "received",
  "in_progress",
  "reported",
  "validated",
  "rejected",
  "amended",
  "cancelled",
] as const;

const openForTat = new Set(["ordered", "received", "in_progress"]);

function nextAccessionNumber(db: ReturnType<typeof getDb>): string {
  const year = String(new Date().getFullYear());
  const prefix = `ACC-${year}-`;
  const latest = db
    .select({ accessionNumber: labOrders.accessionNumber })
    .from(labOrders)
    .where(sql`${labOrders.accessionNumber} LIKE ${prefix + "%"}`)
    .orderBy(desc(labOrders.id))
    .limit(40)
    .all();

  let maxSeq = 0;
  for (const row of latest) {
    const match = row.accessionNumber?.match(/ACC-\d{4}-(\d+)$/);
    if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
  }
  // Also consider max id as floor so backfilled ACC-YYYY-{id} never collide.
  const maxId = db.select({ id: labOrders.id }).from(labOrders).orderBy(desc(labOrders.id)).limit(1).get()
    ?.id;
  if (maxId) maxSeq = Math.max(maxSeq, maxId);
  return `${prefix}${String(maxSeq + 1).padStart(5, "0")}`;
}

export const listClinicalTests = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .handler(async () => {
    const db = getDb();
    return db
      .select()
      .from(clinicalTests)
      .where(eq(clinicalTests.active, true))
      .orderBy(asc(clinicalTests.category), asc(clinicalTests.name))
      .all();
  });

export const listLabOrders = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z
      .object({
        clientId: z.number().int().positive().optional(),
        status: z.enum(labOrderStatuses).optional(),
        section: z.string().optional(),
        sort: z.enum(["newest", "due"]).optional(),
        q: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const rows = db
      .select({
        order: labOrders,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        labMrn: clients.labMrn,
        turnaround: clinicalTests.turnaround,
        testCode: clinicalTests.code,
        testName: clinicalTests.name,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .leftJoin(labOrderItems, eq(labOrderItems.orderId, labOrders.id))
      .leftJoin(clinicalTests, eq(labOrderItems.testId, clinicalTests.id))
      .orderBy(desc(labOrders.orderedAt))
      .all();

    const byId = new Map<
      number,
      {
        id: number;
        accessionNumber: string | null;
        clientId: number;
        orderedAt: string;
        status: (typeof labOrders.$inferSelect)["status"];
        notes: string | null;
        section: string | null;
        patientNumber: string | null;
        age: string | null;
        sex: string | null;
        ward: string | null;
        specimenType: string | null;
        specimenSites: string | null;
        receivedFrom: string | null;
        broughtBy: string | null;
        receivedByName: string | null;
        requestingDoctor: string | null;
        sponsor: string | null;
        dateCollected: string | null;
        contactNumber: string | null;
        clientName: string;
        clientPhone: string | null;
        clientEmail: string | null;
        labMrn: string | null;
        dueAt: string | null;
        overdue: boolean;
        testLabels: string[];
      }
    >();

    for (const row of rows) {
      if (data?.clientId && row.order.clientId !== data.clientId) continue;
      if (data?.status && row.order.status !== data.status) continue;
      if (data?.section && row.order.section !== data.section) continue;
      const hours = parseTurnaroundHours(row.turnaround);
      const dueAt =
        hours != null && openForTat.has(row.order.status)
          ? addHoursIso(row.order.orderedAt, hours)
          : null;
      const existing = byId.get(row.order.id);
      const testLabel =
        row.testCode || row.testName
          ? `${row.testCode ?? ""} ${row.testName ?? ""}`.trim()
          : "";
      if (!existing) {
        byId.set(row.order.id, {
          ...row.order,
          clientName: row.clientName,
          clientPhone: row.clientPhone,
          clientEmail: row.clientEmail,
          labMrn: row.labMrn,
          dueAt,
          overdue: Boolean(dueAt && new Date(dueAt).getTime() < Date.now()),
          testLabels: testLabel ? [testLabel] : [],
        });
      } else {
        if (dueAt && (!existing.dueAt || dueAt < existing.dueAt)) {
          existing.dueAt = dueAt;
          existing.overdue = new Date(dueAt).getTime() < Date.now();
        }
        if (testLabel && !existing.testLabels.includes(testLabel)) {
          existing.testLabels.push(testLabel);
        }
      }
    }

    let list = Array.from(byId.values());
    const q = data?.q?.trim().toLowerCase();
    if (q) {
      list = list.filter((order) => {
        const haystack = [
          String(order.id),
          `#${order.id}`,
          order.accessionNumber ?? "",
          order.labMrn ?? "",
          order.clientName,
          order.clientPhone ?? "",
          order.clientEmail ?? "",
          order.notes ?? "",
          order.status,
          order.patientNumber ?? "",
          order.specimenType ?? "",
          order.section ?? "",
          ...order.testLabels,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    if (data?.sort === "due") {
      list.sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return b.orderedAt.localeCompare(a.orderedAt);
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return a.dueAt.localeCompare(b.dueAt);
      });
    }
    return list;
  });

export const getLabOrder = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const db = getDb();
    const orderRow = db
      .select({
        order: labOrders,
        clientName: clients.name,
        clientType: clients.type,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        labMrn: clients.labMrn,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .where(eq(labOrders.id, data.id))
      .get();

    if (!orderRow) throw new Error("Lab order not found");

    const resultsEnteredByName = orderRow.order.resultsEnteredBy
      ? (db
          .select({ name: staffUsers.name })
          .from(staffUsers)
          .where(eq(staffUsers.id, orderRow.order.resultsEnteredBy))
          .get()?.name ?? null)
      : null;
    const validatedByName = orderRow.order.validatedBy
      ? (db
          .select({ name: staffUsers.name })
          .from(staffUsers)
          .where(eq(staffUsers.id, orderRow.order.validatedBy))
          .get()?.name ?? null)
      : null;

    const items = db
      .select({
        item: labOrderItems,
        testCode: clinicalTests.code,
        testName: clinicalTests.name,
        testCategory: clinicalTests.category,
        testTurnaround: clinicalTests.turnaround,
        testResultUnit: clinicalTests.resultUnit,
        testReferenceRange: clinicalTests.referenceRange,
        testPrice: clinicalTests.price,
      })
      .from(labOrderItems)
      .innerJoin(clinicalTests, eq(labOrderItems.testId, clinicalTests.id))
      .where(eq(labOrderItems.orderId, data.id))
      .all()
      .map((row) => ({
        ...row.item,
        testCode: row.testCode,
        testName: row.testName,
        testCategory: row.testCategory,
        testTurnaround: row.testTurnaround,
        testResultUnit: row.testResultUnit,
        testReferenceRange: row.testReferenceRange,
        testPrice: row.testPrice,
        resultUnit: row.item.resultUnit || row.testResultUnit || "",
      }));

    const orderSpecimens = db
      .select()
      .from(specimens)
      .where(eq(specimens.orderId, data.id))
      .orderBy(asc(specimens.id))
      .all();

    const maxHours = items
      .map((item) => parseTurnaroundHours(item.testTurnaround))
      .filter((value): value is number => value != null)
      .reduce((max, value) => Math.max(max, value), 0);
    const dueAt =
      maxHours > 0 && openForTat.has(orderRow.order.status)
        ? addHoursIso(orderRow.order.orderedAt, maxHours)
        : null;

    return {
      ...orderRow.order,
      clientName: orderRow.clientName,
      clientType: orderRow.clientType,
      clientPhone: orderRow.clientPhone,
      clientEmail: orderRow.clientEmail,
      labMrn: orderRow.labMrn,
      resultsEnteredByName,
      validatedByName,
      dueAt,
      overdue: Boolean(dueAt && new Date(dueAt).getTime() < Date.now()),
      items,
      specimens: orderSpecimens,
    };
  });

export const createLabOrder = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      clientId: z.number().int().positive(),
      testIds: z.array(z.number().int().positive()).min(1),
      notes: z.string().trim().max(4000).optional().nullable(),
      patientNumber: z.string().trim().max(80).optional().nullable(),
      age: z.string().trim().max(20).optional().nullable(),
      sex: z.string().trim().max(40).optional().nullable(),
      ward: z.string().trim().max(80).optional().nullable(),
      specimenType: z.string().trim().max(240).optional().nullable(),
      specimenSites: z.array(bodySiteMarkSchema).max(40).optional().nullable(),
      requestingDoctor: z.string().trim().max(120).optional().nullable(),
      receivedFrom: z.string().trim().max(160).optional().nullable(),
      broughtBy: z.string().trim().max(120).optional().nullable(),
      receivedByName: z.string().trim().max(120).optional().nullable(),
      sponsor: z.string().trim().max(120).optional().nullable(),
      dateCollected: z.string().trim().max(40).optional().nullable(),
      contactNumber: z.string().trim().max(40).optional().nullable(),
      section: z.string().trim().max(40).optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const client = db.select().from(clients).where(eq(clients.id, data.clientId)).get();
    if (!client) throw new Error("Client not found");

    const tests = db
      .select()
      .from(clinicalTests)
      .where(inArray(clinicalTests.id, data.testIds))
      .all();
    if (tests.length !== data.testIds.length) {
      throw new Error("One or more tests were not found");
    }

    const { sectionFromCategory } = await import("@/lib/akili-forms");
    const inferredSection =
      data.section ||
      (tests[0] ? sectionFromCategory(tests[0].category) : null) ||
      "haem_chem";
    const sitesJson = normalizeSpecimenSites(
      (data.specimenSites as BodySiteMark[] | null | undefined) ?? null,
    );
    const sitesSummary = bodySitesSummary(parseBodySites(sitesJson));
    const inferredSpecimen =
      data.specimenType ||
      sitesSummary ||
      Array.from(new Set(tests.map((test) => test.sampleType).filter(Boolean))).join(", ") ||
      null;

    const accessionNumber = nextAccessionNumber(db);

    const order = db
      .insert(labOrders)
      .values({
        clientId: data.clientId,
        accessionNumber,
        notes: data.notes || null,
        orderedBy: context.user.id,
        status: "ordered",
        patientNumber: data.patientNumber || null,
        age: data.age || null,
        sex: data.sex || null,
        ward: data.ward || null,
        specimenType: inferredSpecimen,
        specimenSites: sitesJson,
        requestingDoctor: data.requestingDoctor || null,
        receivedFrom: data.receivedFrom || null,
        broughtBy: data.broughtBy || null,
        receivedByName: data.receivedByName || context.user.name,
        sponsor: data.sponsor || null,
        dateCollected: data.dateCollected || null,
        contactNumber: data.contactNumber || client.phone || null,
        section: inferredSection,
      })
      .returning()
      .get();

    for (const test of tests) {
      db.insert(labOrderItems)
        .values({
          orderId: order.id,
          testId: test.id,
          resultUnit: test.resultUnit || null,
        })
        .run();
    }

    const specimen = db
      .insert(specimens)
      .values({
        orderId: order.id,
        specimenType: inferredSpecimen || "Unspecified",
        collectedAt: data.dateCollected || null,
        status: "pending",
        barcode: accessionNumber,
      })
      .returning()
      .get();

    writeAudit({
      actor: context.user,
      action: "create",
      entityType: "lab_order",
      entityId: order.id,
      meta: {
        clientId: data.clientId,
        testCount: data.testIds.length,
        section: inferredSection,
        accessionNumber,
        specimenId: specimen.id,
      },
    });

    return order;
  });

export const updateLabOrderMeta = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      notes: z.string().trim().max(4000).optional().nullable(),
      patientNumber: z.string().trim().max(80).optional().nullable(),
      age: z.string().trim().max(20).optional().nullable(),
      sex: z.string().trim().max(40).optional().nullable(),
      ward: z.string().trim().max(80).optional().nullable(),
      specimenType: z.string().trim().max(240).optional().nullable(),
      specimenSites: z.array(bodySiteMarkSchema).max(40).optional().nullable(),
      requestingDoctor: z.string().trim().max(120).optional().nullable(),
      receivedFrom: z.string().trim().max(160).optional().nullable(),
      broughtBy: z.string().trim().max(120).optional().nullable(),
      receivedByName: z.string().trim().max(120).optional().nullable(),
      sponsor: z.string().trim().max(120).optional().nullable(),
      dateCollected: z.string().trim().max(40).optional().nullable(),
      contactNumber: z.string().trim().max(40).optional().nullable(),
      section: z.string().trim().max(40).optional().nullable(),
      addTestIds: z.array(z.number().int().positive()).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const existing = db.select().from(labOrders).where(eq(labOrders.id, data.id)).get();
    if (!existing) throw new Error("Lab order not found");
    if (existing.status === "validated" || existing.status === "cancelled") {
      throw new Error("Cannot edit a released or cancelled accession");
    }

    if (data.addTestIds?.length) {
      const existingItems = db
        .select({ testId: labOrderItems.testId })
        .from(labOrderItems)
        .where(eq(labOrderItems.orderId, data.id))
        .all();
      const have = new Set(existingItems.map((item) => item.testId));
      const toAdd = data.addTestIds.filter((id) => !have.has(id));
      if (toAdd.length) {
        const tests = db.select().from(clinicalTests).where(inArray(clinicalTests.id, toAdd)).all();
        for (const test of tests) {
          db.insert(labOrderItems)
            .values({
              orderId: data.id,
              testId: test.id,
              resultUnit: test.resultUnit || null,
            })
            .run();
        }
      }
    }

    const nextSites =
      data.specimenSites !== undefined
        ? normalizeSpecimenSites(data.specimenSites as BodySiteMark[] | null)
        : existing.specimenSites;

    const result = db
      .update(labOrders)
      .set({
        notes: data.notes !== undefined ? data.notes || null : existing.notes,
        patientNumber:
          data.patientNumber !== undefined ? data.patientNumber || null : existing.patientNumber,
        age: data.age !== undefined ? data.age || null : existing.age,
        sex: data.sex !== undefined ? data.sex || null : existing.sex,
        ward: data.ward !== undefined ? data.ward || null : existing.ward,
        specimenType:
          data.specimenType !== undefined ? data.specimenType || null : existing.specimenType,
        specimenSites: nextSites,
        requestingDoctor:
          data.requestingDoctor !== undefined
            ? data.requestingDoctor || null
            : existing.requestingDoctor,
        receivedFrom:
          data.receivedFrom !== undefined ? data.receivedFrom || null : existing.receivedFrom,
        broughtBy: data.broughtBy !== undefined ? data.broughtBy || null : existing.broughtBy,
        receivedByName:
          data.receivedByName !== undefined
            ? data.receivedByName || null
            : existing.receivedByName,
        sponsor: data.sponsor !== undefined ? data.sponsor || null : existing.sponsor,
        dateCollected:
          data.dateCollected !== undefined ? data.dateCollected || null : existing.dateCollected,
        contactNumber:
          data.contactNumber !== undefined ? data.contactNumber || null : existing.contactNumber,
        section: data.section !== undefined ? data.section || null : existing.section,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(labOrders.id, data.id))
      .returning()
      .get();

    writeAudit({
      actor: context.user,
      action: "update_meta",
      entityType: "lab_order",
      entityId: data.id,
      meta: {
        addTestIds: data.addTestIds ?? [],
        specimenSiteCount: parseBodySites(nextSites).length,
      },
    });

    return result;
  });

export const updateLabOrderStatus = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      status: z.enum([
        "ordered",
        "received",
        "in_progress",
        "reported",
        "rejected",
        "amended",
        "cancelled",
      ]),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const existing = db.select().from(labOrders).where(eq(labOrders.id, data.id)).get();
    if (!existing) throw new Error("Lab order not found");
    if (existing.status === "validated" && data.status !== "cancelled" && data.status !== "amended") {
      throw new Error("Released orders can only be cancelled or amended");
    }

    const result = db
      .update(labOrders)
      .set({
        status: data.status,
        updatedAt: sql`(datetime('now'))`,
        ...(data.status === "cancelled"
          ? {}
          : data.status === "ordered" ||
              data.status === "received" ||
              data.status === "in_progress"
            ? { resultsEnteredBy: null, validatedBy: null, validatedAt: null }
            : data.status === "amended"
              ? { validatedBy: null, validatedAt: null, resultsEnteredBy: null }
              : {}),
      })
      .where(eq(labOrders.id, data.id))
      .returning()
      .get();

    if (!result) throw new Error("Lab order not found");

    writeAudit({
      actor: context.user,
      action: "status_update",
      entityType: "lab_order",
      entityId: result.id,
      meta: { status: data.status, from: existing.status },
    });
    return result;
  });

export const receiveSpecimen = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      specimenId: z.number().int().positive(),
      condition: z.string().trim().max(200).optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const specimen = db.select().from(specimens).where(eq(specimens.id, data.specimenId)).get();
    if (!specimen) throw new Error("Specimen not found");
    if (specimen.status === "rejected") throw new Error("Rejected specimens cannot be received");

    const now = new Date().toISOString();
    const updated = db
      .update(specimens)
      .set({
        status: "received",
        receivedAt: now,
        condition: data.condition || specimen.condition,
        rejectedReason: null,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(specimens.id, data.specimenId))
      .returning()
      .get();

    const order = db.select().from(labOrders).where(eq(labOrders.id, specimen.orderId)).get();
    if (order && (order.status === "ordered" || order.status === "rejected")) {
      db.update(labOrders)
        .set({ status: "received", updatedAt: sql`(datetime('now'))` })
        .where(eq(labOrders.id, order.id))
        .run();
    }

    writeAudit({
      actor: context.user,
      action: "specimen_receive",
      entityType: "lab_order",
      entityId: specimen.orderId,
      meta: { specimenId: specimen.id, condition: data.condition },
    });

    return updated;
  });

export const rejectSpecimen = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      specimenId: z.number().int().positive(),
      reason: z.string().trim().min(2).max(500),
      rejectOrder: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const specimen = db.select().from(specimens).where(eq(specimens.id, data.specimenId)).get();
    if (!specimen) throw new Error("Specimen not found");

    const updated = db
      .update(specimens)
      .set({
        status: "rejected",
        rejectedReason: data.reason,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(specimens.id, data.specimenId))
      .returning()
      .get();

    if (data.rejectOrder !== false) {
      db.update(labOrders)
        .set({ status: "rejected", updatedAt: sql`(datetime('now'))` })
        .where(eq(labOrders.id, specimen.orderId))
        .run();
    }

    writeAudit({
      actor: context.user,
      action: "specimen_reject",
      entityType: "lab_order",
      entityId: specimen.orderId,
      meta: { specimenId: specimen.id, reason: data.reason, rejectOrder: data.rejectOrder !== false },
    });

    return updated;
  });

export const addSpecimen = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      orderId: z.number().int().positive(),
      specimenType: z.string().trim().min(1).max(120),
      collectedAt: z.string().trim().max(40).optional().nullable(),
      notes: z.string().trim().max(500).optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const order = db.select().from(labOrders).where(eq(labOrders.id, data.orderId)).get();
    if (!order) throw new Error("Lab order not found");
    if (order.status === "cancelled") throw new Error("Cannot add specimens to a cancelled order");

    const barcode = `${order.accessionNumber || `LAB-${order.id}`}-S${Date.now().toString(36).slice(-4)}`;
    const specimen = db
      .insert(specimens)
      .values({
        orderId: data.orderId,
        specimenType: data.specimenType,
        collectedAt: data.collectedAt || null,
        notes: data.notes || null,
        status: "pending",
        barcode,
      })
      .returning()
      .get();

    // Redraw after reject → reopen as accessioned if needed
    if (order.status === "rejected") {
      db.update(labOrders)
        .set({ status: "ordered", updatedAt: sql`(datetime('now'))` })
        .where(eq(labOrders.id, order.id))
        .run();
    }

    writeAudit({
      actor: context.user,
      action: "specimen_add",
      entityType: "lab_order",
      entityId: data.orderId,
      meta: { specimenId: specimen.id, specimenType: data.specimenType },
    });

    return specimen;
  });

export const listOrderTimeline = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      orderId: z.number().int().positive(),
      newestFirst: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const order = db.select().from(labOrders).where(eq(labOrders.id, data.orderId)).get();
    if (!order) throw new Error("Lab order not found");

    const orderIdStr = String(data.orderId);
    const events = db
      .select({
        event: auditEvents,
        actorName: staffUsers.name,
      })
      .from(auditEvents)
      .leftJoin(staffUsers, eq(auditEvents.actorId, staffUsers.id))
      .where(sql`${auditEvents.entityType} = 'lab_order' AND ${auditEvents.entityId} = ${orderIdStr}`)
      .orderBy(data.newestFirst === false ? asc(auditEvents.at) : desc(auditEvents.at))
      .all()
      .map((row) => {
        let meta: Record<string, string | number | boolean | null> | null = null;
        if (row.event.meta) {
          try {
            const parsed = JSON.parse(row.event.meta) as Record<string, unknown>;
            meta = {};
            for (const [key, value] of Object.entries(parsed)) {
              if (
                value === null ||
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
              ) {
                meta[key] = value;
              } else {
                meta[key] = JSON.stringify(value);
              }
            }
          } catch {
            meta = null;
          }
        }
        return {
          id: row.event.id,
          action: row.event.action,
          at: row.event.at,
          actorName: row.actorName,
          meta,
        };
      });

    return {
      accessionNumber: order.accessionNumber,
      status: order.status,
      events,
    };
  });

export const validateLabOrder = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data, context }) => {
    const db = getDb();
    const order = db.select().from(labOrders).where(eq(labOrders.id, data.id)).get();
    if (!order) throw new Error("Lab order not found");
    if (order.status !== "reported" && order.status !== "amended") {
      throw new Error("Only reported or amended orders can be validated");
    }
    if (order.resultsEnteredBy && order.resultsEnteredBy === context.user.id) {
      throw new Error("A different staff member must validate these results");
    }

    const items = db
      .select({ id: labOrderItems.id, resultValue: labOrderItems.resultValue })
      .from(labOrderItems)
      .where(eq(labOrderItems.orderId, data.id))
      .all();
    if (items.length === 0 || items.every((item) => !item.resultValue)) {
      const hasMicro = db
        .select({
          microscopy: labOrderItems.microscopy,
          culture: labOrderItems.culture,
          urinalysis: labOrderItems.urinalysis,
        })
        .from(labOrderItems)
        .where(eq(labOrderItems.orderId, data.id))
        .all()
        .some((item) => item.microscopy || item.culture || item.urinalysis);
      if (!hasMicro) {
        throw new Error("Enter results before validating");
      }
    }

    const now = new Date().toISOString();
    const result = db
      .update(labOrders)
      .set({
        status: "validated",
        validatedBy: context.user.id,
        validatedAt: now,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(labOrders.id, data.id))
      .returning()
      .get();

    // Mark specimens consumed on release
    db.update(specimens)
      .set({ status: "consumed", updatedAt: sql`(datetime('now'))` })
      .where(
        sql`${specimens.orderId} = ${data.id} AND ${specimens.status} = 'received'`,
      )
      .run();

    writeAudit({
      actor: context.user,
      action: "validate",
      entityType: "lab_order",
      entityId: data.id,
      meta: { resultsEnteredBy: order.resultsEnteredBy },
    });

    try {
      const { notifyClientLabReportValidated } = await import("@/crm/notify-client.server");
      await notifyClientLabReportValidated(data.id);
    } catch (error) {
      console.error("[akili-lab] client report email failed", error);
    }

    return result;
  });

export const saveLabOrderResults = createServerFn({ method: "POST" })
  .middleware([crmAuthMiddleware])
  .validator(
    z.object({
      orderId: z.number().int().positive(),
      markReported: z.boolean().optional(),
      reportingTime: z.string().trim().max(40).optional().nullable(),
      sponsor: z.string().trim().max(120).optional().nullable(),
      items: z.array(
        z.object({
          id: z.number().int().positive(),
          resultValue: z.string().trim().max(2000).optional().nullable(),
          resultUnit: z.string().trim().max(40).optional().nullable(),
          resultFlag: z.string().trim().max(40).optional().nullable(),
          notes: z.string().trim().max(1000).optional().nullable(),
          urinalysis: z.string().trim().max(500).optional().nullable(),
          microscopy: z.string().trim().max(500).optional().nullable(),
          culture: z.string().trim().max(500).optional().nullable(),
          sensitivity: z.string().trim().max(500).optional().nullable(),
        }),
      ),
    }),
  )
  .handler(async ({ data, context }) => {
    const db = getDb();
    const order = db.select().from(labOrders).where(eq(labOrders.id, data.orderId)).get();
    if (!order) throw new Error("Lab order not found");
    if (order.status === "validated") {
      throw new Error("Released results are locked — amend or cancel to re-work");
    }
    if (order.status === "cancelled" || order.status === "rejected") {
      throw new Error("Cannot edit a cancelled or rejected order");
    }

    const now = new Date().toISOString();
    for (const item of data.items) {
      db.update(labOrderItems)
        .set({
          resultValue: item.resultValue || null,
          resultUnit: item.resultUnit || null,
          resultFlag: item.resultFlag || null,
          notes: item.notes || null,
          urinalysis: item.urinalysis || null,
          microscopy: item.microscopy || null,
          culture: item.culture || null,
          sensitivity: item.sensitivity || null,
          reportedAt:
            item.resultValue || item.microscopy || item.culture || item.urinalysis ? now : null,
        })
        .where(eq(labOrderItems.id, item.id))
        .run();
    }

    if (data.markReported) {
      const hasAnyResult = data.items.some(
        (item) =>
          Boolean(item.resultValue?.trim()) ||
          Boolean(item.microscopy?.trim()) ||
          Boolean(item.culture?.trim()) ||
          Boolean(item.urinalysis?.trim()),
      );
      if (!hasAnyResult) {
        throw new Error("Enter at least one result before submitting for validation");
      }
    }

    const nextStatus = data.markReported
      ? "reported"
      : order.status === "ordered" || order.status === "received"
        ? "in_progress"
        : order.status === "amended"
          ? "amended"
          : order.status;

    db.update(labOrders)
      .set({
        status: nextStatus,
        reportingTime: data.reportingTime || order.reportingTime || (data.markReported ? now : null),
        ...(data.sponsor !== undefined ? { sponsor: data.sponsor || null } : {}),
        ...(data.markReported
          ? {
              resultsEnteredBy: context.user.id,
              validatedBy: null,
              validatedAt: null,
            }
          : {}),
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(labOrders.id, data.orderId))
      .run();

    writeAudit({
      actor: context.user,
      action: data.markReported ? "submit_for_validation" : "save_results",
      entityType: "lab_order",
      entityId: data.orderId,
      meta: { itemCount: data.items.length, status: nextStatus },
    });

    return { ok: true as const, status: nextStatus };
  });
