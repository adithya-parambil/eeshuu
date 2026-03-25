import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { NotFoundError } from '../../utils/app-error'
import { userReadRepo } from '../../repositories/read/user.read-repo'
import { userWriteRepo } from '../../repositories/write/user.write-repo'

/**
 * UserController — HTTP entry point for user profile routes.
 * Calls repositories directly (no dedicated use-case needed for simple CRUD).
 */
export const userController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const profile = await userReadRepo.findById(user.userId)
    if (!profile) throw new NotFoundError('User not found', 'USER_NOT_FOUND')
    // Return only public fields — never passwordHash or refreshTokenHash
    res.status(200).json(
      ApiResponse.success({
        id: String(profile._id),
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
      }),
    )
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const updated = await userWriteRepo.updateById(user.userId, req.body)
    if (!updated) throw new NotFoundError('User not found', 'USER_NOT_FOUND')
    res.status(200).json(
      ApiResponse.success({
        id: String(updated._id),
        name: updated.name,
        phone: updated.phone,
      }),
    )
  }),
}
