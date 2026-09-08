import { eq, and, count } from "drizzle-orm";
import type { AppDb } from "../db/types.js";
import { students } from "../db/schema.js";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";
import { requireConsent } from "./consent.js";

export async function listStudents(db: AppDb, householdId: string) {
  return db
    .select({
      id: students.id,
      householdId: students.householdId,
      name: students.name,
      grade: students.grade,
      createdAt: students.createdAt,
    })
    .from(students)
    .where(eq(students.householdId, householdId));
}

export async function createStudent(
  db: AppDb,
  householdId: string,
  input: { name: string; grade: string },
) {
  await requireConsent(db, householdId);

  const name = String(input.name ?? "").trim();
  const grade = String(input.grade ?? "").trim();
  if (!name) throw new AppError(400, "invalid_name", "Student name required");
  if (!grade) throw new AppError(400, "invalid_grade", "Student grade required");

  const [{ value: n }] = await db
    .select({ value: count() })
    .from(students)
    .where(eq(students.householdId, householdId));

  if (Number(n) >= config.maxStudentsPerHousehold) {
    throw new AppError(
      409,
      "profile_cap",
      `Household may have at most ${config.maxStudentsPerHousehold} student profiles`,
    );
  }

  const [row] = await db
    .insert(students)
    .values({ householdId, name, grade })
    .returning();

  return row!;
}

export async function patchStudent(
  db: AppDb,
  householdId: string,
  studentId: string,
  input: { name?: string; grade?: string },
) {
  const [existing] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.householdId, householdId)))
    .limit(1);
  if (!existing) throw new AppError(404, "not_found", "Student not found");

  const patch: { name?: string; grade?: string } = {};
  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) throw new AppError(400, "invalid_name", "Student name required");
    patch.name = name;
  }
  if (input.grade !== undefined) {
    const grade = String(input.grade).trim();
    if (!grade) throw new AppError(400, "invalid_grade", "Student grade required");
    patch.grade = grade;
  }

  const [row] = await db
    .update(students)
    .set(patch)
    .where(eq(students.id, studentId))
    .returning();
  return row!;
}

export async function deleteStudent(
  db: AppDb,
  householdId: string,
  studentId: string,
) {
  const deleted = await db
    .delete(students)
    .where(and(eq(students.id, studentId), eq(students.householdId, householdId)))
    .returning({ id: students.id });
  if (!deleted.length) throw new AppError(404, "not_found", "Student not found");
  return { ok: true, id: deleted[0]!.id };
}
