import type { Request, Response } from "express";
import { bookingService } from "../services/booking.service.js";
import { ok } from "../utils/http.js";
export const bookingController = {
  create: async (req: Request, res: Response) =>
    ok(
      res,
      await bookingService.create(
        req.user!.id,
        req.body.eventId,
        req.body.quantity,
      ),
      "Booking created successfully",
      201,
    ),
  my: async (req: Request, res: Response) =>
    ok(res, await bookingService.my(req.user!.id), "Bookings retrieved"),
  get: async (req: Request, res: Response) =>
    ok(
      res,
      await bookingService.get(String(req.params.id), req.user!),
      "Booking retrieved",
    ),
  cancel: async (req: Request, res: Response) =>
    ok(
      res,
      await bookingService.cancel(String(req.params.id), req.user!.id),
      "Booking cancelled",
    ),
  forEvent: async (req: Request, res: Response) =>
    ok(
      res,
      await bookingService.forEvent(String(req.params.eventId), req.user!.id),
      "Event bookings retrieved",
    ),
};
