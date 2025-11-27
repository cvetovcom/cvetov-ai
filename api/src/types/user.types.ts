/**
 * User Types
 * TypeScript definitions for user-related entities from Cvetov.ru Backend API
 */

export enum UserRole {
  USER = 'user',
  ANONYM = 'anonym',
  PROMO = 'promo',
}

export interface UserEntity {
  uuid: string
  full_name: string
  first_name: string
  last_name: string
  phone: string
  email: string
  role: UserRole
  is_verified: boolean
  addresses: AddressEntity[]
  created_at: string
  updated_at: string
}

export interface AddressEntity {
  uuid: string
  address: string
  city: string
  coordinates: {
    latitude: number
    longitude: number
  }
  is_default: boolean
  label: string | null // например: "Дом", "Работа"
}

export interface JWTPayload {
  user_uuid: string
  role: UserRole
  exp: number
  iat: number
}
