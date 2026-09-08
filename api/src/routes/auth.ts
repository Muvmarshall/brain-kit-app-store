import { Hono } from "hono";
import type { AppDb } from "../db/types.js";
import * as auth from "../services/auth.js";
import { AppError } from "../lib/errors.js";
import { requireAuth, type AuthVars } from "../middleware/auth.js";

export function authRoutes(getDb: () => AppDb) {
  const r = new Hono<AuthVars>();

  r.post("/signup", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    try {
      const result = await auth.signup(getDb(), body);
      return c.json(result, 201);
    } catch (e) {
      return handle(c, e);
    }
  });

  r.post("/login", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    try {
      const result = await auth.login(getDb(), body);
      return c.json(result);
    } catch (e) {
      return handle(c, e);
    }
  });

  r.post("/refresh", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    try {
      const result = await auth.refresh(getDb(), body.refreshToken);
      return c.json(result);
    } catch (e) {
      return handle(c, e);
    }
  });

  r.post("/pin/verify", requireAuth, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { hid } = c.get("auth");
    try {
      const result = await auth.verifyHouseholdPin(getDb(), hid, body.pin);
      return c.json(result);
    } catch (e) {
      return handle(c, e);
    }
  });

  return r;
}

function handle(c: { json: (b: unknown, s?: number) => Response }, e: unknown) {
  if (e instanceof AppError) {
    return c.json({ error: e.code, message: e.message }, e.status);
  }
  console.error(e);
  return c.json({ error: "internal", message: "Internal server error" }, 500);
}
