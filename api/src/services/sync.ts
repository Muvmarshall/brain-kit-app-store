/**
 * Sync semantics:
 * - Unique (student_id, idempotency_key): if the key already exists, return the prior row (idempotent).
 * - Concurrent conflicting state for the same key: highest progressScore wins
 *   (INSERT ... ON CONFLICT DO UPDATE WHERE excluded.progress_score > sync_events.progress_score,
 *    otherwise keep existing). Documented in README.
 */
import { eq, and, sql } from "drizzle-orm";
import type { AppDb } from "../db/types.js";
import { students, syncEvents } from "../db/schema.js";
import { AppError } from "../lib/errors.js";

export type SyncInput = {
  studentId: string;
  idempotencyKey: string;
  progressScore: number;
  payload: unknown;
};

export async function upsertSync(
  db: AppDb,
  householdId: string,
  input: SyncInput,
) {
  const studentId = String(input.studentId ?? "");
  const idempotencyKey = String(input.idempotencyKey ?? "").trim();
  const progressScore = Number(input.progressScore);
  const payload = input.payload ?? {};

  if (!studentId) throw new AppError(400, "invalid_student", "studentId required");
  if (!idempotencyKey) {
    throw new AppError(400, "invalid_key", "idempotencyKey required");
  }
  if (!Number.isFinite(progressScore)) {
    throw new AppError(400, "invalid_score", "progressScore must be a number");
  }

  const [stu] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.householdId, householdId)))
    .limit(1);
  if (!stu) throw new AppError(404, "not_found", "Student not found in household");

  // Idempotent read-first: if exact key exists and we aren't trying to win with higher score,
  // still apply highest-wins upsert so concurrent higher scores advance state.
  const scoreStr = String(progressScore);

  const [row] = await db
    .insert(syncEvents)
    .values({
      studentId,
      idempotencyKey,
      payload,
      progressScore: scoreStr,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [syncEvents.studentId, syncEvents.idempotencyKey],
      set: {
        // Highest progressScore wins; payload follows the winning score.
        payload: sql`CASE WHEN ${syncEvents.progressScore}::numeric < EXCLUDED.progress_score::numeric THEN EXCLUDED.payload ELSE ${syncEvents.payload} END`,
        progressScore: sql`GREATEST(${syncEvents.progressScore}::numeric, EXCLUDED.progress_score::numeric)`,
        updatedAt: sql`CASE WHEN ${syncEvents.progressScore}::numeric < EXCLUDED.progress_score::numeric THEN EXCLUDED.updated_at ELSE ${syncEvents.updatedAt} END`,
      },
    })
    .returning();

  const prior = row!;
  const won =
    Number(prior.progressScore) === progressScore ||
    Number(prior.progressScore) > progressScore;

  return {
    id: prior.id,
    studentId: prior.studentId,
    idempotencyKey: prior.idempotencyKey,
    progressScore: Number(prior.progressScore),
    payload: prior.payload,
    updatedAt: prior.updatedAt.toISOString(),
    // Helpful for clients: whether this request's score is reflected as current
    applied: Number(prior.progressScore) === progressScore || Number(prior.progressScore) > progressScore,
    highestWins: true as const,
    _wonNote: won,
  };
}
