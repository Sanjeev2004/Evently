import type { NextFunction, Request, RequestHandler, Response } from "express";
export const ok = (
  res: Response,
  data: unknown,
  message = "Request successful",
  status = 200,
) => res.status(status).json({ success: true, message, data });
export const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
