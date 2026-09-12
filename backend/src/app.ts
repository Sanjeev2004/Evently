import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { RedisStore } from "rate-limit-redis";
import { prisma } from "./config/prisma.js";
import { observeRequest } from "./middleware/metrics.js";
import { redis } from "./config/redis.js";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { bookingRouter } from "./routes/booking.routes.js";
import { eventRouter } from "./routes/event.routes.js";
import { organizerRouter } from "./routes/organizer.routes.js";
export const app = express();
app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.use(observeRequest);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(pinoHttp({ logger }));
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: redis ? new RedisStore({
      prefix: "evently:login:",
      sendCommand: (...args: string[]) => redis!.call(args[0]!, ...args.slice(1)) as Promise<number | string | Array<number | string>>,
    }) : undefined,
  }),
);
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    store: redis ? new RedisStore({
      prefix: "evently:api:",
      sendCommand: (...args: string[]) => redis!.call(args[0]!, ...args.slice(1)) as Promise<number | string | Array<number | string>>,
    }) : undefined,
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({
    success: true,
    message: "healthy",
    data: { timestamp: new Date().toISOString() },
  }),
);
app.get("/api/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (redis) await redis.ping();
    res.json({ success: true, data: { database: "up", rateLimitStore: redis ? "redis" : "memory" } });
  } catch { res.status(503).json({ success: false, message: "Dependencies unavailable" }); }
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/organizer", organizerRouter);
app.use("/api/admin", adminRouter);
app.use(notFound);
app.use(errorHandler);
