import { eq } from "drizzle-orm";

import { getDb } from "@/crm/db/client";
import { staffUsers } from "@/crm/db/schema";
import { verifyPassword } from "@/crm/passwords";
import { createSession } from "@/crm/session.server";
import type { SessionUser } from "@/crm/types";

export async function loginWithPassword(email: string, password: string): Promise<SessionUser> {
  const db = getDb();
  const user = db
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.email, email.trim().toLowerCase()))
    .get();

  if (!user || !user.active) {
    throw new Error("Invalid email or password");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid email or password");
  }

  createSession(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
