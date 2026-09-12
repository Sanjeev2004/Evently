import bcrypt from'bcryptjs';import request from'supertest';import{app}from'../src/app.js';import{prisma}from'../src/config/prisma.js';
const password='Password123!';let organizerToken='';let userToken='';let adminToken='';let eventId='';let bookingId='';
const register=(email:string,role:'USER'|'ORGANIZER'='USER')=>request(app).post('/api/auth/register').send({name:'Test Person',email,password,role});
beforeAll(async()=>{await prisma.refreshToken.deleteMany();await prisma.booking.deleteMany();await prisma.event.deleteMany();await prisma.user.deleteMany();const admin=await prisma.user.create({data:{name:'Admin',email:'admin@test.dev',passwordHash:await bcrypt.hash(password,4),role:'ADMIN'}});const login=async(email:string)=>{const r=await request(app).post('/api/auth/login').send({email,password});return r.body.data.accessToken as string;};adminToken=await login(admin.email);});afterAll(()=>prisma.$disconnect());
describe('authentication and authorization',()=>{test('registers a user',async()=>{const r=await register('user@test.dev');expect(r.status).toBe(201);expect(r.body.data.user).not.toHaveProperty('passwordHash');userToken=r.body.data.accessToken;});test('rejects duplicate email',async()=>expect((await register('user@test.dev')).status).toBe(409));test('logs in with valid credentials',async()=>expect((await request(app).post('/api/auth/login').send({email:'user@test.dev',password})).status).toBe(200));test('rejects invalid credentials',async()=>expect((await request(app).post('/api/auth/login').send({email:'user@test.dev',password:'wrong-pass'})).status).toBe(401));test('rejects unauthenticated access',async()=>expect((await request(app).get('/api/bookings/my')).status).toBe(401));test('normal user cannot create an event',async()=>expect((await request(app).post('/api/events').set('Authorization',`Bearer ${userToken}`).send({})).status).toBe(403));});
describe('events and bookings',()=>{test('organizer creates an event and admin approves it',async()=>{const r=await register('organizer@test.dev','ORGANIZER');organizerToken=r.body.data.accessToken;const future=new Date(Date.now()+7*86400000).toISOString();const created=await request(app).post('/api/events').set('Authorization',`Bearer ${organizerToken}`).send({title:'Integration Test Event',description:'A detailed description suitable for validation.',category:'Tech',venue:'Test Hall',city:'Pune',eventDate:future,startTime:'10:00',endTime:'12:00',ticketPrice:100,totalSeats:5});expect(created.status).toBe(201);eventId=created.body.data.id;await request(app).patch(`/api/events/${eventId}/submit`).set('Authorization',`Bearer ${organizerToken}`);expect((await request(app).patch(`/api/admin/events/${eventId}/approve`).set('Authorization',`Bearer ${adminToken}`)).status).toBe(200);});test('books tickets and rejects insufficient inventory',async()=>{const booked=await request(app).post('/api/bookings').set('Authorization',`Bearer ${userToken}`).send({eventId,quantity:4});expect(booked.status).toBe(201);bookingId=booked.body.data.id;expect((await request(app).post('/api/bookings').set('Authorization',`Bearer ${userToken}`).send({eventId,quantity:2})).status).toBe(409);});test('booking unpublished event fails',async()=>{const e=await prisma.event.create({data:{title:'Draft Event',description:'Long enough draft event description.',category:'Tech',venue:'Hall',city:'Pune',eventDate:new Date(Date.now()+8*86400000),startTime:'10:00',endTime:'11:00',ticketPrice:10,totalSeats:10,availableSeats:10,organizerId:(await prisma.user.findUniqueOrThrow({where:{email:'organizer@test.dev'}})).id}});expect((await request(app).post('/api/bookings').set('Authorization',`Bearer ${userToken}`).send({eventId:e.id,quantity:1})).status).toBe(400);});test('cannot update another organizer event',async()=>{const r=await register('organizer2@test.dev','ORGANIZER');expect((await request(app).patch(`/api/events/${eventId}`).set('Authorization',`Bearer ${r.body.data.accessToken}`).send({title:'Stolen Event'})).status).toBe(403);});test('another user cannot cancel booking',async()=>{const r=await register('other@test.dev');expect((await request(app).patch(`/api/bookings/${bookingId}/cancel`).set('Authorization',`Bearer ${r.body.data.accessToken}`)).status).toBe(403);});test('cancellation restores seats',async()=>{expect((await request(app).patch(`/api/bookings/${bookingId}/cancel`).set('Authorization',`Bearer ${userToken}`)).status).toBe(200);expect((await prisma.event.findUniqueOrThrow({where:{id:eventId}})).availableSeats).toBe(5);});test('concurrent requests never oversell',async()=>{const calls=Array.from({length:8},()=>request(app).post('/api/bookings').set('Authorization',`Bearer ${userToken}`).send({eventId,quantity:1}));const results=await Promise.all(calls);expect(results.filter(r=>r.status===201)).toHaveLength(5);expect((await prisma.event.findUniqueOrThrow({where:{id:eventId}})).availableSeats).toBe(0);});});


