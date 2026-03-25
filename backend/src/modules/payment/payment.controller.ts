import { Request, Response } from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { AppError } from '../../utils/app-error'
import { env } from '../../config/env'
import { z } from 'zod'

// When real Razorpay keys are set, this is false and the real SDK + HMAC verification is used.
// When using placeholder keys, we hit the Beeceptor mock for order creation and skip HMAC.
// A real key looks like rzp_test_XXXXXXXXXXXXXXXXXXXXXXXX (24 alphanum chars after the prefix)
const IS_MOCK =
  !env.RAZORPAY_KEY_ID.startsWith('rzp_') ||
  env.RAZORPAY_KEY_SECRET === 'placeholder_secret' ||
  env.RAZORPAY_KEY_SECRET.startsWith('your_') ||
  /x{6,}/i.test(env.RAZORPAY_KEY_ID)

const MOCK_BASE = 'https://razorpay-mock-api.mock.beeceptor.com'

// Real Razorpay SDK instance — only used when IS_MOCK is false
const razorpay = IS_MOCK
  ? null
  : new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })

const CreateOrderDto = z.object({
  amount: z.number().int().min(1), // in paise
  currency: z.string().default('INR'),
})

const VerifyDto = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

export const paymentController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const { amount, currency } = CreateOrderDto.parse(req.body)

    if (IS_MOCK) {
      // Try Beeceptor mock first; fall back to local stub if it's unreachable
      try {
        const res2 = await fetch(`${MOCK_BASE}/v1/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency, receipt: `rcpt_${Date.now()}` }),
          signal: AbortSignal.timeout(4000),
        })
        const data: any = await res2.json()
        res.json(ApiResponse.success({
          orderId: data.id ?? `order_mock_${Date.now()}`,
          amount: data.amount ?? amount,
          currency: data.currency ?? currency,
        }))
      } catch {
        // Beeceptor unreachable — return a local stub so checkout still works in dev
        res.json(ApiResponse.success({
          orderId: `order_mock_${Date.now()}`,
          amount,
          currency,
        }))
      }
      return
    }

    const order = await razorpay!.orders.create({ amount, currency, receipt: `rcpt_${Date.now()}` })
    res.json(ApiResponse.success({ orderId: order.id, amount: order.amount, currency: order.currency }))
  }),

  verify: asyncHandler(async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = VerifyDto.parse(req.body)

    if (IS_MOCK) {
      // In mock mode the frontend sends a synthetic signature — just accept it
      res.json(ApiResponse.success({ verified: true, paymentId: razorpay_payment_id }))
      return
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      throw new AppError('Payment verification failed', 400, 'PAYMENT_VERIFICATION_FAILED')
    }

    res.json(ApiResponse.success({ verified: true, paymentId: razorpay_payment_id }))
  }),
}
