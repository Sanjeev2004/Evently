import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../errors/AppError.js";
export const validate =
  (
    schema: ZodType,
    source: "body" | "query" | "params" = "body",
  ): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success)
      return next(
        new ValidationError(
          "Validation failed",
          result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        ),
      );
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
