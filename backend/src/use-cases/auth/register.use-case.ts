import { z } from 'zod'
import { ConflictError } from '../../utils/app-error'
import { log } from '../../utils/logger'
import { authService } from '../../services/auth.service'
import { userReadRepo } from '../../repositories/read/user.read-repo'
import { userWriteRepo } from '../../repositories/write/user.write-repo'
import type { TokenPair } from '../../utils/token-util'
import type { UseCaseContext } from '../../types/global.types'

export const RegisterDto = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z
    .string()
    .min(8)
    .max(72) // bcrypt max
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['customer', 'delivery']).default('customer'),
  phone: z.string().trim().max(20).optional(),
})

export type RegisterDtoType = z.infer<typeof RegisterDto>

export class RegisterUseCase {
  async execute(dto: RegisterDtoType, ctx: UseCaseContext): Promise<TokenPair> {
    log.info({ requestId: ctx.requestId }, 'RegisterUseCase: start')
    // Check email uniqueness
    const existing = await userReadRepo.findByEmail(dto.email)
    if (existing) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS')
    }

    // Hash password (bcrypt, rounds from env)
    const passwordHash = await authService.hashPassword(dto.password)

    // Persist user
    const user = await userWriteRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
      phone: dto.phone,
    })

    // Generate token pair and store hashed refresh token
    const tokens = authService.generateTokenPair(user)
    const refreshHash = await authService.hashRefreshToken(tokens.refreshToken)
    await userWriteRepo.setRefreshHash(String(user._id), refreshHash)

    log.info({ userId: String(user._id), requestId: ctx.requestId }, 'RegisterUseCase: complete')
    return tokens
  }
}

export const registerUseCase = new RegisterUseCase()
