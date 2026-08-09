/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a user or organizer
 *     requestBody: {required: true, content: {application/json: {schema: {type: object, required: [name,email,password], properties: {name: {type: string}, email: {type: string, format: email}, password: {type: string, minLength: 8}, role: {type: string, enum: [USER,ORGANIZER]}}}}}}
 *     responses: {'201': {description: Registered}, '409': {description: Duplicate email}}
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in and set an HTTP-only refresh cookie
 *     responses: {'200': {description: Logged in}, '401': {description: Invalid credentials}}
 * /api/events:
 *   get:
 *     tags: [Events]
 *     summary: Search, filter, sort and paginate published events
 *     parameters: [{in: query, name: search, schema: {type: string}}, {in: query, name: city, schema: {type: string}}, {in: query, name: category, schema: {type: string}}, {in: query, name: page, schema: {type: integer}}, {in: query, name: limit, schema: {type: integer}}]
 *     responses: {'200': {description: Event page}}
 *   post:
 *     tags: [Events]
 *     security: [{bearerAuth: []}]
 *     summary: Create an event (ORGANIZER)
 *     responses: {'201': {description: Created}, '403': {description: Organizer required}}
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     security: [{bearerAuth: []}]
 *     summary: Atomically reserve tickets
 *     requestBody: {required: true, content: {application/json: {schema: {type: object, required: [eventId,quantity], properties: {eventId: {type: string, format: uuid}, quantity: {type: integer, minimum: 1, maximum: 10}}}}}}
 *     responses: {'201': {description: Booking created}, '409': {description: Insufficient seats}}
 * /api/bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     security: [{bearerAuth: []}]
 *     summary: Cancel an eligible booking and restore seats
 *     parameters: [{in: path, name: id, required: true, schema: {type: string}}]
 *     responses: {'200': {description: Cancelled}, '400': {description: Deadline passed}}
 * /api/admin/events/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     security: [{bearerAuth: []}]
 *     summary: Approve a pending event (ADMIN)
 *     responses: {'200': {description: Approved}, '403': {description: Admin required}}
 */
export {};
