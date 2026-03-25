import bcrypt from 'bcrypt'
import { env } from '../config/env'
import { generateTokenPair } from '../utils/token-util'
import type { TokenPair } from '../utils/token-util'
import type { UserDocument } from '../repositories/models/user.model'

/**
 * AuthService — token generation, password hashing, and refresh rotation logic.
 * Called only by use-cases — never by controllers or socket handlers.
 */
export class AuthService {
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS)
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }

  /** bcrypt-hashes the refresh token before storing in the DB */
  async hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(refreshToken, env.BCRYPT_ROUNDS)
  }

  async compareRefreshToken(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }

  generateTokenPair(user: UserDocument): TokenPair {
    return generateTokenPair(String(user._id), user.role)
  }
}

// Singleton — services are stateless
export const authService = new AuthService()
