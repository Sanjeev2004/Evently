import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import { bookingReference } from "../utils/tokens.js";
export const bookingService = {
  async create(userId: string, eventId: string, quantity: number) {
    return prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.isBlocked)
          throw new AuthorizationError("Blocked users cannot make bookings");
        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event) throw new NotFoundError("Event not found");
        if (event.status !== "PUBLISHED")
          throw new BadRequestError("Only published events can be booked");
        if (event.eventDate <= new Date())
          throw new BadRequestError("Past events cannot be booked");
        // The predicate and decrement execute as one PostgreSQL UPDATE. Competing requests cannot both claim the same seats; only an update observing sufficient inventory succeeds.
        const claimed = await tx.event.updateMany({
          where: {
            id: eventId,
            status: "PUBLISHED",
            availableSeats: { gte: quantity },
          },
          data: { availableSeats: { decrement: quantity } },
        });
        if (claimed.count !== 1)
          throw new ConflictError("Not enough seats available");
        const price = event.ticketPrice;
        const booking = await tx.booking.create({
          data: {
            userId,
            eventId,
            quantity,
            pricePerTicket: price,
            totalAmount: new Prisma.Decimal(price).mul(quantity),
            bookingReference: bookingReference(),
          },
        });
        logger.info(
          { bookingId: booking.id, eventId, quantity },
          "Booking created",
        );
        return booking;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  },
  my: (userId: string) =>
    prisma.booking.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { bookedAt: "desc" },
    }),
  async get(id: string, user: { id: string; role: string }) {
    const b = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: { include: { organizer: { select: { id: true, name: true } } } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!b) throw new NotFoundError("Booking not found");
    if (
      user.role !== "ADMIN" &&
      b.userId !== user.id &&
      b.event.organizerId !== user.id
    )
      throw new AuthorizationError();
    return b;
  },
  async cancel(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const b = await tx.booking.findUnique({
        where: { id },
        include: { event: true },
      });
      if (!b) throw new NotFoundError("Booking not found");
      if (b.userId !== userId)
        throw new AuthorizationError(
          "You cannot cancel another user's booking",
        );
      if (b.status !== "CONFIRMED")
        throw new BadRequestError("Booking is not active");
      if (b.event.eventDate.getTime() - Date.now() < 24 * 60 * 60 * 1000)
        throw new BadRequestError(
          "Cancellation closes 24 hours before the event",
        );
      const updated = await tx.booking.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.event.update({
        where: { id: b.eventId },
        data: { availableSeats: { increment: b.quantity } },
      });
      logger.info({ bookingId: id }, "Booking cancelled");
      return updated;
    });
  },
  async forEvent(eventId: string, organizerId: string) {
    const e = await prisma.event.findUnique({ where: { id: eventId } });
    if (!e) throw new NotFoundError("Event not found");
    if (e.organizerId !== organizerId) throw new AuthorizationError();
    return prisma.booking.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { bookedAt: "desc" },
    });
  },
};
