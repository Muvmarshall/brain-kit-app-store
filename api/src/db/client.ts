import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { config } from "../config.js";

export type Db = ReturnType<typeof createDb>;

export function createDb(connectionString = config.databaseUrl) {
  const sql = postgres(connectionString, { max: 10 });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

let singleton: Db | null = null;

export function getDb(): Db {
  if (!singleton) singleton = createDb();
  return singleton;
}

export async function closeDb(): Promise<void> {
  if (singleton) {
    await singleton.sql.end({ timeout: 5 });
    singleton = null;
  }
}
