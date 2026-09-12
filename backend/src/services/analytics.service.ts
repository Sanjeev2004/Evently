import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
export async function salesAnalytics(days: number, organizerId?: string) {
  const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - days + 1);
  const until = new Date(since); until.setUTCDate(until.getUTCDate() + days);
  const owner = organizerId ? Prisma.sql`AND e."organizerId" = ${organizerId}` : Prisma.empty;
  const [daily, topEvents] = await prisma.$transaction([
    prisma.$queryRaw<Array<{ day: string; bookings: number; tickets: number; amount: string; cancelled: number }>>(Prisma.sql`
      SELECT to_char(b."bookedAt", 'YYYY-MM-DD') AS day,
        COUNT(*) FILTER (WHERE b.status = 'CONFIRMED')::int AS bookings,
        COALESCE(SUM(b.quantity) FILTER (WHERE b.status = 'CONFIRMED'), 0)::int AS tickets,
        COALESCE(SUM(b."totalAmount") FILTER (WHERE b.status = 'CONFIRMED'), 0)::text AS amount,
        COUNT(*) FILTER (WHERE b.status <> 'CONFIRMED')::int AS cancelled
      FROM "Booking" b JOIN "Event" e ON e.id = b."eventId"
      WHERE b."bookedAt" >= ${since} AND b."bookedAt" < ${until} ${owner}
      GROUP BY day ORDER BY day`),
    prisma.$queryRaw<Array<{ id: string; title: string; tickets: number; amount: string }>>(Prisma.sql`
      SELECT e.id, e.title, SUM(b.quantity)::int AS tickets, SUM(b."totalAmount")::text AS amount
      FROM "Booking" b JOIN "Event" e ON e.id = b."eventId"
      WHERE b.status = 'CONFIRMED' AND b."bookedAt" >= ${since} AND b."bookedAt" < ${until} ${owner}
      GROUP BY e.id, e.title ORDER BY SUM(b."totalAmount") DESC, e.id LIMIT 5`),
  ]);
  const trend = Array.from({ length: days }, (_, i) => {
    const day = new Date(since); day.setUTCDate(day.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    const row = daily.find(d => d.day === key);
    return { day: key, bookings: row?.bookings ?? 0, tickets: row?.tickets ?? 0, amount: Number(row?.amount ?? 0), cancelled: row?.cancelled ?? 0 };
  });
  const totals = trend.reduce((a, d) => ({ bookings: a.bookings + d.bookings, tickets: a.tickets + d.tickets, amount: a.amount + d.amount, cancelled: a.cancelled + d.cancelled }), { bookings: 0, tickets: 0, amount: 0, cancelled: 0 });
  return { days, timezone: "UTC", generatedAt: new Date().toISOString(), totals, trend,
    averageBookingValue: totals.bookings ? totals.amount / totals.bookings : 0,
    cancellationRate: totals.bookings + totals.cancelled ? totals.cancelled / (totals.bookings + totals.cancelled) * 100 : 0,
    topEvents, paymentMode: "Simulated checkout; amounts are booking value, not collected revenue" };
}
