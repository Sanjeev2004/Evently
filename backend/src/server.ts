import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
const server = app.listen(env.PORT, () =>
  logger.info({ port: env.PORT }, "Event Booking API started"),
);
const shutdown = async () => {
  logger.info("Shutting down");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
