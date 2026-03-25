import mongoose, { Document, Schema } from 'mongoose'

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'
export type DisputeRaisedBy = 'customer' | 'delivery' | 'admin'

export interface DisputeDocument extends Document {
  orderId: mongoose.Types.ObjectId
  raisedBy: mongoose.Types.ObjectId
  raisedByRole: DisputeRaisedBy
  subject: string
  description: string
  status: DisputeStatus
  adminResponse?: string
  resolvedBy?: mongoose.Types.ObjectId
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const disputeSchema = new Schema<DisputeDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    raisedByRole: { type: String, enum: ['customer', 'delivery', 'admin'], required: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'], default: 'OPEN' },
    adminResponse: { type: String, trim: true, maxlength: 2000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
)

disputeSchema.index({ orderId: 1 })
disputeSchema.index({ raisedBy: 1 })
disputeSchema.index({ status: 1 })

export const DisputeModel = mongoose.model<DisputeDocument>('Dispute', disputeSchema)
