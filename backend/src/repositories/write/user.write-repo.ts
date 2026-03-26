import mongoose from 'mongoose'
import { UserModel, UserDocument } from '../models/user.model'
import { WalletTransactionModel, type TxType } from '../models/wallet-transaction.model'
import type { UserRole } from '../../types/global.types'
import { walletEventEmitter } from '../../utils/event-emitters'

export interface CreateUserData {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  phone?: string
}

/**
 * UserWriteRepository — CQRS write side.
 * Only mutation operations. Never called by controllers — only by use-cases.
 */
export class UserWriteRepository {
  async create(
    data: CreateUserData,
    session?: mongoose.ClientSession,
  ): Promise<UserDocument> {
    const [user] = await UserModel.create([data], session ? { session } : {})
    // create() with array returns array
    if (!user) throw new Error('User creation failed unexpectedly')
    return user
  }

  async updateById(
    userId: string,
    update: Partial<Pick<UserDocument, 'name' | 'phone' | 'isActive'>>,
    session?: mongoose.ClientSession,
  ): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, session },
    )
  }

  async setRefreshHash(
    userId: string,
    hash: string,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      { $set: { refreshTokenHash: hash } },
      { session },
    )
  }

  async clearRefreshHash(
    userId: string,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      { $unset: { refreshTokenHash: '' } },
      { session },
    )
  }

  /** Atomically increment wallet balance and record transaction */
  async adjustWallet(
    userId: string,
    delta: number,
    session?: mongoose.ClientSession,
    opts?: { type?: TxType; orderId?: string; note?: string },
  ): Promise<UserDocument | null> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: delta } },
      { new: true, session },
    )
    if (updated) {
      await WalletTransactionModel.create(
        [{
          userId: new mongoose.Types.ObjectId(userId),
          type: opts?.type ?? (delta >= 0 ? 'COMMISSION' : 'WITHDRAWAL'),
          amount: Math.abs(delta),
          balanceAfter: updated.walletBalance,
          orderId: opts?.orderId ? new mongoose.Types.ObjectId(opts.orderId) : undefined,
          note: opts?.note,
        }],
        session ? { session } : {},
      )
      // Emit wallet.updated event for real-time updates
      walletEventEmitter.emit('wallet.updated', {
        userId,
        balance: updated.walletBalance,
        delta,
        type: opts?.type ?? (delta >= 0 ? 'COMMISSION' : 'WITHDRAWAL'),
      })
    }
    return updated
  }

  /** Deduct from wallet only if sufficient balance — returns null if insufficient */
  async deductWallet(
    userId: string,
    amount: number,
    session?: mongoose.ClientSession,
    opts?: { type?: TxType; orderId?: string; note?: string },
  ): Promise<UserDocument | null> {
    const updated = await UserModel.findOneAndUpdate(
      {
        _id: { $eq: new mongoose.Types.ObjectId(userId) },
        walletBalance: { $gte: amount },
      },
      { $inc: { walletBalance: -amount } },
      { new: true, session },
    )
    if (updated) {
      await WalletTransactionModel.create(
        [{
          userId: new mongoose.Types.ObjectId(userId),
          type: opts?.type ?? 'WITHDRAWAL',
          amount,
          balanceAfter: updated.walletBalance,
          orderId: opts?.orderId ? new mongoose.Types.ObjectId(opts.orderId) : undefined,
          note: opts?.note,
        }],
        session ? { session } : {},
      )
      // Emit wallet.updated event for real-time updates
      walletEventEmitter.emit('wallet.updated', {
        userId,
        balance: updated.walletBalance,
        delta: -amount,
        type: opts?.type ?? 'WITHDRAWAL',
      })
    }
    return updated
  }
}

export const userWriteRepo = new UserWriteRepository()
