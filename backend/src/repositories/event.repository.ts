import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
export const eventRepository = {
  byId: (id: string) =>
    prisma.event.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, name: true } } },
    }),
  create: (data: Prisma.EventUncheckedCreateInput) =>
    prisma.event.create({ data }),
  update: (id: string, data: Prisma.EventUpdateInput) =>
    prisma.event.update({ where: { id }, data }),
  countBookings: (id: string) =>
    prisma.booking.count({ where: { eventId: id } }),
};
