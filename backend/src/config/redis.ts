import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";
// Optional locally; configure a shared store before running multiple API replicas.
export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1, enableOfflineQueue: false,
}) : null;
redis?.on("error", (error: Error) => logger.error(error, "Redis connection error"));
