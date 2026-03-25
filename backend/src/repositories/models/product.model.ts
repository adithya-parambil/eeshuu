import mongoose, { Document, Schema } from 'mongoose'

export interface ProductDocument extends Document {
  name: string
  description?: string
  price: number
  category: string
  stock: number
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
)

// Text index for search
productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ isActive: 1 })

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema)
