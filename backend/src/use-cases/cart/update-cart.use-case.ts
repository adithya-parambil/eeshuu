import { z } from 'zod'
import { CartModel } from '../../repositories/models/cart.model'
import { log } from '../../utils/logger'
import type { UseCaseContext } from '../../types/global.types'

export const UpdateCartDto = z.object({
  items: z.array(z.object({
    productId: z.string().trim(),
    quantity: z.number().int().min(1),
  })),
})

export type UpdateCartDtoType = z.infer<typeof UpdateCartDto>

export class UpdateCartUseCase {
  async execute(dto: UpdateCartDtoType, _ctx: UseCaseContext) {
    log.info({ requestId: _ctx.requestId, userId: _ctx.userId }, 'UpdateCartUseCase: start')

    if (!_ctx.userId) {
      throw new Error('User not authenticated')
    }

    const updatedCart = await CartModel.findOneAndUpdate(
      { userId: _ctx.userId as any },
      { items: dto.items as any },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('items.productId')

    log.info({ requestId: _ctx.requestId, userId: _ctx.userId }, 'UpdateCartUseCase: complete')
    return updatedCart
  }
}

export const updateCartUseCase = new UpdateCartUseCase()
