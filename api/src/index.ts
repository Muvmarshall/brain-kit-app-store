import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { getDb, closeDb } from "./db/client.js";
import { config } from "./config.js";

const app = createApp(() => getDb().db);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Brain Kit API listening on http://localhost:${info.port}`);
  console.log(`Set BKConfig.apiOrigin to http://localhost:${info.port}`);
});

async function shutdown() {
  await closeDb();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
