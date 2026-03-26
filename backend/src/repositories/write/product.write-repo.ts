import mongoose from 'mongoose'
import { ProductModel, ProductDocument } from '../models/product.model'
import { productEventEmitter } from '../../utils/event-emitters'

export interface CreateProductData {
  name: string
  description?: string
  price: number
  category: string
  stock: number
  imageUrl?: string
}

export class ProductWriteRepository {
  async create(
    data: CreateProductData,
    session?: mongoose.ClientSession,
  ): Promise<ProductDocument> {
    const [product] = await ProductModel.create([data], session ? { session } : {})
    if (!product) throw new Error('Product creation failed unexpectedly')
    
    productEventEmitter.emit('product.created', {
      productId: String(product._id),
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
    })

    return product
  }

  async updateStock(
    productId: string,
    delta: number,
    session?: mongoose.ClientSession,
  ): Promise<ProductDocument | null> {
    const updated = await ProductModel.findByIdAndUpdate(
      productId,
      { $inc: { stock: delta } },
      { new: true, session },
    )
    if (updated) {
      productEventEmitter.emit('product.updated', {
        productId: String(updated._id),
        name: updated.name,
        category: updated.category,
        price: updated.price,
        stock: updated.stock,
        isActive: updated.isActive,
      })
    }
    return updated
  }

  async update(
    productId: string,
    data: Partial<CreateProductData & { isActive: boolean }>,
  ): Promise<ProductDocument | null> {
    const updated = await ProductModel.findByIdAndUpdate(productId, { $set: data }, { new: true })
    if (updated) {
      productEventEmitter.emit('product.updated', {
        productId: String(updated._id),
        name: updated.name,
        category: updated.category,
        price: updated.price,
        stock: updated.stock,
        isActive: updated.isActive,
      })
    }
    return updated
  }

  async delete(productId: string): Promise<boolean> {
    const product = await ProductModel.findById(productId)
    const result = await ProductModel.findByIdAndDelete(productId)
    if (result && product) {
      productEventEmitter.emit('product.deleted', {
        productId: String(product._id)
      })
    }
    return result !== null
  }
}

export const productWriteRepo = new ProductWriteRepository()
