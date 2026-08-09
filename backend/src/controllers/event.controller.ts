import type { Request, Response } from "express";
import { eventService } from "../services/event.service.js";
import { ok } from "../utils/http.js";
export const eventController = {
  list: async (req: Request, res: Response) =>
    ok(res, await eventService.list(req.query as never), "Events retrieved"),
  get: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.get(String(req.params.id), req.user),
      "Event retrieved",
    ),
  create: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.create(req.user!.id, req.body),
      "Event created",
      201,
    ),
  update: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.update(String(req.params.id), req.user!, req.body),
      "Event updated",
    ),
  remove: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.remove(String(req.params.id), req.user!.id),
      "Event deleted or cancelled",
    ),
  submit: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.submit(String(req.params.id), req.user!.id),
      "Event submitted for approval",
    ),
  cancel: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.cancel(String(req.params.id), req.user!),
      "Event cancelled",
    ),
  mine: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.organizerEvents(req.user!.id),
      "Organizer events retrieved",
    ),
};
