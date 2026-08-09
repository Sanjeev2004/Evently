import { Router } from "express";
import { eventController as c } from "../controllers/event.controller.js";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/http.js";
import {
  eventCreateSchema,
  eventQuerySchema,
  eventUpdateSchema,
} from "../validators/schemas.js";
export const eventRouter = Router();
eventRouter.get("/", validate(eventQuerySchema, "query"), asyncHandler(c.list));
eventRouter.get("/:id", optionalAuthenticate, asyncHandler(c.get));
eventRouter.post(
  "/",
  authenticate,
  authorize("ORGANIZER"),
  validate(eventCreateSchema),
  asyncHandler(c.create),
);
eventRouter.patch(
  "/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  validate(eventUpdateSchema),
  asyncHandler(c.update),
);
eventRouter.delete(
  "/:id",
  authenticate,
  authorize("ORGANIZER"),
  asyncHandler(c.remove),
);
eventRouter.patch(
  "/:id/submit",
  authenticate,
  authorize("ORGANIZER"),
  asyncHandler(c.submit),
);
eventRouter.patch(
  "/:id/cancel",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  asyncHandler(c.cancel),
);
