import { z } from 'zod'
import { AuthError } from '../../utils/app-error'
import { log } from '../../utils/logger'
import { authService } from '../../services/auth.service'
import { userReadRepo } from '../../repositories/read/user.read-repo'
import { userWriteRepo } from '../../repositories/write/user.write-repo'
import type { TokenPair } from '../../utils/token-util'
import type { UseCaseContext } from '../../types/global.types'

export const LoginDto = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(500),
})

export type LoginDtoType = z.infer<typeof LoginDto>

export class LoginUseCase {
  async execute(dto: LoginDtoType, ctx: UseCaseContext): Promise<TokenPair> {
    log.info({ requestId: ctx.requestId }, 'LoginUseCase: start')
    // Always fetch with secrets for auth operations
    const user = await userReadRepo.findByEmailWithSecrets(dto.email)
    if (!user || !user.isActive) {
      // Use the same error for both "not found" and "wrong password" — prevents user enumeration
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    const passwordMatch = await authService.comparePassword(dto.password, user.passwordHash)
    if (!passwordMatch) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Rotate refresh token on every login
    const tokens = authService.generateTokenPair(user)
    const refreshHash = await authService.hashRefreshToken(tokens.refreshToken)
    await userWriteRepo.setRefreshHash(String(user._id), refreshHash)

    log.info({ userId: String(user._id), requestId: ctx.requestId }, 'LoginUseCase: complete')
    return tokens
  }
}

export const loginUseCase = new LoginUseCase()
