import { Hono } from "hono";
import type { AppDb } from "../db/types.js";
import * as syncSvc from "../services/sync.js";
import { AppError } from "../lib/errors.js";
import { requireAuth, type AuthVars } from "../middleware/auth.js";

export function syncRoutes(getDb: () => AppDb) {
  const r = new Hono<AuthVars>();
  r.use("*", requireAuth);

  r.post("/", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { hid } = c.get("auth");
    try {
      const result = await syncSvc.upsertSync(getDb(), hid, {
        studentId: body.studentId,
        idempotencyKey: body.idempotencyKey,
        progressScore: body.progressScore,
        payload: body.payload,
      });
      // Strip internal helper
      const { _wonNote: _, ...out } = result;
      return c.json(out);
    } catch (e) {
      if (e instanceof AppError) {
        return c.json({ error: e.code, message: e.message }, e.status);
      }
      console.error(e);
      return c.json({ error: "internal", message: "Internal server error" }, 500);
    }
  });

  return r;
}
