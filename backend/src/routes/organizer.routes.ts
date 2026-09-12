import { analytics } from "../controllers/analytics.controller.js";
import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { bookingController } from "../controllers/booking.controller.js";
import { eventController } from "../controllers/event.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";
export const organizerRouter = Router();
organizerRouter.use(authenticate, authorize("ORGANIZER"));
organizerRouter.get("/events", asyncHandler(eventController.mine));
organizerRouter.get(
  "/events/:eventId/bookings",
  asyncHandler(bookingController.forEvent),
);
organizerRouter.get("/analytics", asyncHandler(analytics));
organizerRouter.get("/stats", asyncHandler(adminController.organizerStats));
