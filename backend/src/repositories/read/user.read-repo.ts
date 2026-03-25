import { UserModel, UserDocument } from '../models/user.model'

/**
 * UserReadRepository — CQRS read side.
 * Only query operations. Designed to be pointed at a read replica by
 * switching the Mongoose connection in db.config.ts — zero code changes here.
 */
export class UserReadRepository {
  async findById(userId: string): Promise<UserDocument | null> {
    return UserModel.findById(userId)
  }

  /** Returns user WITH passwordHash and refreshTokenHash selected (auth operations only) */
  async findByEmailWithSecrets(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: { $eq: email.toLowerCase() } })
      .select('+passwordHash +refreshTokenHash')
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: { $eq: email.toLowerCase() } })
  }

  async listAll(page: number, limit: number, role?: string): Promise<{ items: UserDocument[]; total: number }> {
    const skip = (page - 1) * limit
    const query = role ? { role: { $eq: role } } : {}
    const [items, total] = await Promise.all([
      UserModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      UserModel.countDocuments(query),
    ])
    return { items, total }
  }
}

export const userReadRepo = new UserReadRepository()
