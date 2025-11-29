import {
  MCPCity,
  MCPCitiesResponse,
  MCPShop,
  MCPShopsResponse,
  MCPProduct,
  MCPCatalogResponse,
  ProductSearchFilters,
} from './mcp-types'

const MCP_BASE_URL = 'https://mcp.cvetov24.ru'
const MCP_TOKEN = 'mcp_IRuYYJjDRzoeA-Lt8ivOxAcDNux5V2wA'

class MCPClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string = MCP_BASE_URL, token: string = MCP_TOKEN) {
    this.baseUrl = baseUrl
    this.token = token
  }

  // Базовый метод для запросов
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`MCP API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Получить список всех городов
   */
  async getCities(): Promise<MCPCity[]> {
    return await this.request<MCPCitiesResponse>('/api/v1/cities')
  }

  /**
   * Найти город по имени
   */
  async findCityByName(cityName: string): Promise<MCPCity | null> {
    const cities = await this.getCities()
    const normalizedName = cityName.toLowerCase().trim()

    return cities.find(city =>
      city.name.toLowerCase() === normalizedName ||
      city.slug === normalizedName
    ) || null
  }

  /**
   * Получить магазины в городе
   */
  async getShops(citySlug: string): Promise<MCPShop[]> {
    return await this.request<MCPShopsResponse>(
      `/api/v1/shops?city_slug=${citySlug}`
    )
  }

  /**
   * Поиск товаров с фильтрами
   * Использует /v1/search если есть preferences, иначе /v2/catalog_items
   */
  async searchProducts(
    filters: ProductSearchFilters
  ): Promise<MCPCatalogResponse> {
    const {
      city_slug,
      min_price,
      max_price,
      preferences,
      page = 0,
      page_size = 20,
    } = filters

    let catalogItems: MCPProduct[]
    let totalCount: number

    // Если есть preferences - используем поиск
    if (preferences && preferences.trim()) {
      const searchResponse = await this.request<{
        items: MCPProduct[]
        catalog_items_count: number
      }>(`/api/v1/search?text=${encodeURIComponent(preferences)}&slug_city=${city_slug}&page=${page}&page_size=${page_size}`)

      catalogItems = searchResponse.items
      totalCount = searchResponse.catalog_items_count
    } else {
      // Иначе - обычный каталог
      const catalogResponse = await this.request<MCPCatalogResponse>(
        `/api/v2/catalog_items?page=${page}&page_size=${page_size}`
      )

      catalogItems = catalogResponse.catalog_items
      totalCount = catalogResponse.catalog_items_count || catalogResponse.total_count
    }

    // Фильтруем на клиенте
    let filteredItems = catalogItems

    // 1. ОБЯЗАТЕЛЬНО: Фильтр по городу
    const shops = await this.getShops(city_slug)
    const shopGuids = new Set(shops.map(s => s.guid))

    filteredItems = filteredItems.filter(item =>
      shopGuids.has(item.shop_public_uuid)
    )

    // 2. Фильтр по цене (если указан)
    if (min_price !== undefined) {
      filteredItems = filteredItems.filter(
        item => item.price.final_price >= min_price
      )
    }

    if (max_price !== undefined) {
      filteredItems = filteredItems.filter(
        item => item.price.final_price <= max_price
      )
    }

    return {
      catalog_items: filteredItems,
      total_count: filteredItems.length,
      page,
      page_size,
    }
  }
}

// Экспорт singleton instance
export const mcpClient = new MCPClient()

// Экспорт класса для тестов
export { MCPClient }
