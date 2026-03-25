export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly errors?: Array<{ field: string; message: string }>,
  ) {
    super(message)
    this.name = this.constructor.name
    // Ensure proper prototype chain for instanceof checks in transpiled code
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class AuthError extends AppError {
  constructor(message: string, code = 'AUTH_ERROR') {
    super(message, 401, code)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, code)
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    errors: Array<{ field: string; message: string }>,
    code = 'VALIDATION_ERROR',
  ) {
    super(message, 422, code, errors)
  }
}

export class IdempotencyError extends AppError {
  constructor(message = 'Idempotency key conflict', code = 'IDEMPOTENCY_CONFLICT') {
    super(message, 409, code)
  }
}
