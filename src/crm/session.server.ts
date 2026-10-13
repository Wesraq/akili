import { randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import { getDb } from "@/crm/db/client";
import { sessions, staffUsers, type StaffUser } from "@/crm/db/schema";
import type { SessionUser } from "@/crm/types";

const SESSION_COOKIE = "akili_crm_session";
const SESSION_DAYS = 14;

function toSessionUser(user: StaffUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function expiryIso(days = SESSION_DAYS) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function readSessionUser(): SessionUser | null {
  const db = getDb();
  const sessionId = getCookie(SESSION_COOKIE);
  if (!sessionId) return null;

  const row = db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: staffUsers,
    })
    .from(sessions)
    .innerJoin(staffUsers, eq(sessions.userId, staffUsers.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!row || !row.user.active) {
    if (sessionId) {
      db.delete(sessions).where(eq(sessions.id, sessionId)).run();
      deleteCookie(SESSION_COOKIE);
    }
    return null;
  }

  if (new Date(row.expiresAt).getTime() < Date.now()) {
    db.delete(sessions).where(eq(sessions.id, row.sessionId)).run();
    deleteCookie(SESSION_COOKIE);
    return null;
  }

  return toSessionUser(row.user);
}

export function requireSessionUser(): SessionUser {
  const user = readSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function createSession(userId: number) {
  const db = getDb();
  const id = randomBytes(32).toString("hex");
  db.insert(sessions)
    .values({
      id,
      userId,
      expiresAt: expiryIso(),
    })
    .run();

  setCookie(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: process.env["NODE_ENV"] === "production",
  });

  db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString())).run();
}

export function destroySession() {
  const db = getDb();
  const sessionId = getCookie(SESSION_COOKIE);
  if (sessionId) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
  }
  deleteCookie(SESSION_COOKIE);
}
