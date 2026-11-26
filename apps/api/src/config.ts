import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  POSTGRES_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CHECKOUT_TOKEN_SECRET: z.string().min(32),
  CHECKOUT_BASE_URL: z.url().default("http://localhost:5173"),
  MIGRATIONS_DIR: z.string().min(1).default("./migrations"),
});

export interface AppConfig {
  port: number;
  postgresUrl: string;
  jwtSecret: string;
  checkoutTokenSecret: string;
  checkoutBaseUrl: string;
  migrationsDir: string;
}

/** Lit et valide les variables d'environnement ; lève une erreur si l'une est absente ou invalide. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const e = EnvSchema.parse(env);
  return {
    port: e.PORT,
    postgresUrl: e.POSTGRES_URL,
    jwtSecret: e.JWT_SECRET,
    checkoutTokenSecret: e.CHECKOUT_TOKEN_SECRET,
    checkoutBaseUrl: e.CHECKOUT_BASE_URL,
    migrationsDir: e.MIGRATIONS_DIR,
  };
}
