import mongoose, { Document, Schema } from 'mongoose'

export interface IDeviceToken extends Document {
  userId: string
  token: string
  platform: 'web' | 'android' | 'ios'
  createdAt: Date
  lastUsedAt: Date
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['web', 'android', 'ios'],
      default: 'web',
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for unique user-device combinations
deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true })

// TTL index - auto-delete tokens older than 90 days
deviceTokenSchema.index({ lastUsedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

export const DeviceTokenModel = mongoose.model<IDeviceToken>('DeviceToken', deviceTokenSchema)

/**
 * Save or update device token
 */
export async function saveDeviceToken(
  userId: string,
  token: string,
  platform: 'web' | 'android' | 'ios' = 'web',
): Promise<void> {
  try {
    await DeviceTokenModel.findOneAndUpdate(
      { userId, token },
      { 
        userId, 
        token, 
        platform,
        lastUsedAt: new Date() 
      },
      { upsert: true, new: true },
    )
  } catch (error) {
    console.error('Error saving device token:', error)
  }
}

/**
 * Get all device tokens for a user
 */
export async function getUserDeviceTokens(userId: string): Promise<string[]> {
  const tokens = await DeviceTokenModel.find({ userId }).select('token').lean()
  return tokens.map((t) => t.token)
}

/**
 * Get all device tokens for delivery partners (for broadcasting)
 */
export async function getAllDeliveryPartnerTokens(): Promise<string[]> {
  // This would need a way to identify delivery partners
  // For now, returns all tokens - you can filter by role if needed
  const tokens = await DeviceTokenModel.find().select('token').lean()
  return tokens.map((t) => t.token)
}

/**
 * Remove invalid token
 */
export async function removeDeviceToken(token: string): Promise<void> {
  await DeviceTokenModel.deleteOne({ token })
}

/**
 * Clean up old tokens (not used in 90 days)
 */
export async function cleanupOldTokens(): Promise<number> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const result = await DeviceTokenModel.deleteMany({ lastUsedAt: { $lt: ninetyDaysAgo } })
  return result.deletedCount || 0
}
