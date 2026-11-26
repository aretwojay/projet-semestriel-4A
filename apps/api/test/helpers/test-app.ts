import { Writable } from "node:stream";
import type express from "express";
import pg from "pg";
import pino from "pino";
import { inject } from "vitest";
import { loadConfig, type AppConfig } from "../../src/config.js";
import { buildApp } from "../../src/http/app.js";

export interface TestApp {
  app: express.Express;
  pool: pg.Pool;
  logs: string[];
  config: AppConfig;
}

export async function buildTestApp(): Promise<TestApp> {
  const config = loadConfig({
    POSTGRES_URL: inject("postgresUrl"),
    JWT_SECRET: "test_jwt_secret_0123456789_abcdefghij",
    CHECKOUT_TOKEN_SECRET: "test_checkout_secret_0123456789_abcdef",
    MIGRATIONS_DIR: "migrations",
  });
  const pool = new pg.Pool({ connectionString: config.postgresUrl });
  const logs: string[] = [];
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      logs.push(String(chunk));
      callback();
    },
  });
  const logger = pino({ level: "info" }, sink);
  return { app: buildApp({ config, pool, logger }), pool, logs, config };
}

export async function resetDb(pool: pg.Pool): Promise<void> {
  const { rows } = await pool.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'",
  );
  if (rows.length === 0) return;
  await pool.query(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
}
