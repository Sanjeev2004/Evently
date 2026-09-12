import { metricsSnapshot } from "../middleware/metrics.js";
import { analytics } from "../controllers/analytics.controller.js";
import { Router } from "express";
import { adminController as c } from "../controllers/admin.controller.js";
import { eventController } from "../controllers/event.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/http.js";
import { rejectSchema, userBlockSchema } from "../validators/schemas.js";
export const adminRouter = Router();
adminRouter.use(authenticate, authorize("ADMIN"));
adminRouter.get("/analytics", asyncHandler(analytics));
adminRouter.get("/stats", asyncHandler(c.stats));
adminRouter.get("/metrics", (_req, res) => res.set("Cache-Control", "no-store").json({ success: true, data: metricsSnapshot() }));
adminRouter.get("/users", asyncHandler(c.users));
adminRouter.patch(
  "/users/:id/block",
  validate(userBlockSchema),
  asyncHandler(c.block),
);
adminRouter.get("/events", asyncHandler(c.events));
adminRouter.patch("/events/:id/approve", asyncHandler(c.approve));
adminRouter.patch(
  "/events/:id/reject",
  validate(rejectSchema),
  asyncHandler(c.reject),
);
adminRouter.patch("/events/:id/cancel", asyncHandler(eventController.cancel));
adminRouter.get("/bookings", asyncHandler(c.bookings));
