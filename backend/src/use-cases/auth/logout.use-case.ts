import { blacklistService } from '../../utils/blacklist'
import { userWriteRepo } from '../../repositories/write/user.write-repo'
import { log } from '../../utils/logger'
import { jwtConfig } from '../../config/modules/jwt.config'
import type { UseCaseContext } from '../../types/global.types'

export interface LogoutDto {
  jti: string
  userId: string
}

export class LogoutUseCase {
  async execute(dto: LogoutDto, ctx: UseCaseContext): Promise<void> {
    log.info({ requestId: ctx.requestId, userId: dto.userId }, 'LogoutUseCase: start')
    // 1. Blacklist the current access token's jti so it cannot be reused
    //    TTL = remaining access token lifetime + a small buffer
    const ttlMs = (jwtConfig.accessTtlSeconds + 60) * 1000
    blacklistService.add(dto.jti, ttlMs)

    // 2. Clear the stored refresh token hash — invalidates all refresh attempts
    await userWriteRepo.clearRefreshHash(dto.userId)

    log.info({ userId: dto.userId, requestId: ctx.requestId }, 'LogoutUseCase: complete')
  }
}

export const logoutUseCase = new LogoutUseCase()
