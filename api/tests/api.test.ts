import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, json, signupAndLogin, type TestCtx } from "./helpers.js";

describe("Brain Kit API", () => {
  let ctx: TestCtx;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it("health check", async () => {
    const res = await json(ctx.app, "GET", "/health");
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ ok: true });
  });

  it("signup / login / refresh / pin verify", async () => {
    const signed = await signupAndLogin(ctx.app);
    expect(signed.accessToken).toBeTruthy();
    expect(signed.refreshToken).toBeTruthy();

    const login = await json(ctx.app, "POST", "/auth/login", {
      email: "parent@example.com",
      password: "password123",
    });
    expect(login.status).toBe(200);

    const refreshed = await json(ctx.app, "POST", "/auth/refresh", {
      refreshToken: signed.refreshToken,
    });
    expect(refreshed.status).toBe(200);
    const refreshData = refreshed.data as { accessToken: string; refreshToken: string };
    expect(refreshData.accessToken).toBeTruthy();

    const pinOk = await json(
      ctx.app,
      "POST",
      "/auth/pin/verify",
      { pin: "2468" },
      signed.accessToken,
    );
    expect(pinOk.status).toBe(200);
    expect(pinOk.data).toMatchObject({ ok: true });

    const pinBad = await json(
      ctx.app,
      "POST",
      "/auth/pin/verify",
      { pin: "0000" },
      signed.accessToken,
    );
    expect(pinBad.status).toBe(401);
  });

  it("consent gate: cannot create student without consent", async () => {
    const { accessToken } = await signupAndLogin(ctx.app, "gate@example.com");

    const blocked = await json(
      ctx.app,
      "POST",
      "/students",
      { name: "Ada", grade: "K" },
      accessToken,
    );
    expect(blocked.status).toBe(403);
    expect(blocked.data).toMatchObject({ error: "consent_required" });

    const consent = await json(
      ctx.app,
      "POST",
      "/consent",
      { mode: "consumer" },
      accessToken,
    );
    expect(consent.status).toBe(201);
    expect(consent.data).toMatchObject({ mode: "consumer", version: "v1" });

    const created = await json(
      ctx.app,
      "POST",
      "/students",
      { name: "Ada", grade: "K" },
      accessToken,
    );
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject({ name: "Ada", grade: "K" });
  });

  it("profile cap: max 4 students per household", async () => {
    const { accessToken } = await signupAndLogin(ctx.app, "cap@example.com");
    await json(ctx.app, "POST", "/consent", { mode: "consumer" }, accessToken);

    for (let i = 1; i <= 4; i++) {
      const res = await json(
        ctx.app,
        "POST",
        "/students",
        { name: `Kid${i}`, grade: String(i) },
        accessToken,
      );
      expect(res.status).toBe(201);
    }

    const fifth = await json(
      ctx.app,
      "POST",
      "/students",
      { name: "Extra", grade: "5" },
      accessToken,
    );
    expect(fifth.status).toBe(409);
    expect(fifth.data).toMatchObject({ error: "profile_cap" });

    const list = await json(ctx.app, "GET", "/students", undefined, accessToken);
    expect(list.status).toBe(200);
    expect((list.data as { students: unknown[] }).students).toHaveLength(4);
  });

  it("idempotent sync: same key returns prior state", async () => {
    const { accessToken } = await signupAndLogin(ctx.app, "sync1@example.com");
    await json(ctx.app, "POST", "/consent", { mode: "consumer" }, accessToken);
    const stu = await json(
      ctx.app,
      "POST",
      "/students",
      { name: "Sam", grade: "3" },
      accessToken,
    );
    const studentId = (stu.data as { id: string }).id;

    const first = await json(
      ctx.app,
      "POST",
      "/sync",
      {
        studentId,
        idempotencyKey: "session-abc",
        progressScore: 10,
        payload: { lesson: "fractions", step: 1 },
      },
      accessToken,
    );
    expect(first.status).toBe(200);
    expect(first.data).toMatchObject({
      progressScore: 10,
      payload: { lesson: "fractions", step: 1 },
    });

    // Same key + same or lower score → prior (idempotent; highest wins keeps 10)
    const second = await json(
      ctx.app,
      "POST",
      "/sync",
      {
        studentId,
        idempotencyKey: "session-abc",
        progressScore: 10,
        payload: { lesson: "fractions", step: 99 },
      },
      accessToken,
    );
    expect(second.status).toBe(200);
    expect(second.data).toMatchObject({
      progressScore: 10,
      // payload unchanged because score did not increase
      payload: { lesson: "fractions", step: 1 },
    });
    expect((second.data as { id: string }).id).toBe((first.data as { id: string }).id);
  });

  it("highest-progress-wins on concurrent sync conflict", async () => {
    const { accessToken } = await signupAndLogin(ctx.app, "sync2@example.com");
    await json(ctx.app, "POST", "/consent", { mode: "consumer" }, accessToken);
    const stu = await json(
      ctx.app,
      "POST",
      "/students",
      { name: "Max", grade: "4" },
      accessToken,
    );
    const studentId = (stu.data as { id: string }).id;

    await json(
      ctx.app,
      "POST",
      "/sync",
      {
        studentId,
        idempotencyKey: "race-1",
        progressScore: 5,
        payload: { v: "low" },
      },
      accessToken,
    );

    const higher = await json(
      ctx.app,
      "POST",
      "/sync",
      {
        studentId,
        idempotencyKey: "race-1",
        progressScore: 42,
        payload: { v: "high" },
      },
      accessToken,
    );
    expect(higher.status).toBe(200);
    expect(higher.data).toMatchObject({
      progressScore: 42,
      payload: { v: "high" },
      highestWins: true,
    });

    // Lower score must not overwrite
    const lower = await json(
      ctx.app,
      "POST",
      "/sync",
      {
        studentId,
        idempotencyKey: "race-1",
        progressScore: 7,
        payload: { v: "stale" },
      },
      accessToken,
    );
    expect(lower.status).toBe(200);
    expect(lower.data).toMatchObject({
      progressScore: 42,
      payload: { v: "high" },
    });
  });

  it("CORS allows localhost preview origins", async () => {
    const res = await ctx.app.request("/health", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization",
      },
    });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
  });
});
