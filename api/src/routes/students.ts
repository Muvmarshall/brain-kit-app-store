import { Hono } from "hono";
import type { AppDb } from "../db/types.js";
import * as studentsSvc from "../services/students.js";
import { AppError } from "../lib/errors.js";
import { requireAuth, type AuthVars } from "../middleware/auth.js";

function serialize(s: {
  id: string;
  householdId: string;
  name: string;
  grade: string;
  createdAt: Date;
}) {
  return {
    id: s.id,
    householdId: s.householdId,
    name: s.name,
    grade: s.grade,
    createdAt: s.createdAt.toISOString(),
  };
}

export function studentRoutes(getDb: () => AppDb) {
  const r = new Hono<AuthVars>();
  r.use("*", requireAuth);

  r.get("/", async (c) => {
    const { hid } = c.get("auth");
    const rows = await studentsSvc.listStudents(getDb(), hid);
    return c.json({ students: rows.map(serialize) });
  });

  r.post("/", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { hid } = c.get("auth");
    try {
      const row = await studentsSvc.createStudent(getDb(), hid, body);
      return c.json(serialize(row), 201);
    } catch (e) {
      return handle(c, e);
    }
  });

  r.patch("/:id", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { hid } = c.get("auth");
    try {
      const row = await studentsSvc.patchStudent(getDb(), hid, c.req.param("id"), body);
      return c.json(serialize(row));
    } catch (e) {
      return handle(c, e);
    }
  });

  r.delete("/:id", async (c) => {
    const { hid } = c.get("auth");
    try {
      const result = await studentsSvc.deleteStudent(getDb(), hid, c.req.param("id"));
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
