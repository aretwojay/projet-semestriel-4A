import { loadConfig } from "../config.js";
import { runMigrations } from "./migrate.js";
import { createPool } from "./pool.js";

const config = loadConfig();
const pool = createPool(config.postgresUrl);
const applied = await runMigrations(pool, config.migrationsDir);
console.log(applied.length ? `Applied: ${applied.join(", ")}` : "No pending migration");
await pool.end();
