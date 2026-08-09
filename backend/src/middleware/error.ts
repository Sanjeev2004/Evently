import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, NotFoundError } from "../errors/AppError.js";
import { logger } from "../config/logger.js";
export const notFound: RequestHandler = (req, _res, next) =>
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError)
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message, errors: err.errors });
  logger.error({ err, method: req.method, path: req.path }, "Unexpected error");
  return res
    .status(500)
    .json({ success: false, message: "Internal server error", errors: [] });
};
