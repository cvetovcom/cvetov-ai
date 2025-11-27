/**
 * Cities Cache Service
 * Caches all cities at startup to avoid API issues with null values
 * and provide fast, reliable city lookup
 */

import { catalogService } from './catalog.service.js'
import type { CityFullEntity } from '../types/index.js'

interface CachedCity {
  name: string
  slug: string
  uuid: string
  region: string | null
  shops_count: number
  is_active: boolean
}

export class CitiesCacheService {
  private cities: CachedCity[] = []
  private citiesBySlug: Map<string, CachedCity> = new Map()
  private citiesByName: Map<string, CachedCity> = new Map()
  private initialized = false

  /**
   * Initialize cache by loading all cities from API
   */
  async initialize(): Promise<void> {
    try {
      console.log('[CitiesCache] Initializing cities cache...')

      // Load all cities (API returns ~184 cities)
      const response = await catalogService.getCities({
        page: 0,
        page_size: 200
      })

      // Filter out cities with null values for safety
      const validCities = response.cities.filter(city =>
        city &&
        city.name &&
        city.slug &&
        typeof city.name === 'string' &&
        typeof city.slug === 'string'
      )

      // Store cities and create lookup maps
      this.cities = validCities.map(city => ({
        name: city.name,
        slug: city.slug,
        uuid: city.uuid,
        region: city.region,
        shops_count: city.shops_count,
        is_active: city.is_active
      }))

      // Create lookup maps for fast access
      this.cities.forEach(city => {
        this.citiesBySlug.set(city.slug.toLowerCase(), city)
        this.citiesByName.set(city.name.toLowerCase(), city)

        // Also store variants without dashes for better matching
        const nameWithoutDash = city.name.replace(/-/g, ' ').toLowerCase()
        if (nameWithoutDash !== city.name.toLowerCase()) {
          this.citiesByName.set(nameWithoutDash, city)
        }
      })

      this.initialized = true

      console.log(`[CitiesCache] Loaded ${this.cities.length} cities (${response.total_count} total, ${response.cities.length - validCities.length} filtered out)`)

      // Log some examples for debugging
      const examples = this.cities.slice(0, 5).map(c => `${c.name} (${c.slug})`)
      console.log('[CitiesCache] Examples:', examples.join(', '))

    } catch (error) {
      console.error('[CitiesCache] Failed to initialize cities cache:', error)
      // Don't throw - allow service to run without cache
      // Claude service will fall back to API calls if needed
    }
  }

  /**
   * Find city by name or slug (case-insensitive, fuzzy matching)
   */
  findCityByName(cityName: string): CachedCity | null {
    if (!this.initialized || !cityName) {
      return null
    }

    const normalizedName = cityName.toLowerCase().trim()

    // First check if it's a slug match
    const cityBySlug = this.citiesBySlug.get(normalizedName)
    if (cityBySlug) {
      console.log(`[CitiesCache] Found exact match by slug for "${cityName}": ${cityBySlug.name} (${cityBySlug.slug})`)
      return cityBySlug
    }

    // Try exact match by name
    let city = this.citiesByName.get(normalizedName)
    if (city) {
      console.log(`[CitiesCache] Found exact match for "${cityName}": ${city.name} (${city.slug})`)
      return city
    }

    // Try without dashes
    const nameWithoutDash = normalizedName.replace(/-/g, ' ')
    city = this.citiesByName.get(nameWithoutDash)
    if (city) {
      console.log(`[CitiesCache] Found match without dashes for "${cityName}": ${city.name} (${city.slug})`)
      return city
    }

    // Try partial match
    for (const [key, value] of this.citiesByName) {
      if (key.includes(normalizedName) || normalizedName.includes(key)) {
        console.log(`[CitiesCache] Found partial match for "${cityName}": ${value.name} (${value.slug})`)
        return value
      }
    }

    // Try fuzzy match - find cities that start with the search term
    for (const city of this.cities) {
      if (city.name.toLowerCase().startsWith(normalizedName)) {
        console.log(`[CitiesCache] Found fuzzy match for "${cityName}": ${city.name} (${city.slug})`)
        return city
      }
    }

    console.log(`[CitiesCache] No match found for "${cityName}"`)
    return null
  }

  /**
   * Get city by slug
   */
  getCityBySlug(slug: string): CachedCity | null {
    if (!this.initialized || !slug) {
      return null
    }

    return this.citiesBySlug.get(slug.toLowerCase()) || null
  }

  /**
   * Get all cached cities
   */
  getAllCities(): CachedCity[] {
    return [...this.cities]
  }

  /**
   * Check if cache is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      initialized: this.initialized,
      totalCities: this.cities.length,
      activeCities: this.cities.filter(c => c.is_active).length,
      citiesWithShops: this.cities.filter(c => c.shops_count > 0).length
    }
  }
}

// Singleton instance
export const citiesCacheService = new CitiesCacheService()