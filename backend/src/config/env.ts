import "dotenv/config";
import { z } from "zod";
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  FRONTEND_URL: z.string().url(),
  COOKIE_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
});
export const env = schema.parse(process.env);
