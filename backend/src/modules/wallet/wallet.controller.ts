import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { userWriteRepo } from '../../repositories/write/user.write-repo'
import { userReadRepo } from '../../repositories/read/user.read-repo'
import { WalletTransactionModel } from '../../repositories/models/wallet-transaction.model'
import { ConflictError } from '../../utils/app-error'
import { z } from 'zod'

const WithdrawDto = z.object({ amount: z.number().min(1) })

export const walletController = {
  getBalance: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const doc = await userReadRepo.findById(user.userId)
    res.json(ApiResponse.success({ balance: doc?.walletBalance ?? 0 }))
  }),

  withdraw: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const { amount } = WithdrawDto.parse(req.body)
    const updated = await userWriteRepo.deductWallet(user.userId, amount, undefined, {
      type: 'WITHDRAWAL',
      note: 'Manual withdrawal',
    })
    if (!updated) {
      throw new ConflictError('Insufficient wallet balance', 'INSUFFICIENT_WALLET_BALANCE')
    }
    res.json(ApiResponse.success({ balance: updated.walletBalance }))
  }),

  getTransactions: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10))
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      WalletTransactionModel.find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransactionModel.countDocuments({ userId: user.userId }),
    ])

    res.json(ApiResponse.success(transactions, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }))
  }),
}
