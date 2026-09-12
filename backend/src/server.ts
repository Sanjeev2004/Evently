import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";
const server = app.listen(env.PORT, () => logger.info({ port: env.PORT }, "Event Booking API started"));
let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  logger.info("Draining HTTP requests");
  const deadline = setTimeout(() => process.exit(1), 15000);
  deadline.unref();
  server.close(() => {
    void prisma.$disconnect().then(() => { redis?.disconnect(); clearTimeout(deadline); process.exit(0); });
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
