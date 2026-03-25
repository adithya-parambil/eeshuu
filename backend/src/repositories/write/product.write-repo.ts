import mongoose from 'mongoose'
import { ProductModel, ProductDocument } from '../models/product.model'

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
    return product
  }

  async updateStock(
    productId: string,
    delta: number,
    session?: mongoose.ClientSession,
  ): Promise<ProductDocument | null> {
    return ProductModel.findByIdAndUpdate(
      productId,
      { $inc: { stock: delta } },
      { new: true, session },
    )
  }

  async update(
    productId: string,
    data: Partial<CreateProductData & { isActive: boolean }>,
  ): Promise<ProductDocument | null> {
    return ProductModel.findByIdAndUpdate(productId, { $set: data }, { new: true })
  }

  async delete(productId: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(productId)
    return result !== null
  }
}

export const productWriteRepo = new ProductWriteRepository()
