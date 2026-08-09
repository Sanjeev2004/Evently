import { z } from "zod";
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
  role: z.enum(["USER", "ORGANIZER"]).default("USER"),
});
export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});
const futureDate = z.coerce
  .date()
  .refine(
    (d) => d.getTime() > Date.now(),
    "Event date must be in the future",
  );
export const eventCreateSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(20).max(5000),
  category: z.string().min(2).max(60),
  venue: z.string().min(2).max(150),
  city: z.string().min(2).max(80),
  eventDate: futureDate,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  ticketPrice: z.coerce.number().min(0),
  totalSeats: z.coerce.number().int().positive().max(100000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});
export const eventUpdateSchema = eventCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");
export const eventQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["date", "price", "popularity", "createdAt"]).default("date"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export const bookingSchema = z.object({
  eventId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(10),
});
export const rejectSchema = z.object({
  reason: z.string().min(3).max(500).optional(),
});
export const userBlockSchema = z.object({ isBlocked: z.boolean() });
