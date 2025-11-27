/**
 * Catalog Service
 * Service for searching and retrieving product information
 */

import { backendAPI } from './backend-api.service.js'
import { authService } from './auth.service.js'
import type {
  SearchRequest,
  SearchResponse,
  CatalogItemEntity,
  CitiesRequest,
  CitiesResponse,
} from '../types/index.js'

export class CatalogService {
  /**
   * Search products by text query and location
   */
  async searchProducts(
    request: SearchRequest,
    jwt?: string
  ): Promise<SearchResponse> {
    console.log('[CatalogService] searchProducts called with:', {
      text: request.text,
      shop_uuid: request.shop_uuid,
      latitude: request.latitude,
      longitude: request.longitude,
      slug_city: request.slug_city,
      page: request.page,
      page_size: request.page_size
    })

    // Validate text length
    if (!request.text || request.text.length < 3) {
      throw new Error('Search text must be at least 3 characters')
    }

    // Validate location - at least one location parameter required
    const hasLocation = !!(
      request.shop_uuid ||
      (request.latitude && request.longitude) ||
      request.slug_city
    )

    if (!hasLocation) {
      throw new Error('Location is required: shop_uuid OR latitude+longitude OR slug_city')
    }

    const params: Record<string, unknown> = {
      text: request.text,
      page: request.page || 1,
      page_size: request.page_size || 20,
    }

    if (request.shop_uuid) {
      params.shop_uuid = request.shop_uuid
      console.log(`[CatalogService] Using shop_uuid: ${request.shop_uuid}`)
    } else if (request.latitude && request.longitude) {
      params.latitude = request.latitude
      params.longitude = request.longitude
      console.log(`[CatalogService] Using coordinates: ${request.latitude}, ${request.longitude}`)
    } else if (request.slug_city) {
      params.slug_city = request.slug_city
      console.log(`[CatalogService] Using slug_city: ${request.slug_city}`)
    }

    console.log(`[CatalogService] Making API request to /v1/search with params:`, params)

    try {
      // Get anonymous token if no JWT provided
      let authToken = jwt
      if (!authToken || authToken === 'test-jwt-token') {
        console.log('[CatalogService] Getting anonymous token for search...')
        authToken = await authService.getAnonymousToken()
      }

      const result = await backendAPI.get<SearchResponse>('/v1/search', authToken, params)
      console.log(`[CatalogService] Search results:`, {
        slug_city: params.slug_city,
        latitude: params.latitude,
        longitude: params.longitude,
        text: params.text,
        total_count: result.total_count,
        items_count: result.catalog_items?.length || 0
      })
      return result
    } catch (error) {
      console.error('[CatalogService] Search error:', error)
      throw error
    }
  }

  /**
   * Get product details by slug
   */
  async getProductDetails(
    slug: string,
    jwt?: string,
    shop_uuid?: string
  ): Promise<CatalogItemEntity> {
    const params: Record<string, unknown> = {}
    if (shop_uuid) {
      params.shop_uuid = shop_uuid
    }

    // Get anonymous token if no JWT provided
    let authToken = jwt
    if (!authToken || authToken === 'test-jwt-token') {
      console.log('[CatalogService] Getting anonymous token for product details...')
      authToken = await authService.getAnonymousToken()
    }

    return backendAPI.get<CatalogItemEntity>(
      `/v1/catalog/items/${slug}`,
      authToken,
      params
    )
  }

  /**
   * Get list of available cities
   */
  async getCities(request?: CitiesRequest): Promise<CitiesResponse> {
    const params: Record<string, unknown> = {
      page: request?.page || 0,  // API uses 0-based pagination
      page_size: request?.page_size || 200,  // Get all 184 cities in one request
    }

    if (request?.query && request.query.length >= 2) {
      params.query = request.query
    }

    return backendAPI.getPublic<CitiesResponse>('/v1/cities', params)
  }

  /**
   * Search city by name
   */
  async searchCity(cityName: string): Promise<CitiesResponse> {
    if (cityName.length < 2) {
      throw new Error('City name must be at least 2 characters')
    }

    return this.getCities({ query: cityName, page: 0, page_size: 200 })
  }
}

// Singleton instance
export const catalogService = new CatalogService()
