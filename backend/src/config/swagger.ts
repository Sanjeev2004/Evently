import swaggerJsdoc from "swagger-jsdoc";
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Event Booking System API",
      version: "1.0.0",
      description:
        "Production-style REST API with RBAC and concurrency-safe booking.",
    },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        Event: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            status: {
              type: "string",
              enum: [
                "DRAFT",
                "PENDING_APPROVAL",
                "PUBLISHED",
                "REJECTED",
                "CANCELLED",
                "COMPLETED",
              ],
            },
            availableSeats: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/docs.ts"],
});
