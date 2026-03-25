import { Request, Response, NextFunction } from 'express'

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>

/**
 * asyncHandler — wraps an async route handler and forwards any thrown errors
 * to the Express error handler via next(err). Eliminates try/catch boilerplate
 * in every controller.
 */
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
}
