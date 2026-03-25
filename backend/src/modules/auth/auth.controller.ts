import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { registerUseCase } from '../../use-cases/auth/register.use-case'
import { loginUseCase } from '../../use-cases/auth/login.use-case'
import { refreshUseCase } from '../../use-cases/auth/refresh.use-case'
import { logoutUseCase } from '../../use-cases/auth/logout.use-case'

/**
 * AuthController — HTTP entry point for auth routes.
 * Calls USE-CASES only. Never calls services or repositories directly.
 */
export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const tokens = await registerUseCase.execute(req.body, { requestId: req.id })
    res.status(201).json(ApiResponse.success(tokens))
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const tokens = await loginUseCase.execute(req.body, { requestId: req.id })
    res.status(200).json(ApiResponse.success(tokens))
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const tokens = await refreshUseCase.execute(req.body, { requestId: req.id })
    res.status(200).json(ApiResponse.success(tokens))
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!  // guaranteed by authMiddleware
    await logoutUseCase.execute(
      { jti: user.jti, userId: user.userId },
      { requestId: req.id, userId: user.userId },
    )
    res.status(200).json(ApiResponse.success({ message: 'Logged out successfully' }))
  }),
}
