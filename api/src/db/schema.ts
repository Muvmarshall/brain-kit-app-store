import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  pinHash: text("pin_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
    householdIdx: index("users_household_id_idx").on(t.householdId),
  }),
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    tokenHashUnique: uniqueIndex("refresh_tokens_token_hash_unique").on(t.tokenHash),
    userIdx: index("refresh_tokens_user_id_idx").on(t.userId),
  }),
);

export const consent = pgTable("consent", {
  householdId: uuid("household_id")
    .primaryKey()
    .references(() => households.id, { onDelete: "cascade" }),
  givenAt: timestamp("given_at", { withTimezone: true }).notNull().defaultNow(),
  version: text("version").notNull(),
  mode: text("mode").notNull(), // consumer | school | teacher
});

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    grade: text("grade").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    householdIdx: index("students_household_id_idx").on(t.householdId),
  }),
);

export const syncEvents = pgTable(
  "sync_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    payload: jsonb("payload").notNull().default({}),
    progressScore: numeric("progress_score").notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idempotencyUnique: uniqueIndex("sync_events_student_idempotency_unique").on(
      t.studentId,
      t.idempotencyKey,
    ),
    studentIdx: index("sync_events_student_id_idx").on(t.studentId),
  }),
);

export type Household = typeof households.$inferSelect;
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type SyncEvent = typeof syncEvents.$inferSelect;
export type Consent = typeof consent.$inferSelect;
