import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { jwtConfig } from '../config/modules/jwt.config'
import { AuthError } from './app-error'

export interface JwtPayload {
  userId: string
  role: string
  jti: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export function generateTokenPair(
  userId: string,
  role: string,
): TokenPair {
  const accessJti = uuidv4()

  const accessToken = jwt.sign(
    { userId, role, jti: accessJti } satisfies JwtPayload,
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessTtlSeconds },
  )

  // Refresh tokens carry their own jti for blacklisting on logout
  const refreshJti = uuidv4()
  const refreshToken = jwt.sign(
    { userId, role, jti: refreshJti } satisfies JwtPayload,
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshTtlSeconds },
  )

  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret) as JwtPayload
    return payload
  } catch {
    throw new AuthError('Invalid or expired access token', 'ACCESS_TOKEN_INVALID')
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload
    return payload
  } catch {
    throw new AuthError('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID')
  }
}
