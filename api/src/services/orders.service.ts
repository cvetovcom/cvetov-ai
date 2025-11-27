/**
 * Orders Service
 * Service for creating and managing orders
 */

import { backendAPI } from './backend-api.service.js'
import type { OrderEntity } from '../types/index.js'

export class OrdersService {
  /**
   * Create order from user's cart
   *
   * IMPORTANT: Cart must be filled before calling this!
   * Request body should be empty - order is created from current cart
   */
  async createOrder(
    jwt: string,
    platform: string = 'ai_assistant'
  ): Promise<OrderEntity> {
    const params = { platform }

    // Empty body - order created from cart
    return backendAPI.post<OrderEntity, Record<string, never>>(
      '/api/v1/orders',
      jwt,
      {},
      params
    )
  }

  /**
   * Get order by UUID
   */
  async getOrder(uuid: string, jwt: string): Promise<OrderEntity> {
    return backendAPI.get<OrderEntity>(`/api/v1/orders/${uuid}`, jwt)
  }

  /**
   * Get user's orders list
   */
  async getUserOrders(
    jwt: string,
    page: number = 1,
    page_size: number = 20
  ): Promise<{ orders: OrderEntity[]; total_count: number }> {
    const params = { page, page_size }
    return backendAPI.get(`/api/v1/orders`, jwt, params)
  }
}

// Singleton instance
export const ordersService = new OrdersService()
