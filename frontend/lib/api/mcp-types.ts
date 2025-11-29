// City
export interface MCPCity {
  slug: string
  name: string
  region?: string
}

// Shop
export interface MCPShop {
  guid: string  // Shop identifier
  name: string
  city_guid: string
  city_id: string
  address?: string
  slug?: string
}

// Product
export interface MCPProduct {
  id: string
  name: string
  price: {
    final_price: number
    original_price?: number
    discount?: number
  }
  main_image: string
  images?: string[]
  parent_category_slug: string
  shop_public_uuid: string
  description?: string
  rating?: number
  in_stock?: boolean
}

// API Responses
// Note: /api/v1/cities returns an array directly, not wrapped in an object
export type MCPCitiesResponse = MCPCity[]

// Note: /api/v1/shops returns an array directly, not wrapped in an object
export type MCPShopsResponse = MCPShop[]

export interface MCPCatalogResponse {
  catalog_items: MCPProduct[]
  total_count: number
  catalog_items_count?: number  // Альтернативное поле для количества
  page: number
  page_size: number
}

// Search Filters
export interface ProductSearchFilters {
  city_slug: string           // Обязательный
  min_price?: number          // Из параметра price
  max_price?: number          // Из параметра price
  preferences?: string        // Поиск в названии
  category?: string           // Категория товара
  page?: number
  page_size?: number
}
