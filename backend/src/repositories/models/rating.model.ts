import mongoose, { Document, Schema } from 'mongoose'

export interface RatingDocument extends Document {
  orderId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  deliveryPartnerId: mongoose.Types.ObjectId
  rating: number        // 1–5
  comment?: string
  createdAt: Date
}

const ratingSchema = new Schema<RatingDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryPartnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
)

ratingSchema.index({ deliveryPartnerId: 1 })
ratingSchema.index({ customerId: 1 })

export const RatingModel = mongoose.model<RatingDocument>('Rating', ratingSchema)
