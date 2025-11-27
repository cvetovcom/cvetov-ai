/**
 * Common API Types
 * TypeScript definitions for common API structures
 */

// Базовый ответ API с ошибкой
export interface APIErrorResponse {
  error: string
  message: string
  details?: Record<string, unknown>
}

// Ошибка валидации
export interface ValidationErrorResponse extends APIErrorResponse {
  error: 'ValidationError'
  details: {
    field: string
    constraint: string
  }
}

// Ошибка конфликта (например, товар стал недоступен)
export interface ConflictErrorResponse extends APIErrorResponse {
  error: 'Conflict'
  details?: {
    unavailable_items?: Array<{
      uuid: string
      name: string
    }>
  }
}

// Ошибка превышения лимита запросов
export interface RateLimitErrorResponse extends APIErrorResponse {
  error: 'RateLimitExceeded'
  retry_after: number // секунды
}

// HTTP status codes
export enum HTTPStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

// Pagination parameters
export interface PaginationParams {
  page?: number
  page_size?: number
}

// Paginated response
export interface PaginatedResponse<T> {
  page: number
  page_size: number
  total_count: number
  items: T[]
}
