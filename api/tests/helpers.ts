import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../src/db/schema.js";
import { createApp, type App } from "../src/app.js";
import type { AppDb } from "../src/db/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../migrations");

export type TestCtx = {
  app: App;
  db: AppDb;
  client: PGlite;
  close: () => Promise<void>;
};

export async function createTestApp(): Promise<TestCtx> {
  const client = new PGlite();
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    let body = readFileSync(join(migrationsDir, file), "utf8");
    body = body.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";?\n?/g, "");
    await client.exec(body);
  }

  const db = drizzle(client, { schema }) as unknown as AppDb;
  const app = createApp(() => db);

  return {
    app,
    db,
    client,
    close: async () => {
      await client.close();
    },
  };
}

export async function json(
  app: App,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
}

export async function signupAndLogin(app: App, email = "parent@example.com") {
  const res = await json(app, "POST", "/auth/signup", {
    email,
    password: "password123",
    pin: "2468",
  });
  if (res.status !== 201) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.data)}`);
  }
  const data = res.data as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; householdId: string; email: string };
  };
  return data;
}
