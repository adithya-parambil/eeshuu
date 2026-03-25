import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { placeOrderUseCase } from '../../use-cases/order/place-order.use-case'
import { acceptOrderUseCase } from '../../use-cases/order/accept-order.use-case'
import { updateOrderStatusUseCase } from '../../use-cases/order/update-order-status.use-case'
import { cancelOrderUseCase } from '../../use-cases/order/cancel-order.use-case'
import { getOrderUseCase } from '../../use-cases/order/get-order.use-case'
import { listOrdersUseCase } from '../../use-cases/order/list-orders.use-case'
import { orderReadRepo } from '../../repositories/read/order.read-repo'
import { getOrderLocation } from '../../utils/location-cache'

/**
 * OrderController — HTTP entry point for order routes.
 * Calls USE-CASES only. Never calls services or repositories directly.
 */
export const orderController = {
  placeOrder: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user! // guaranteed by authMiddleware
    const order = await placeOrderUseCase.execute(req.body, {
      requestId: req.id,
      userId: user.userId,
      customerId: user.userId,
    })
    res.status(201).json(ApiResponse.success(order))
  }),

  acceptOrder: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const order = await acceptOrderUseCase.execute(
      { orderId: req.params.orderId, deliveryPartnerId: user.userId },
      { requestId: req.id, userId: user.userId },
    )
    if (!order) {
      // Another partner won the atomic race
      res.status(409).json(ApiResponse.error('Order already taken', 'ORDER_ALREADY_TAKEN'))
      return
    }
    res.status(200).json(ApiResponse.success(order))
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const order = await updateOrderStatusUseCase.execute(
      { orderId: req.params.orderId, ...req.body },
      { requestId: req.id, userId: user.userId, actorId: user.userId, actorRole: user.role },
    )
    res.status(200).json(ApiResponse.success(order))
  }),

  cancelOrder: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const order = await cancelOrderUseCase.execute(
      { orderId: req.params.orderId, reason: req.body.reason },
      { requestId: req.id, userId: user.userId, actorId: user.userId, actorRole: user.role },
    )
    res.status(200).json(ApiResponse.success(order))
  }),

  getOrder: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const order = await getOrderUseCase.execute(
      { orderId: req.params.orderId },
      { requestId: req.id, userId: user.userId, requesterId: user.userId, requesterRole: user.role },
    )
    res.status(200).json(ApiResponse.success(order))
  }),

  listOrders: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const result = await listOrdersUseCase.execute(
      {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        status: req.query.status as string | undefined,
      },
      { requestId: req.id, userId: user.userId, customerId: user.userId },
    )
    res.status(200).json(
      ApiResponse.success(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      }),
    )
  }),

  listAvailable: asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderReadRepo.listAvailable()
    res.status(200).json(ApiResponse.success(orders))
  }),

  getMyActive: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const order = await orderReadRepo.findActiveByDeliveryPartner(user.userId)
    res.status(200).json(ApiResponse.success(order ?? null))
  }),

  getMyEarnings: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const stats = await orderReadRepo.getDeliveryEarnings(user.userId)
    res.status(200).json(ApiResponse.success(stats))
  }),

  getMyHistory: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const result = await orderReadRepo.listByDeliveryPartner(user.userId, { page, limit })
    res.status(200).json(
      ApiResponse.success(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      }),
    )
  }),

  /** GET /orders/:orderId/location — returns latest cached partner location from Redis */
  getPartnerLocation: asyncHandler(async (req: Request, res: Response) => {
    const location = await getOrderLocation(req.params.orderId)
    res.status(200).json(ApiResponse.success(location ?? null))
  }),
}
