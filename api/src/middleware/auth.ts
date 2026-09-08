import type { Context, Next } from "hono";
import { verifyAccessToken, type AccessClaims } from "../lib/tokens.js";

export type AuthVars = {
  Variables: {
    auth: AccessClaims;
  };
};

export async function requireAuth(c: Context<AuthVars>, next: Next) {
  const header = c.req.header("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) {
    return c.json({ error: "unauthorized", message: "Bearer token required" }, 401);
  }
  try {
    const claims = await verifyAccessToken(m[1]!);
    c.set("auth", claims);
    await next();
  } catch {
    return c.json({ error: "unauthorized", message: "Invalid or expired token" }, 401);
  }
}
