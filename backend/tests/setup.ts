process.env.NODE_ENV='test';process.env.DATABASE_URL=process.env.TEST_DATABASE_URL??'postgresql://postgres:postgres@localhost:5432/event_booking_test?schema=public';process.env.JWT_ACCESS_SECRET='test-access-secret-that-is-at-least-32-characters';process.env.JWT_REFRESH_SECRET='test-refresh-secret-that-is-at-least-32-characters';process.env.FRONTEND_URL='http://localhost:5173';process.env.COOKIE_SECRET='test-cookie-secret-that-is-at-least-32-characters';


const testUrl = new URL(process.env.DATABASE_URL!);
if (!/test/i.test(testUrl.pathname)) throw new Error('Integration tests require a database with test in its name');
delete process.env.REDIS_URL;
