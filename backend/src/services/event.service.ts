import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from "../errors/AppError.js";
import { eventRepository } from "../repositories/event.repository.js";
type Query = {
  search?: string;
  category?: string;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  order: "asc" | "desc";
  page: number;
  limit: number;
};
export const eventService = {
  async list(q: Query) {
    const where: Prisma.EventWhereInput = {
      status: "PUBLISHED",
      eventDate: {
        gte: q.dateFrom ?? new Date(),
        ...(q.dateTo && { lte: q.dateTo }),
      },
      ...(q.category && {
        category: { equals: q.category, mode: "insensitive" },
      }),
      ...(q.city && { city: { equals: q.city, mode: "insensitive" } }),
      ...((q.minPrice !== undefined || q.maxPrice !== undefined) && {
        ticketPrice: { gte: q.minPrice, lte: q.maxPrice },
      }),
      ...(q.search && {
        OR: ["title", "venue", "city", "category"].map((k) => ({
          [k]: { contains: q.search, mode: "insensitive" },
        })),
      }),
    };
    const orderBy: Prisma.EventOrderByWithRelationInput =
      q.sort === "price"
        ? { ticketPrice: q.order }
        : q.sort === "createdAt"
          ? { createdAt: q.order }
          : q.sort === "popularity"
            ? { bookings: { _count: q.order } }
            : { eventDate: q.order };
    const [items, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        include: {
          organizer: { select: { id: true, name: true } },
          _count: { select: { bookings: true } },
        },
        orderBy,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.event.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        pages: Math.ceil(total / q.limit),
      },
    };
  },
  async get(id: string, viewer?: { id: string; role: string }) {
    const e = await eventRepository.byId(id);
    if (!e) throw new NotFoundError("Event not found");
    if (
      e.status !== "PUBLISHED" &&
      viewer?.role !== "ADMIN" &&
      viewer?.id !== e.organizerId
    )
      throw new NotFoundError("Event not found");
    return e;
  },
  async create(organizerId: string, input: Record<string, unknown>) {
    return eventRepository.create({
      ...input,
      organizerId,
      availableSeats: input.totalSeats as number,
    } as Prisma.EventUncheckedCreateInput);
  },
  async update(
    id: string,
    user: { id: string; role: string },
    input: Prisma.EventUpdateInput,
  ) {
    const e = await eventRepository.byId(id);
    if (!e) throw new NotFoundError("Event not found");
    if (user.role !== "ADMIN" && e.organizerId !== user.id)
      throw new AuthorizationError();
    if (["CANCELLED", "COMPLETED"].includes(e.status))
      throw new BadRequestError(
        "Cancelled or completed events cannot be updated",
      );
    if (input.totalSeats !== undefined) {
      const sold = e.totalSeats - e.availableSeats;
      const total = Number(input.totalSeats);
      if (total < sold)
        throw new BadRequestError(
          "Total seats cannot be lower than tickets already sold",
        );
      input.availableSeats = total - sold;
    }
    return eventRepository.update(id, {
      ...input,
      ...(e.status === "PUBLISHED" && user.role !== "ADMIN"
        ? { status: "PENDING_APPROVAL" }
        : {}),
    });
  },
  async submit(id: string, userId: string) {
    const e = await eventRepository.byId(id);
    if (!e) throw new NotFoundError("Event not found");
    if (e.organizerId !== userId) throw new AuthorizationError();
    if (!["DRAFT", "REJECTED"].includes(e.status))
      throw new BadRequestError(
        "Only draft or rejected events can be submitted",
      );
    return eventRepository.update(id, { status: "PENDING_APPROVAL" });
  },
  async moderate(id: string, status: "PUBLISHED" | "REJECTED") {
    const e = await eventRepository.byId(id);
    if (!e) throw new NotFoundError("Event not found");
    if (e.status !== "PENDING_APPROVAL")
      throw new BadRequestError("Event is not pending approval");
    return eventRepository.update(id, { status });
  },
  async cancel(id: string, user: { id: string; role: string }) {
    const e = await eventRepository.byId(id);
    if (!e) throw new NotFoundError("Event not found");
    if (user.role !== "ADMIN" && e.organizerId !== user.id)
      throw new AuthorizationError();
    if (["CANCELLED", "COMPLETED"].includes(e.status))
      throw new BadRequestError("Event cannot be cancelled");
    return eventRepository.update(id, { status: "CANCELLED" });
  },
  async remove(id: string, userId: string) {
    const e = await eventRepository.byId(id);
    if (!e) throw new NotFoundError("Event not found");
    if (e.organizerId !== userId) throw new AuthorizationError();
    return (await eventRepository.countBookings(id)) > 0
      ? eventRepository.update(id, { status: "CANCELLED" })
      : prisma.event.delete({ where: { id } });
  },
  organizerEvents: (id: string) =>
    prisma.event.findMany({
      where: { organizerId: id },
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
    }),
};
