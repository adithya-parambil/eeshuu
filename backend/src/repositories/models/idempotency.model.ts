import mongoose, { Document, Schema } from 'mongoose'

export interface IdempotencyKeyDocument extends Document {
  key: string
  response: unknown
  statusCode: number
  expiresAt: Date
}

const idempotencyKeySchema = new Schema<IdempotencyKeyDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    response: {
      type: Schema.Types.Mixed,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    strict: true,
    // No timestamps needed — expiresAt serves as the lifecycle timestamp
  },
)

// TTL index — MongoDB auto-removes documents after expiresAt
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const IdempotencyKeyModel = mongoose.model<IdempotencyKeyDocument>(
  'IdempotencyKey',
  idempotencyKeySchema,
)
