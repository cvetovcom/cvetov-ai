/**
 * Cart Service
 * Service for managing shopping cart
 */

import { backendAPI } from './backend-api.service.js'
import type {
  CartEntity,
  UpdateCartRequest,
  TempCart,
  TempCartItem,
} from '../types/index.js'

export class CartService {
  /**
   * Get current user's cart from backend
   */
  async getCart(jwt: string): Promise<CartEntity> {
    return backendAPI.get<CartEntity>('/api/v1/cart', jwt)
  }

  /**
   * Update cart (add, modify, remove items)
   */
  async updateCart(
    request: UpdateCartRequest,
    jwt: string
  ): Promise<CartEntity> {
    return backendAPI.patch<CartEntity, UpdateCartRequest>(
      '/api/v1/cart',
      jwt,
      request
    )
  }

  /**
   * Sync temporary cart (from AI service) to backend cart
   * This is called before creating an order
   */
  async syncTempCartToBackend(
    tempCart: TempCart,
    jwt: string
  ): Promise<CartEntity> {
    const updateRequest: UpdateCartRequest = {
      items: tempCart.items.map(item => ({
        catalog_item_uuid: item.catalog_item_uuid,
        shop_uuid: item.shop_uuid,
        quantity: item.quantity,
      })),
    }

    return this.updateCart(updateRequest, jwt)
  }

  /**
   * Add item to temporary cart (local storage in AI service)
   */
  addToTempCart(
    tempCart: TempCart,
    item: TempCartItem
  ): TempCart {
    // IMPORTANT: Only 1 bouquet allowed in cart
    // Clear cart and add only the new item
    const newItems: TempCartItem[] = [item]

    return this.recalculateTempCart(newItems)
  }

  /**
   * Update item quantity in temporary cart
   */
  updateTempCartItem(
    tempCart: TempCart,
    catalog_item_uuid: string,
    shop_uuid: string,
    quantity: number
  ): TempCart {
    let newItems: TempCartItem[]

    if (quantity === 0) {
      // Remove item
      newItems = tempCart.items.filter(
        i => !(i.catalog_item_uuid === catalog_item_uuid && i.shop_uuid === shop_uuid)
      )
    } else {
      // Update quantity
      newItems = tempCart.items.map(item => {
        if (item.catalog_item_uuid === catalog_item_uuid && item.shop_uuid === shop_uuid) {
          return {
            ...item,
            quantity,
            total_price: quantity * item.price,
          }
        }
        return item
      })
    }

    return this.recalculateTempCart(newItems)
  }

  /**
   * Remove item from temporary cart
   */
  removeFromTempCart(
    tempCart: TempCart,
    catalog_item_uuid: string,
    shop_uuid: string
  ): TempCart {
    return this.updateTempCartItem(tempCart, catalog_item_uuid, shop_uuid, 0)
  }

  /**
   * Clear temporary cart
   */
  clearTempCart(): TempCart {
    return {
      items: [],
      total_price: 0,
      total_discount: 0,
      items_count: 0,
    }
  }

  /**
   * Recalculate temporary cart totals
   */
  private recalculateTempCart(items: TempCartItem[]): TempCart {
    const total_price = items.reduce((sum, item) => sum + item.total_price, 0)
    const items_count = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      items,
      total_price,
      total_discount: 0, // Discount calculated on backend
      items_count,
    }
  }

  /**
   * Get temporary cart summary for display
   */
  getTempCartSummary(tempCart: TempCart): string {
    if (tempCart.items.length === 0) {
      return 'Корзина пуста'
    }

    const itemsText = tempCart.items.map(item =>
      `${item.name} x${item.quantity} = ${item.total_price}₽`
    ).join('\n')

    return `
Товары в корзине:
${itemsText}

Итого: ${tempCart.total_price}₽ (${tempCart.items_count} ${this.pluralizeItems(tempCart.items_count)})
    `.trim()
  }

  /**
   * Pluralize "товар" in Russian
   */
  private pluralizeItems(count: number): string {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'товаров'
    }

    if (lastDigit === 1) {
      return 'товар'
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'товара'
    }

    return 'товаров'
  }
}

// Singleton instance
export const cartService = new CartService()
