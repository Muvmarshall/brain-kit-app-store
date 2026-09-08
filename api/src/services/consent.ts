import { eq } from "drizzle-orm";
import type { AppDb } from "../db/types.js";
import { consent } from "../db/schema.js";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";

const MODES = new Set(["consumer", "school", "teacher"]);

export async function giveConsent(
  db: AppDb,
  householdId: string,
  mode: string,
) {
  const m = String(mode ?? "").trim().toLowerCase();
  if (!MODES.has(m)) {
    throw new AppError(400, "invalid_mode", "mode must be consumer, school, or teacher");
  }

  const [row] = await db
    .insert(consent)
    .values({
      householdId,
      givenAt: new Date(),
      version: config.consentVersion,
      mode: m,
    })
    .onConflictDoUpdate({
      target: consent.householdId,
      set: {
        givenAt: new Date(),
        version: config.consentVersion,
        mode: m,
      },
    })
    .returning();

  return {
    householdId: row!.householdId,
    givenAt: row!.givenAt.toISOString(),
    version: row!.version,
    mode: row!.mode,
  };
}

export async function getConsent(db: AppDb, householdId: string) {
  const [row] = await db
    .select()
    .from(consent)
    .where(eq(consent.householdId, householdId))
    .limit(1);
  return row ?? null;
}

export async function requireConsent(db: AppDb, householdId: string) {
  const c = await getConsent(db, householdId);
  if (!c) {
    throw new AppError(
      403,
      "consent_required",
      "Parental consent required before creating student profiles (COPPA)",
    );
  }
  return c;
}
