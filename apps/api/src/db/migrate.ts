import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type pg from "pg";
import { withTransaction } from "./tx.js";

/**
 * Applique, dans l'ordre alphabétique, les fichiers *.sql pas encore enregistrés dans schema_migrations.
 * Chaque fichier s'exécute dans sa propre transaction. Renvoie la liste des fichiers appliqués.
 */
export async function runMigrations(pool: pg.Pool, dir: string): Promise<string[]> {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const { rows } = await pool.query<{ filename: string }>("SELECT filename FROM schema_migrations");
  const done = new Set(rows.map((r) => r.filename));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(join(dir, file), "utf8");
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
    });
    applied.push(file);
  }
  return applied;
}
