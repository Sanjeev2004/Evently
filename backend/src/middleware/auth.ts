import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { AuthenticationError, AuthorizationError } from "../errors/AppError.js";
import { verifyAccess } from "../utils/tokens.js";
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AuthenticationError());
  try {
    const p = verifyAccess(token);
    req.user = { id: p.sub, email: p.email, role: p.role };
    next();
  } catch {
    return next(new AuthenticationError("Invalid or expired access token"));
  }
};
export const optionalAuthenticate: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next();
  try {
    const p = verifyAccess(token);
    req.user = { id: p.sub, email: p.email, role: p.role };
  } catch {
    // Public event reads remain available when a stale optional token is present.
  }
  return next();
};
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : next(new AuthorizationError());
