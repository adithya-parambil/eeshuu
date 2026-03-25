import mongoose from 'mongoose'
import { OrderModel } from '../../repositories/models/order.model'
import { UserModel } from '../../repositories/models/user.model'
import { ProductModel } from '../../repositories/models/product.model'
import { cacheService } from '../../utils/cache-service'
import { log } from '../../utils/logger'
import type { UseCaseContext } from '../../types/global.types'

export interface SystemStats {
  totalOrders: number
  ordersByStatus: Record<string, number>
  totalUsers: number
  usersByRole: Record<string, number>
  totalProducts: number
  activeProducts: number
  timestamp: string
}

export class GetSystemStatsUseCase {
  async execute(_ctx: UseCaseContext): Promise<SystemStats> {
    log.info({ requestId: _ctx.requestId }, 'GetSystemStatsUseCase: start')
    const cacheKey = 'admin:stats'
    const cached = await cacheService.get<SystemStats>(cacheKey)
    if (cached) return cached

    const [orderStats, userStats, productCounts] = await Promise.all([
      OrderModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      UserModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Promise.all([
        ProductModel.countDocuments(),
        ProductModel.countDocuments({ isActive: { $eq: true } }),
      ]),
    ])

    const ordersByStatus = Object.fromEntries(
      (orderStats as Array<{ _id: string; count: number }>).map((s) => [s._id, s.count]),
    )
    const totalOrders = Object.values(ordersByStatus).reduce((s, v) => s + v, 0)

    const usersByRole = Object.fromEntries(
      (userStats as Array<{ _id: string; count: number }>).map((s) => [s._id, s.count]),
    )
    const totalUsers = Object.values(usersByRole).reduce((s, v) => s + v, 0)

    const [totalProducts, activeProducts] = productCounts

    const stats: SystemStats = {
      totalOrders,
      ordersByStatus,
      totalUsers,
      usersByRole,
      totalProducts,
      activeProducts,
      timestamp: new Date().toISOString(),
    }

    await cacheService.set(cacheKey, stats, 30) // 30s cache
    log.info({ requestId: _ctx.requestId }, 'GetSystemStatsUseCase: complete')
    return stats
  }
}

export const getSystemStatsUseCase = new GetSystemStatsUseCase()
