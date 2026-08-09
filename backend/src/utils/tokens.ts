import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";
type Payload = { sub: string; email: string; role: Role };
export const signAccess = (p: Payload) =>
  jwt.sign(p, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
  });
export const signRefresh = (p: Payload) =>
  jwt.sign(p, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    jwtid: crypto.randomUUID(),
  });
export const verifyAccess = (t: string) =>
  jwt.verify(t, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & Payload;
export const verifyRefresh = (t: string) =>
  jwt.verify(t, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & Payload;
export const hashToken = (t: string) =>
  crypto.createHash("sha256").update(t).digest("hex");
export const bookingReference = () =>
  `EVT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
