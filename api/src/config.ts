import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 8787),
  databaseUrl: required(
    "DATABASE_URL",
    "postgres://brainkit:brainkit@localhost:5432/brainkit",
  ),
  jwtSecret: required(
    "JWT_SECRET",
    "dev-only-change-me-brain-kit-jwt-secret-32c",
  ),
  accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS ?? 30),
  consentVersion: process.env.CONSENT_VERSION ?? "v1",
  corsOrigins: (process.env.CORS_ORIGINS ??
    "http://localhost:5173,http://localhost:3000,http://localhost:8080,http://127.0.0.1:5173,capacitor://localhost,http://localhost")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  maxStudentsPerHousehold: 4,
};

export type AppConfig = typeof config;
