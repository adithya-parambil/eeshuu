import { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { DisputeModel } from '../../repositories/models/dispute.model'
import { OrderModel } from '../../repositories/models/order.model'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/app-error'

const RaiseDisputeDto = z.object({
  orderId: z.string().min(1),
  subject: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(2000),
})

const RespondDisputeDto = z.object({
  adminResponse: z.string().trim().min(1).max(2000),
  status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'REJECTED']),
})

export const disputeController = {
  raise: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const dto = RaiseDisputeDto.parse(req.body)

    const order = await OrderModel.findById(dto.orderId)
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND')

    // Verify the user is involved in this order
    const customerId =
      order.customerId && typeof order.customerId === 'object' && '_id' in (order.customerId as object)
        ? String((order.customerId as { _id: unknown })._id)
        : String(order.customerId)

    const deliveryId = order.deliveryPartnerId
      ? (order.deliveryPartnerId && typeof order.deliveryPartnerId === 'object' && '_id' in (order.deliveryPartnerId as object)
          ? String((order.deliveryPartnerId as { _id: unknown })._id)
          : String(order.deliveryPartnerId))
      : null

    if (user.role !== 'admin' && customerId !== user.userId && deliveryId !== user.userId) {
      throw new ForbiddenError('Not involved in this order', 'FORBIDDEN')
    }

    // Prevent duplicate open disputes from same user on same order
    const existing = await DisputeModel.findOne({
      orderId: dto.orderId,
      raisedBy: user.userId,
      status: { $in: ['OPEN', 'UNDER_REVIEW'] },
    })
    if (existing) throw new BadRequestError('You already have an open dispute for this order', 'DUPLICATE_DISPUTE')

    const dispute = await DisputeModel.create({
      orderId: dto.orderId,
      raisedBy: user.userId,
      raisedByRole: user.role,
      subject: dto.subject,
      description: dto.description,
    })

    res.status(201).json(ApiResponse.success(dispute))
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (user.role !== 'admin') {
      filter['raisedBy'] = user.userId
    }
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

  respond: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const dto = RespondDisputeDto.parse(req.body)

    const dispute = await DisputeModel.findById(req.params.disputeId)
    if (!dispute) throw new NotFoundError('Dispute not found', 'DISPUTE_NOT_FOUND')
    if (dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') {
      throw new BadRequestError('Dispute already closed', 'DISPUTE_CLOSED')
    }

    dispute.adminResponse = dto.adminResponse
    dispute.status = dto.status
    if (dto.status === 'RESOLVED' || dto.status === 'REJECTED') {
      dispute.resolvedBy = user.userId as unknown as typeof dispute.resolvedBy
      dispute.resolvedAt = new Date()
    }
    await dispute.save()

    res.status(200).json(ApiResponse.success(dispute))
  }),
}
