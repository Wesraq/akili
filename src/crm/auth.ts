import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { hashPassword } from "@/crm/passwords";
import type { SessionUser } from "@/crm/types";

export type { SessionUser };

/**
 * Client-safe RPC surface. Cookie/DB session helpers live in session.server.ts /
 * auth-actions.server.ts and are only loaded inside server handlers.
 */
export const crmAuthMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { readSessionUser } = await import("@/crm/session.server");
    const user = readSessionUser();
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    return next({ context: { user } });
  },
);

export const getCurrentStaff = createServerFn({ method: "GET" }).handler(async () => {
  const { readSessionUser } = await import("@/crm/session.server");
  return readSessionUser();
});

export const loginStaff = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { loginWithPassword } = await import("@/crm/auth-actions.server");
    return loginWithPassword(data.email, data.password);
  });

export const logoutStaff = createServerFn({ method: "POST" }).handler(async () => {
  const { destroySession } = await import("@/crm/session.server");
  destroySession();
  return { ok: true as const };
});

export { hashPassword };
