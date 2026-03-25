import { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { RatingModel } from '../../repositories/models/rating.model'
import { OrderModel } from '../../repositories/models/order.model'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/app-error'
import mongoose from 'mongoose'

const SubmitRatingDto = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
})

export const ratingController = {
  submit: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const dto = SubmitRatingDto.parse(req.body)

    const order = await OrderModel.findById(dto.orderId)
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND')
    if (order.status !== 'DELIVERED') throw new BadRequestError('Can only rate delivered orders', 'NOT_DELIVERED')

    // Extract customerId safely (may be populated)
    const orderCustomerId =
      order.customerId && typeof order.customerId === 'object' && '_id' in (order.customerId as object)
        ? String((order.customerId as { _id: unknown })._id)
        : String(order.customerId)

    if (orderCustomerId !== user.userId) throw new ForbiddenError('Not your order', 'FORBIDDEN')
    if (!order.deliveryPartnerId) throw new BadRequestError('No delivery partner assigned', 'NO_PARTNER')

    const existing = await RatingModel.findOne({ orderId: dto.orderId })
    if (existing) throw new BadRequestError('Already rated this order', 'ALREADY_RATED')

    const deliveryPartnerId =
      order.deliveryPartnerId && typeof order.deliveryPartnerId === 'object' && '_id' in (order.deliveryPartnerId as object)
        ? (order.deliveryPartnerId as { _id: mongoose.Types.ObjectId })._id
        : order.deliveryPartnerId as mongoose.Types.ObjectId

    const rating = await RatingModel.create({
      orderId: dto.orderId,
      customerId: user.userId,
      deliveryPartnerId,
      rating: dto.rating,
      comment: dto.comment,
    })

    res.status(201).json(ApiResponse.success(rating))
  }),

  getForPartner: asyncHandler(async (req: Request, res: Response) => {
    const { partnerId } = req.params
    const ratings = await RatingModel.find({ deliveryPartnerId: partnerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('customerId', 'name')
      .populate('orderId', 'totalAmount createdAt')

    const avg = ratings.length
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0

    res.status(200).json(ApiResponse.success({ ratings, average: parseFloat(avg.toFixed(2)), count: ratings.length }))
  }),

  getForOrder: asyncHandler(async (req: Request, res: Response) => {
    const rating = await RatingModel.findOne({ orderId: req.params.orderId })
    res.status(200).json(ApiResponse.success(rating ?? null))
  }),
}
