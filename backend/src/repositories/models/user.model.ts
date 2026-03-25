import mongoose, { Document, Schema } from 'mongoose'
import type { UserRole } from '../../types/global.types'

export interface UserDocument extends Document {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  phone?: string
  isActive: boolean
  walletBalance: number
  refreshTokenHash?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['customer', 'delivery', 'admin'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    refreshTokenHash: {
      type: String,
      select: false, // never returned in queries by default
    },
  },
  {
    timestamps: true,
    strict: true,
  },
)

userSchema.index({ role: 1 })

export const UserModel = mongoose.model<UserDocument>('User', userSchema)
