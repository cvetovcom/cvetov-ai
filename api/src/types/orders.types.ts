/**
 * Orders Types
 * TypeScript definitions for order-related entities from Cvetov.ru Backend API
 */

import { ShortCatalogItemEntity } from './catalog.types.js'

export enum OrderStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD_ONLINE = 'card_online',
  CARD_COURIER = 'card_courier',
  SBP = 'sbp',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DeliveryType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

export interface OrderEntity {
  uuid: string
  order_number: string
  user: OrderUserEntity
  items: OrderItemEntity[]
  delivery: DeliveryEntity
  payment: PaymentEntity
  status: OrderStatus
  total_price: number
  total_discount: number
  delivery_price: number
  final_price: number
  comment: string | null
  created_at: string
  updated_at: string
  estimated_delivery_time: string | null
}

export interface OrderUserEntity {
  uuid: string
  full_name: string
  phone: string
  email: string
}

export interface OrderItemEntity {
  uuid: string
  catalog_item: ShortCatalogItemEntity
  quantity: number
  price: number
  total_price: number
  shop: OrderShopEntity
}

export interface OrderShopEntity {
  uuid: string
  name: string
  address: string
  phone: string
}

export interface DeliveryEntity {
  type: DeliveryType
  address: string | null
  city: string
  coordinates: {
    latitude: number
    longitude: number
  } | null
  recipient_name: string
  recipient_phone: string
  delivery_date: string // ISO 8601 date
  delivery_time_range: string | null // например: "10:00-12:00"
  comment: string | null
}

export interface PaymentEntity {
  method: PaymentMethod
  status: PaymentStatus
  paid_at: string | null
  payment_url: string | null
}

export interface CreateOrderRequest {
  platform?: string // default: "mobile"
}

// Для AI: информация о доставке, собираемая через диалог
export interface DeliveryInfo {
  type: DeliveryType
  address?: string
  city: string
  recipient_name: string
  recipient_phone: string
  delivery_date: string
  delivery_time_range?: string
  comment?: string
}

// Для AI: информация об оплате
export interface PaymentInfo {
  method: PaymentMethod
}