describe('analytics and operational safeguards', () => {
  test('analytics is role protected and validates windows', async () => {
    expect((await request(app).get('/api/organizer/analytics')).status).toBe(401);
    expect((await request(app).get('/api/admin/metrics').set('Authorization', `Bearer ${userToken}`)).status).toBe(403);
    expect((await request(app).get('/api/organizer/analytics?days=999').set('Authorization', `Bearer ${organizerToken}`)).status).toBe(400);
  });
  test('analytics reconciles confirmed sales and excludes another organizer', async () => {
    const r = await request(app).get('/api/organizer/analytics?days=7').set('Authorization', `Bearer ${organizerToken}`);
    expect(r.status).toBe(200); expect(r.body.data.trend).toHaveLength(7);
    expect(r.body.data.totals).toEqual({ bookings: 5, tickets: 5, amount: 500, cancelled: 1 });
    expect(r.body.data.topEvents[0].id).toBe(eventId);
    const other = await request(app).post('/api/auth/login').send({email:'organizer2@test.dev',password});
    const empty = await request(app).get('/api/organizer/analytics').set('Authorization', `Bearer ${other.body.data.accessToken}`);
    expect(empty.body.data.totals.amount).toBe(0); expect(empty.body.data.topEvents).toEqual([]);
  });
  test('simultaneous cancellations restore inventory exactly once', async () => {
    const booking = await prisma.booking.findFirstOrThrow({where:{eventId,status:'CONFIRMED'}});
    const results = await Promise.all(Array.from({length:12},()=>request(app).patch(`/api/bookings/${booking.id}/cancel`).set('Authorization', `Bearer ${userToken}`)));
    expect(results.filter(r=>r.status===200)).toHaveLength(1);
    expect(results.every(r=>[200,400,409].includes(r.status))).toBe(true);
    expect((await prisma.event.findUniqueOrThrow({where:{id:eventId}})).availableSeats).toBe(1);
  });
  test('40 simultaneous attempts cannot oversell the final seat', async () => {
    const results=await Promise.all(Array.from({length:40},()=>request(app).post('/api/bookings').set('Authorization',`Bearer ${userToken}`).send({eventId,quantity:1})));
    expect(results.filter(r=>r.status===201)).toHaveLength(1);
    expect(results.filter(r=>r.status===409)).toHaveLength(39);
    expect((await prisma.event.findUniqueOrThrow({where:{id:eventId}})).availableSeats).toBe(0);
  });
  test('ready checks dependencies and requests have trace IDs', async () => {
    const r=await request(app).get('/api/ready'); expect(r.status).toBe(200); expect(r.headers['x-request-id']).toBeTruthy();
    const metrics=await request(app).get('/api/admin/metrics').set('Authorization',`Bearer ${adminToken}`);
    expect(metrics.status).toBe(200); expect(metrics.body.data.requests).toBeGreaterThan(0);
  });
});
