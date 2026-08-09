import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import { eventService } from "../services/event.service.js";
import { ok } from "../utils/http.js";
export const adminController = {
  approve: async (req: Request, res: Response) => {
    const e = await eventService.moderate(String(req.params.id), "PUBLISHED");
    logger.info({ eventId: e.id, adminId: req.user!.id }, "Event approved");
    return ok(res, e, "Event approved");
  },
  reject: async (req: Request, res: Response) =>
    ok(
      res,
      await eventService.moderate(String(req.params.id), "REJECTED"),
      "Event rejected",
    ),
  users: async (_req: Request, res: Response) =>
    ok(
      res,
      await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      "Users retrieved",
    ),
  block: async (req: Request, res: Response) =>
    ok(
      res,
      await prisma.user.update({
        where: { id: String(req.params.id) },
        data: { isBlocked: req.body.isBlocked },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
        },
      }),
      "User status updated",
    ),
  events: async (_req: Request, res: Response) =>
    ok(
      res,
      await prisma.event.findMany({
        include: {
          organizer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      "Events retrieved",
    ),
  bookings: async (_req: Request, res: Response) =>
    ok(
      res,
      await prisma.booking.findMany({
        include: {
          user: { select: { name: true, email: true } },
          event: { select: { title: true } },
        },
        orderBy: { bookedAt: "desc" },
      }),
      "Bookings retrieved",
    ),
  stats: async (_req: Request, res: Response) => {
    const [users, organizers, events, pending, bookings, revenue] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { role: "ORGANIZER" } }),
        prisma.event.count(),
        prisma.event.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.booking.count({ where: { status: "CONFIRMED" } }),
        prisma.booking.aggregate({
          where: { status: "CONFIRMED" },
          _sum: { totalAmount: true },
        }),
      ]);
    return ok(
      res,
      {
        totalUsers: users,
        totalOrganizers: organizers,
        totalEvents: events,
        pendingApprovals: pending,
        totalBookings: bookings,
        totalRevenue: revenue._sum.totalAmount ?? 0,
      },
      "Platform statistics",
    );
  },
  organizerStats: async (req: Request, res: Response) => {
    const id = req.user!.id;
    const [total, published, upcoming, sales] = await prisma.$transaction([
      prisma.event.count({ where: { organizerId: id } }),
      prisma.event.count({ where: { organizerId: id, status: "PUBLISHED" } }),
      prisma.event.count({
        where: {
          organizerId: id,
          status: "PUBLISHED",
          eventDate: { gt: new Date() },
        },
      }),
      prisma.booking.aggregate({
        where: { event: { organizerId: id }, status: "CONFIRMED" },
        _sum: { quantity: true, totalAmount: true },
      }),
    ]);
    return ok(
      res,
      {
        totalEvents: total,
        publishedEvents: published,
        upcomingEvents: upcoming,
        totalTicketsSold: sales._sum.quantity ?? 0,
        totalRevenue: sales._sum.totalAmount ?? 0,
      },
      "Organizer statistics",
    );
  },
};
