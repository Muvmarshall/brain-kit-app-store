import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./schema.js";

/** Drizzle DB handle used by services/routes (postgres-js or pglite in tests). */
export type AppDb = PostgresJsDatabase<typeof schema>;
