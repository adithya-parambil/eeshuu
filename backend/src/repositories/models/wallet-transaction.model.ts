import mongoose, { Document, Schema } from 'mongoose'

export type TxType = 'COMMISSION' | 'WITHDRAWAL' | 'REFUND'

export interface WalletTransactionDocument extends Document {
  userId: mongoose.Types.ObjectId
  type: TxType
  amount: number
  balanceAfter: number
  orderId?: mongoose.Types.ObjectId
  note?: string
  createdAt: Date
}

const walletTransactionSchema = new Schema<WalletTransactionDocument>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:         { type: String, enum: ['COMMISSION', 'WITHDRAWAL', 'REFUND'], required: true },
    amount:       { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    orderId:      { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    note:         { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

walletTransactionSchema.index({ userId: 1, createdAt: -1 })

export const WalletTransactionModel = mongoose.model<WalletTransactionDocument>(
  'WalletTransaction',
  walletTransactionSchema,
)
