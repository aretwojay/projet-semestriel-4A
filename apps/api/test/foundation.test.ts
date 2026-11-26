import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "../src/db/migrate.js";
import { buildTestApp, type TestApp } from "./helpers/test-app.js";

describe("API foundation", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await buildTestApp();
  });

  afterAll(async () => {
    await t.pool.end();
  });

  it("GET /health answers ok with a generated correlation id", async () => {
    const res = await request(t.app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
    expect(res.headers["x-correlation-id"]).toMatch(/^corr_[a-f0-9]{32}$/);
  });

  it("keeps a valid incoming X-Correlation-Id and replaces an invalid one", async () => {
    const kept = await request(t.app).get("/health").set("X-Correlation-Id", "abc_12345678");
    expect(kept.headers["x-correlation-id"]).toBe("abc_12345678");
    const replaced = await request(t.app).get("/health").set("X-Correlation-Id", "bad id!");
    expect(replaced.headers["x-correlation-id"]).toMatch(/^corr_/);
  });

  it("unknown routes and malformed JSON return RFC 7807 problems", async () => {
    const notFound = await request(t.app).get("/nope");
    expect(notFound.status).toBe(404);
    expect(notFound.headers["content-type"]).toContain("application/problem+json");
    expect(notFound.body).toMatchObject({ type: "https://byte.dev/problems/not-found", status: 404 });
    expect(notFound.body.correlationId).toMatch(/^corr_/);

    const malformed = await request(t.app)
      .post("/health")
      .set("Content-Type", "application/json")
      .send('{"pan":"4242');
    expect(malformed.status).toBe(400);
    expect(malformed.headers["content-type"]).toContain("application/problem+json");
    expect(JSON.stringify(malformed.body)).not.toContain("4242");
  });

  it("migrations already applied are not re-applied", async () => {
    expect(await runMigrations(t.pool, t.config.migrationsDir)).toEqual([]);
  });
});
