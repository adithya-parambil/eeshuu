import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { getSystemStatsUseCase } from '../../use-cases/admin/get-system-stats.use-case'
import { listAllOrdersUseCase } from '../../use-cases/admin/list-all-orders.use-case'
import { AdminOrderFiltersDto } from '../../use-cases/admin/list-all-orders.use-case'
import { userReadRepo } from '../../repositories/read/user.read-repo'
import { DisputeModel } from '../../repositories/models/dispute.model'

/**
 * AdminController — HTTP entry point for admin routes.
 * Calls USE-CASES only. Never calls services or repositories directly.
 */
export const adminController = {
  getSystemStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await getSystemStatsUseCase.execute({ requestId: req.id })
    res.status(200).json(ApiResponse.success(stats))
  }),

  listAllOrders: asyncHandler(async (req: Request, res: Response) => {
    const dto = AdminOrderFiltersDto.parse(req.query)
    const result = await listAllOrdersUseCase.execute(dto, { requestId: req.id })
    res.status(200).json(
      ApiResponse.success(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      }),
    )
  }),

  listAllUsers: asyncHandler(async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 50
    const role = req.query.role as string | undefined
    const { items, total } = await userReadRepo.listAll(page, limit, role)
    const users = items.map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }))
    res.status(200).json(
      ApiResponse.success(users, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }),
    )
  }),

  listDisputes: asyncHandler(async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const skip = (page - 1) * limit
    const filter: Record<string, unknown> = {}
    if (req.query.status) filter['status'] = req.query.status

    const [items, total] = await Promise.all([
      DisputeModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'totalAmount status createdAt')
        .populate('raisedBy', 'name email role')
        .populate('resolvedBy', 'name'),
      DisputeModel.countDocuments(filter),
    ])

    res.status(200).json(
      ApiResponse.success(items, {
        page, limit, total, totalPages: Math.ceil(total / limit),
      }),
    )
  }),
}
