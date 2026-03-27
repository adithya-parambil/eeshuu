import mongoose, { Document, Schema } from 'mongoose'

export interface CartItem {
  productId: mongoose.Types.ObjectId
  quantity: number
}

export interface CartDocument extends Document {
  userId: mongoose.Types.ObjectId
  items: CartItem[]
  createdAt: Date
  updatedAt: Date
}

const cartSchema = new Schema<CartDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  },
)

cartSchema.index({ userId: 1 })

export const CartModel = mongoose.model<CartDocument>('Cart', cartSchema)
