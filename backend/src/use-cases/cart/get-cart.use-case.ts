import { CartModel } from '../../repositories/models/cart.model'
import { log } from '../../utils/logger'
import type { UseCaseContext } from '../../types/global.types'

export class GetCartUseCase {
  async execute(_ctx: UseCaseContext) {
    log.info({ requestId: _ctx.requestId, userId: _ctx.userId }, 'GetCartUseCase: start')
    
    if (!_ctx.userId) {
      throw new Error('User not authenticated')
    }

    const cart = await CartModel.findOne({ userId: _ctx.userId as any }).populate('items.productId')
    
    if (!cart) {
      return { items: [] }
    }

    return cart
  }
}

export const getCartUseCase = new GetCartUseCase()
