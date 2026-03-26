import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { saveDeviceToken, removeDeviceToken } from '../../repositories/device-token.repository'

/**
 * Save device token for push notifications
 */
export const saveToken = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const { token, platform = 'web' } = req.body

  if (!token) {
    res.status(400).json(ApiResponse.error('Device token is required', 'INVALID_TOKEN'))
    return
  }

  await saveDeviceToken(user.userId, token, platform)

  res.status(200).json(
    ApiResponse.success({ 
      message: 'Device token saved successfully',
      tokenCount: 1,
    }),
  )
})

/**
 * Remove device token
 */
export const removeToken = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!
  const { token } = req.body

  if (!token) {
    res.status(400).json(ApiResponse.error('Device token is required', 'INVALID_TOKEN'))
    return
  }

  await removeDeviceToken(token)

  res.status(200).json(
    ApiResponse.success({ 
      message: 'Device token removed successfully',
    }),
  )
})
