import { prisma } from "../config/prisma.js";
export const userRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findSafeById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  create: (data: {
    name: string;
    email: string;
    passwordHash: string;
    role: "USER" | "ORGANIZER";
  }) =>
    prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    }),
};
