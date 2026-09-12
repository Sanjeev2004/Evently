# Evently upgrade verification

Measured on local Windows / Node v24.13.1 / PostgreSQL, September 13, 2026 IST.

- Backend integration tests: 18/18 passed on isolated `event_booking_test`.
- Includes 40 concurrent requests for one remaining seat: one success, 39 conflicts, zero remaining seats.
- Includes 12 concurrent cancellation requests: exactly one success and exactly one inventory restoration.
- Analytics totals reconcile with test bookings; organizer scope isolation and permission checks pass.
- TypeScript checks and ESLint pass; backend/frontend production build passes.
- Local GET /api/events benchmark: 120/120 HTTP 200, concurrency 8, 134.89 requests/sec, p50 37.65 ms, p95 156.56 ms. See benchmark.json for hardware, timestamp and workload. Short synthetic local measurement, not a production SLA or maximum capacity claim.
- Preview data: four explicitly labeled demonstration events and 48 synthetic bookings, isolated under demo accounts; no existing data cleared.
- Browser visual and interactive QA NOT verified: Kimi extension was disconnected and CUA reported no browser available. Responsive styles compile, but have not been visually inspected. CSV download and navigation have not been exercised in a browser.
- Redis is optional locally. Shared Redis outage/failover, reverse-proxy deployment, sustained large-dataset load, real payments/refunds and full end-to-end browser flows remain unverified.

Final live API smoke passed: demo-organizer login, 7/30/90-day analytics, distinct pagination pages, frontend HTTP response and database readiness. The 30-day synthetic fixture reports 36 confirmed bookings, 72 tickets, INR 33,228 booking value and 12 cancelled bookings.
