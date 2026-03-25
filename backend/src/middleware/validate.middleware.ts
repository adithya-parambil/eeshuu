import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../utils/app-error'

/**
 * validateBody — validates req.body against a Zod schema.
 * Returns 422 with field-level errors on failure.
 * Every use-case receives a Zod-parsed DTO — no raw user input ever reaches business logic.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      return next(new ValidationError('Validation failed', errors))
    }
    req.body = result.data
    next()
  }
}

/**
 * validateQuery — validates req.query against a Zod schema.
 * Returns 422 with field-level errors on failure.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      return next(new ValidationError('Query validation failed', errors))
    }
    req.query = result.data as typeof req.query
    next()
  }
}

function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.errors.map((e) => ({
    field: e.path.join('.') || 'root',
    message: e.message,
  }))
}

/** Named aliases used by some route files */
export const validate = validateBody
export const validateRequest = validateBody
