import { Hono } from "hono";
import type { AppDb } from "../db/types.js";
import * as consentSvc from "../services/consent.js";
import { AppError } from "../lib/errors.js";
import { requireAuth, type AuthVars } from "../middleware/auth.js";

export function consentRoutes(getDb: () => AppDb) {
  const r = new Hono<AuthVars>();
  r.use("*", requireAuth);

  r.post("/", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { hid } = c.get("auth");
    try {
      const result = await consentSvc.giveConsent(getDb(), hid, body.mode);
      return c.json(result, 201);
    } catch (e) {
      if (e instanceof AppError) {
        return c.json({ error: e.code, message: e.message }, e.status);
      }
      console.error(e);
      return c.json({ error: "internal", message: "Internal server error" }, 500);
    }
  });

  r.get("/", async (c) => {
    const { hid } = c.get("auth");
    const row = await consentSvc.getConsent(getDb(), hid);
    if (!row) return c.json({ given: false }, 200);
    return c.json({
      given: true,
      householdId: row.householdId,
      givenAt: row.givenAt.toISOString(),
      version: row.version,
      mode: row.mode,
    });
  });

  return r;
}
