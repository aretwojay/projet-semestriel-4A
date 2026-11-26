import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";
import type { GlobalSetupContext } from "vitest/node";
import { runMigrations } from "../../src/db/migrate.js";

declare module "vitest" {
  export interface ProvidedContext {
    postgresUrl: string;
  }
}

let container: StartedPostgreSqlContainer | undefined;

export async function setup({ provide }: GlobalSetupContext): Promise<void> {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const url = container.getConnectionUri();
  const pool = new pg.Pool({ connectionString: url });
  await runMigrations(pool, "migrations");
  await pool.end();
  provide("postgresUrl", url);
}

export async function teardown(): Promise<void> {
  await container?.stop();
}
