/**
 * Catalog Types
 * TypeScript definitions for catalog-related entities from Cvetov.ru Backend API
 */

export interface SearchRequest {
  text: string // минимум 3 символа
  shop_uuid?: string
  latitude?: number
  longitude?: number
  slug_city?: string
  page?: number // default: 1
  page_size?: number // default: 20, max: 100
}

export interface SearchResponse {
  page: number
  page_size: number
  total_count: number
  catalog_items: ShortCatalogItemEntity[]
}

export interface ShortCatalogItemEntity {
  uuid: string
  name: string
  slug: string
  price: number
  old_price: number | null
  discount_percent: number | null
  preview_image: ImageEntity | null
  is_available: boolean
  shop: ShopPreviewEntity
  categories: CategoryEntity[]
  rating: number | null
  reviews_count: number
  is_new: boolean
  is_hit: boolean
}

export interface CatalogItemEntity extends ShortCatalogItemEntity {
  description: string
  composition: string | null
  images: ImageEntity[]
  shop: ShopEntity
  reviews: ReviewEntity[]
  characteristics: CharacteristicEntity[]
  related_items: ShortCatalogItemEntity[]
  created_at: string
  updated_at: string
}

export interface ImageEntity {
  uuid: string
  url: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
  alt: string | null
}

export interface ShopPreviewEntity {
  uuid: string
  name: string
  slug: string
  city: CityEntity
}

export interface ShopEntity extends ShopPreviewEntity {
  address: string
  phone: string
  email: string
  working_hours: string
  coordinates: {
    latitude: number
    longitude: number
  }
}

export interface CityEntity {
  uuid: string
  name: string
  slug: string
  region: string | null
}

export interface CategoryEntity {
  uuid: string
  name: string
  slug: string
  parent_uuid: string | null
}

export interface ReviewEntity {
  uuid: string
  user_name: string
  rating: number
  text: string
  images: ImageEntity[]
  created_at: string
}

export interface CharacteristicEntity {
  uuid: string
  name: string
  value: string
}

// Cities API
export interface CitiesRequest {
  query?: string // минимум 2 символа
  page?: number
  page_size?: number
}

export interface CitiesResponse {
  page: number
  page_size: number
  total_count: number
  cities: CityFullEntity[]
}

export interface CityFullEntity extends CityEntity {
  shops_count: number
  is_active: boolean
}
