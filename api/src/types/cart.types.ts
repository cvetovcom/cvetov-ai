/**
 * Cart Types
 * TypeScript definitions for cart-related entities from Cvetov.ru Backend API
 */

import { ShortCatalogItemEntity } from './catalog.types.js'

export interface CartEntity {
  uuid: string
  user_uuid: string
  items: CartItemEntity[]
  total_price: number
  total_discount: number
  items_count: number
  created_at: string
  updated_at: string
}

export interface CartItemEntity {
  uuid: string
  catalog_item: ShortCatalogItemEntity
  quantity: number
  price: number
  total_price: number
  shop_uuid: string
  created_at: string
}

export interface UpdateCartRequest {
  items: UpdateCartItemRequest[]
}

export interface UpdateCartItemRequest {
  catalog_item_uuid: string
  shop_uuid: string
  quantity: number // 0 = удалить из корзины
}

// Временная корзина для AI сервиса (хранится локально)
export interface TempCartItem {
  catalog_item_uuid: string
  shop_uuid: string
  quantity: number
  name: string // для отображения в чате
  price: number
  total_price: number
}

export interface TempCart {
  items: TempCartItem[]
  total_price: number
  total_discount: number
  items_count: number
}
