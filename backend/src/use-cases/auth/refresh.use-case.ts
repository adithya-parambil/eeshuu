import { z } from 'zod'
import { AuthError } from '../../utils/app-error'
import { log } from '../../utils/logger'
import { authService } from '../../services/auth.service'
import { verifyRefreshToken } from '../../utils/token-util'
import { userWriteRepo } from '../../repositories/write/user.write-repo'
import { UserModel } from '../../repositories/models/user.model'
import type { TokenPair } from '../../utils/token-util'
import type { UseCaseContext } from '../../types/global.types'

export const RefreshDto = z.object({
  refreshToken: z.string().min(1).max(1000),
})

export type RefreshDtoType = z.infer<typeof RefreshDto>

export class RefreshUseCase {
  async execute(dto: RefreshDtoType, ctx: UseCaseContext): Promise<TokenPair> {
    log.info({ requestId: ctx.requestId }, 'RefreshUseCase: start')
    // Verify JWT signature and expiry
    const payload = verifyRefreshToken(dto.refreshToken)

    // Load user by ID with secrets selected (refreshTokenHash is select:false by default)
    const user = await UserModel.findById(payload.userId).select('+refreshTokenHash')

    if (!user || !user.isActive) {
      throw new AuthError('User not found or inactive', 'AUTH_ERROR')
    }

    if (!user.refreshTokenHash) {
      throw new AuthError('No active session', 'NO_ACTIVE_SESSION')
    }

    // ── Reuse detection ──────────────────────────────────────────────────
    // If the presented token does NOT match the stored hash, it was either
    // forged or already rotated (replay attack).
    // In both cases: revoke ALL sessions for this user immediately.
    const match = await authService.compareRefreshToken(dto.refreshToken, user.refreshTokenHash)

    if (!match) {
      await userWriteRepo.clearRefreshHash(String(user._id))
      log.warn(
        { userId: String(user._id), requestId: ctx.requestId },
        'Token reuse detected — all sessions revoked',
      )
      throw new AuthError('Token reuse detected', 'TOKEN_REUSE_DETECTED')
    }

    // ── Rotate: generate new pair, store new hash, old hash overwritten ──
    const tokens = authService.generateTokenPair(user)
    const refreshHash = await authService.hashRefreshToken(tokens.refreshToken)
    await userWriteRepo.setRefreshHash(String(user._id), refreshHash)

    log.info({ userId: String(user._id), requestId: ctx.requestId }, 'RefreshUseCase: complete')
    return tokens
  }
}

export const refreshUseCase = new RefreshUseCase()
