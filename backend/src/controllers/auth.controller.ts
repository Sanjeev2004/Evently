import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AuthenticationError } from "../errors/AppError.js";
import { userRepository } from "../repositories/user.repository.js";
import { authService } from "../services/auth.service.js";
import { ok } from "../utils/http.js";
const cookie = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 86400000,
  path: "/api/auth",
};
export const authController = {
  register: async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.cookie("refreshToken", result.refreshToken, cookie);
    return ok(
      res,
      { user: result.user, accessToken: result.accessToken },
      "Registration successful",
      201,
    );
  },
  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password);
    res.cookie("refreshToken", result.refreshToken, cookie);
    return ok(
      res,
      { user: result.user, accessToken: result.accessToken },
      "Login successful",
    );
  },
  refresh: async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken as string | undefined;
    if (!token) throw new AuthenticationError("Refresh token missing");
    const result = await authService.refresh(token);
    res.cookie("refreshToken", result.refreshToken, cookie);
    return ok(res, { accessToken: result.accessToken }, "Token refreshed");
  },
  logout: async (req: Request, res: Response) => {
    await authService.logout(req.cookies.refreshToken as string | undefined);
    res.clearCookie("refreshToken", { path: "/api/auth" });
    return ok(res, null, "Logged out");
  },
  me: async (req: Request, res: Response) =>
    ok(res, await userRepository.findSafeById(req.user!.id), "Current user"),
};
