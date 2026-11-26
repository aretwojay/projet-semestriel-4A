import { randomUUID } from "node:crypto";
import type express from "express";

const VALID_ID = /^[A-Za-z0-9_-]{8,64}$/;

/** Reprend l'en-tête X-Correlation-Id s'il est valide, sinon en génère un, et le renvoie dans la réponse. */
export const correlationMiddleware: express.RequestHandler = (req, res, next) => {
  const incoming = req.header("X-Correlation-Id");
  const correlationId =
    incoming && VALID_ID.test(incoming) ? incoming : `corr_${randomUUID().replace(/-/g, "")}`;
  res.locals["correlationId"] = correlationId;
  res.setHeader("X-Correlation-Id", correlationId);
  next();
};
