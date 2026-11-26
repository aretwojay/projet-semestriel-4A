import type express from "express";
import { ZodError } from "zod";

const PROBLEM_BASE = "https://byte.dev/problems/";

/** Erreur métier traduite en réponse RFC 7807 (application/problem+json). */
export class ProblemError extends Error {
  constructor(
    readonly status: number,
    readonly slug: string,
    readonly title: string,
    readonly detail: string,
  ) {
    super(detail);
    this.name = "ProblemError";
  }
}

function clientErrorStatus(err: unknown): number | null {
  const status = (err as { status?: unknown; statusCode?: unknown } | null)?.status ??
    (err as { statusCode?: unknown } | null)?.statusCode;
  return typeof status === "number" && status >= 400 && status < 500 ? status : null;
}

function toProblem(err: unknown): ProblemError {
  if (err instanceof ProblemError) return err;
  if (err instanceof ZodError) {
    // Uniquement les chemins et messages : jamais les valeurs reçues (elles peuvent contenir des données sensibles).
    const detail = err.issues.map((i) => `${i.path.join(".") || "(body)"}: ${i.message}`).join("; ");
    return new ProblemError(422, "validation-error", "Validation Error", detail);
  }
  const status = clientErrorStatus(err);
  if (status !== null) {
    // Erreurs du parseur JSON (corps malformé, trop gros) : on ne renvoie jamais le corps brut.
    return new ProblemError(status, "bad-request", "Bad Request", "The request body could not be processed");
  }
  return new ProblemError(500, "internal-error", "Internal Server Error", "Unexpected error");
}

export const problemMiddleware: express.ErrorRequestHandler = (err, req, res, _next) => {
  const problem = toProblem(err);
  if (problem.status >= 500) req.log?.error({ err }, "unhandled error");
  res
    .status(problem.status)
    .type("application/problem+json")
    .json({
      type: `${PROBLEM_BASE}${problem.slug}`,
      title: problem.title,
      status: problem.status,
      detail: problem.detail,
      correlationId: res.locals["correlationId"],
    });
};

export const notFoundHandler: express.RequestHandler = (req, _res, next) => {
  next(new ProblemError(404, "not-found", "Not Found", `No route for ${req.method} ${req.path}`));
};
