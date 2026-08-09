export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors: unknown[] = [],
  ) {
    super(message);
  }
}
export class BadRequestError extends AppError {
  constructor(m: string) {
    super(m, 400);
  }
}
export class AuthenticationError extends AppError {
  constructor(m = "Authentication required") {
    super(m, 401);
  }
}
export class AuthorizationError extends AppError {
  constructor(m = "You are not authorized to perform this action") {
    super(m, 403);
  }
}
export class NotFoundError extends AppError {
  constructor(m = "Resource not found") {
    super(m, 404);
  }
}
export class ConflictError extends AppError {
  constructor(m: string) {
    super(m, 409);
  }
}
export class ValidationError extends AppError {
  constructor(m: string, e: unknown[] = []) {
    super(m, 422, e);
  }
}
