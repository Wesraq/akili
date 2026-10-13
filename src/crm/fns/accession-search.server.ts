import { desc, eq, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { crmAuthMiddleware } from "@/crm/auth";
import { getDb } from "@/crm/db/client";
import { clients, labOrders, leads } from "@/crm/db/schema";

const statusLabels: Record<string, string> = {
  ordered: "Accessioned",
  received: "Received",
  in_progress: "In bench",
  reported: "Awaiting validation",
  validated: "Released",
  rejected: "Rejected",
  amended: "Amended",
  cancelled: "Cancelled",
};

export type AccessionHit =
  | {
      kind: "lab_order";
      id: number;
      label: string;
      detail: string;
      href: { to: "/crm/lab-orders/$id"; params: { id: string } };
    }
  | {
      kind: "client";
      id: number;
      label: string;
      detail: string;
      href: { to: "/crm/clients/$id"; params: { id: string } };
    }
  | {
      kind: "lead";
      id: number;
      label: string;
      detail: string;
      href: { to: "/crm/leads/$id"; params: { id: string } };
    };

/**
 * Global barcode / accession / MRN / name lookup — core LIMS accession pattern.
 */
export const searchAccession = createServerFn({ method: "GET" })
  .middleware([crmAuthMiddleware])
  .validator(z.object({ q: z.string().trim().min(1).max(120) }))
  .handler(async ({ data }): Promise<AccessionHit[]> => {
    const db = getDb();
    const raw = data.q.trim();
    const needle = raw.toLowerCase();
    const hits: AccessionHit[] = [];

    const pushOrder = (order: {
      order: typeof labOrders.$inferSelect;
      clientName: string;
      labMrn: string | null;
    }) => {
      const acc = order.order.accessionNumber || `LAB-${order.order.id}`;
      const statusLabel = statusLabels[order.order.status] ?? order.order.status;
      hits.push({
        kind: "lab_order",
        id: order.order.id,
        label: acc,
        detail: `${order.clientName}${order.labMrn ? ` · ${order.labMrn}` : ""} · ${statusLabel}`,
        href: { to: "/crm/lab-orders/$id", params: { id: String(order.order.id) } },
      });
    };

    // Exact accession number
    const byAcc = db
      .select({
        order: labOrders,
        clientName: clients.name,
        labMrn: clients.labMrn,
      })
      .from(labOrders)
      .innerJoin(clients, eq(labOrders.clientId, clients.id))
      .where(sql`lower(${labOrders.accessionNumber}) = ${needle}`)
      .get();
    if (byAcc) pushOrder(byAcc);

    // LAB-123 / #123 / bare id
    const orderIdMatch = raw.replace(/^#/, "").match(/^(?:LAB-)?(\d+)$/i);
    if (orderIdMatch) {
      const id = Number(orderIdMatch[1]);
      const order = db
        .select({
          order: labOrders,
          clientName: clients.name,
          labMrn: clients.labMrn,
        })
        .from(labOrders)
        .innerJoin(clients, eq(labOrders.clientId, clients.id))
        .where(eq(labOrders.id, id))
        .get();
      if (order && !hits.some((h) => h.kind === "lab_order" && h.id === order.order.id)) {
        pushOrder(order);
      }
    }

    // Partial accession match
    if (needle.includes("acc") || needle.length >= 3) {
      const partial = db
        .select({
          order: labOrders,
          clientName: clients.name,
          labMrn: clients.labMrn,
        })
        .from(labOrders)
        .innerJoin(clients, eq(labOrders.clientId, clients.id))
        .where(sql`lower(${labOrders.accessionNumber}) like ${"%" + needle + "%"}`)
        .orderBy(desc(labOrders.orderedAt))
        .limit(6)
        .all();
      for (const row of partial) {
        if (!hits.some((h) => h.kind === "lab_order" && h.id === row.order.id)) {
          pushOrder(row);
        }
      }
    }

    const clientRows = db
      .select()
      .from(clients)
      .orderBy(desc(clients.updatedAt))
      .limit(80)
      .all()
      .filter(
        (row) =>
          (row.labMrn ?? "").toLowerCase() === needle ||
          (row.labMrn ?? "").toLowerCase().includes(needle) ||
          row.name.toLowerCase().includes(needle) ||
          (row.phone ?? "").toLowerCase().includes(needle) ||
          (row.nationalId ?? "").toLowerCase().includes(needle) ||
          (row.email ?? "").toLowerCase().includes(needle),
      )
      .slice(0, 8);

    for (const row of clientRows) {
      hits.push({
        kind: "client",
        id: row.id,
        label: row.name,
        detail: `${row.labMrn ?? `AKL-${String(row.id).padStart(5, "0")}`} · ${row.type}${row.phone ? ` · ${row.phone}` : ""}`,
        href: { to: "/crm/clients/$id", params: { id: String(row.id) } },
      });
    }

    const leadRows = db
      .select()
      .from(leads)
      .orderBy(desc(leads.updatedAt))
      .limit(40)
      .all()
      .filter(
        (row) =>
          row.reference.toLowerCase().includes(needle) ||
          row.fullName.toLowerCase().includes(needle) ||
          row.email.toLowerCase().includes(needle) ||
          row.phone.toLowerCase().includes(needle),
      )
      .slice(0, 5);

    for (const row of leadRows) {
      hits.push({
        kind: "lead",
        id: row.id,
        label: row.fullName,
        detail: `${row.reference} · ${row.status} · website request`,
        href: { to: "/crm/leads/$id", params: { id: String(row.id) } },
      });
    }

    hits.sort((a, b) => {
      const rank = (hit: AccessionHit) => {
        if (hit.kind === "lab_order") return 0;
        if (hit.kind === "client" && hit.detail.toLowerCase().startsWith(needle)) return 1;
        if (hit.kind === "client") return 2;
        return 3;
      };
      return rank(a) - rank(b);
    });

    return hits.slice(0, 12);
  });
