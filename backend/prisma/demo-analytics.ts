import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(url.hostname) || /test/i.test(url.pathname)) throw new Error("Demo data is only allowed in a local development database");
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const organizer = await prisma.user.upsert({where:{email:"demo.organizer@evently.dev"},update:{},create:{name:"Evently Demo Studio",email:"demo.organizer@evently.dev",passwordHash,role:"ORGANIZER"}});
  const attendee = await prisma.user.upsert({where:{email:"demo.attendee@evently.dev"},update:{},create:{name:"Demo Attendee",email:"demo.attendee@evently.dev",passwordHash,role:"USER"}});
  const events = [
    ["Indie nights under the stars", "Music", "New Delhi", "The Garden Stage", 799, "photo-1501386761578-eac5c94b800a"],
    ["Build something that matters", "Tech", "Gurugram", "Founders Studio", 499, "photo-1519389950473-47ba0277781c"],
    ["A little colour, a little chaos", "Art", "Noida", "The Creative House", 349, "photo-1492684223066-81342ee5ff30"],
    ["Sunday run club", "Sports", "New Delhi", "Lodhi Garden", 199, "photo-1530549387789-4c1017266635"],
  ] as const;
  for (const [i, [title, category, city, venue, price, image]] of events.entries()) {
    const id = `eeeeeeee-eeee-4eee-aeee-${String(i+1).padStart(12,"0")}`;
    await prisma.$transaction(async tx => {
      if (await tx.event.findUnique({where:{id}})) return;
      const rows=Array.from({length:12},(_,j)=>({userId:attendee.id,eventId:id,quantity:1+j%3,pricePerTicket:price,totalAmount:price*(1+j%3),bookingReference:`DEMO-ANALYTICS-${i}-${j}`,status:j%5===0?"CANCELLED" as const:"CONFIRMED" as const,bookedAt:new Date(Date.now()-(j*2+i)*86400000),cancelledAt:j%5===0?new Date():null}));
      const sold=rows.filter(r=>r.status==="CONFIRMED").reduce((a,r)=>a+r.quantity,0);
      await tx.event.create({data:{id,title:`Demo: ${title}`,description:"Demonstration event for the Evently local preview. Bookings and sales shown for this event are synthetic sample data; no real money is collected.",category,city,venue,ticketPrice:price,totalSeats:150,availableSeats:150-sold,organizerId:organizer.id,status:"PUBLISHED",eventDate:new Date(Date.now()+(14+i*7)*86400000),startTime:"18:00",endTime:"21:00",imageUrl:`https://images.unsplash.com/${image}?auto=format&fit=crop&w=900&q=80`}});
      await tx.booking.createMany({data:rows});
    });
  }
  console.log("Demo ready: 4 labeled events and 48 synthetic bookings (existing demo events are preserved). Organizer: demo.organizer@evently.dev / Password123!");
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
