import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppDb } from "./db/types.js";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { consentRoutes } from "./routes/consent.js";
import { studentRoutes } from "./routes/students.js";
import { syncRoutes } from "./routes/sync.js";
import type { AuthVars } from "./middleware/auth.js";

export function createApp(getDb: () => AppDb) {
  const app = new Hono<AuthVars>();

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return "*";
        if (config.corsOrigins.includes(origin)) return origin;
        if (config.corsOrigins.includes("*")) return origin;
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
        if (origin === "capacitor://localhost" || origin === "ionic://localhost") return origin;
        return config.nodeEnv === "development" ? origin : "";
      },
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: ["Content-Length"],
      maxAge: 86400,
      credentials: true,
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, service: "brain-kit-api" }));

  app.route("/auth", authRoutes(getDb));
  app.route("/consent", consentRoutes(getDb));
  app.route("/students", studentRoutes(getDb));
  app.route("/sync", syncRoutes(getDb));

  return app;
}

export type App = ReturnType<typeof createApp>;
