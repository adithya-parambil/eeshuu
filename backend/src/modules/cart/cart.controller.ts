import { Request, Response, NextFunction } from 'express'
import { getCartUseCase } from '../../use-cases/cart/get-cart.use-case'
import { updateCartUseCase } from '../../use-cases/cart/update-cart.use-case'
import { log } from '../../utils/logger'

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await getCartUseCase.execute({
        requestId: req.id!,
        userId: req.user?.userId,
        role: req.user?.role,
      })
      return res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  async updateCart(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await updateCartUseCase.execute(req.body, {
        requestId: req.id!,
        userId: req.user?.userId,
        role: req.user?.role,
      })
      return res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }
}

export const cartController = new CartController()
