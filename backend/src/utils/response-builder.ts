import { requestContext } from './logger'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
  requestId: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  code: string
  errors?: Array<{ field: string; message: string }>
  requestId: string
}

export const ApiResponse = {
  success<T>(data: T, meta?: PaginationMeta): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      ...(meta !== undefined ? { meta } : {}),
      requestId: requestContext.getStore()?.requestId ?? 'unknown',
    }
  },

  error(
    message: string,
    code: string,
    errors?: Array<{ field: string; message: string }>,
  ): ApiErrorResponse {
    return {
      success: false,
      message,
      code,
      ...(errors !== undefined ? { errors } : {}),
      requestId: requestContext.getStore()?.requestId ?? 'unknown',
    }
  },
}
