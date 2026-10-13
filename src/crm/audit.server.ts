import { getDb } from "@/crm/db/client";
import { auditEvents } from "@/crm/db/schema";
import type { SessionUser } from "@/crm/types";

export function writeAudit(input: {
  actor: SessionUser | null;
  action: string;
  entityType: string;
  entityId: string | number;
  meta?: Record<string, unknown>;
}) {
  const db = getDb();
  db.insert(auditEvents)
    .values({
      actorId: input.actor?.id ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: String(input.entityId),
      meta: input.meta ? JSON.stringify(input.meta) : null,
    })
    .run();
}
