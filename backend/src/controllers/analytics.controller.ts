import type { Request, Response } from "express";
import { BadRequestError } from "../errors/AppError.js";
import { salesAnalytics } from "../services/analytics.service.js";
import { ok } from "../utils/http.js";
export async function analytics(req: Request, res: Response) {
  const days = Number(req.query.days ?? 30);
  if (![7, 30, 90].includes(days)) throw new BadRequestError("Choose 7, 30 or 90 days");
  res.setHeader("Cache-Control", "no-store");
  return ok(res, await salesAnalytics(days, req.user!.role === "ORGANIZER" ? req.user!.id : undefined), "Sales analytics");
}
