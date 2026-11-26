import express from "express";
import type pg from "pg";
import type pino from "pino";
import { pinoHttp } from "pino-http";
import type { AppConfig } from "../config.js";
import { correlationMiddleware } from "./correlation.js";
import { notFoundHandler, problemMiddleware } from "./problem.js";

export interface AppDeps {
  config: AppConfig;
  pool: pg.Pool;
  logger: pino.Logger;
}

/** Assemble l'application Express : corrélation → logs → JSON → routes → 404 → erreurs RFC 7807. */
export function buildApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable("x-powered-by");

  app.use(correlationMiddleware);
  app.use(
    pinoHttp({
      logger: deps.logger,
      genReqId: (_req, res) => String(res.locals["correlationId"]),
      redact: ["req.headers.authorization", "*.client_secret", "*.pan", "*.cvv"],
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(notFoundHandler);
  app.use(problemMiddleware);
  return app;
}
