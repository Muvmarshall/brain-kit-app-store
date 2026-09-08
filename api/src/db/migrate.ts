/**
 * Apply SQL migrations from ./migrations in lexical order.
 * Works with real Postgres (DATABASE_URL) — used by docker-compose and local.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../../migrations");

async function main() {
  const url =
    process.env.DATABASE_URL ??
    "postgres://brainkit:brainkit@localhost:5432/brainkit";
  const sql = postgres(url, { max: 1 });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const applied = await sql`SELECT 1 FROM schema_migrations WHERE id = ${file}`;
      if (applied.length) {
        console.log(`skip  ${file}`);
        continue;
      }
      const body = readFileSync(join(migrationsDir, file), "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`INSERT INTO schema_migrations (id) VALUES (${file})`;
      });
      console.log(`apply ${file}`);
    }
    console.log("migrations complete");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
