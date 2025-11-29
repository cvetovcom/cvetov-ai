import { ChatSession } from '@/types'
import { ProductSearchFilters } from './mcp-types'

/**
 * Парсит параметр цены из текста
 * Примеры:
 * "до 5000 руб" → { max: 5000 }
 * "от 2000 до 5000" → { min: 2000, max: 5000 }
 * "бюджет 3000" → { min: 2400, max: 3600 } (±20%)
 */
export function parsePriceParam(priceText: string): {
  min?: number
  max?: number
} {
  const text = priceText.toLowerCase()

  // "до XXXX"
  const maxMatch = text.match(/до\s+(\d+)/)
  if (maxMatch) {
    return { max: parseInt(maxMatch[1]) }
  }

  // "от XXXX до YYYY"
  const rangeMatch = text.match(/от\s+(\d+)\s+до\s+(\d+)/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2]),
    }
  }

  // "бюджет XXXX" или "около XXXX"
  const budgetMatch = text.match(/(?:бюджет|около|примерно)\s+(\d+)/)
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[1])
    return {
      min: Math.floor(budget * 0.8),  // -20%
      max: Math.ceil(budget * 1.2),   // +20%
    }
  }

  // Просто число > 1000
  const numberMatch = text.match(/(\d{4,})/)
  if (numberMatch) {
    const value = parseInt(numberMatch[1])
    return {
      min: Math.floor(value * 0.8),
      max: Math.ceil(value * 1.2),
    }
  }

  return {}
}

/**
 * Конвертирует параметры сессии в фильтры MCP API
 */
export function sessionParamsToFilters(
  params: ChatSession['params']
): ProductSearchFilters | null {
  // Обязательно нужен city
  if (!params.city) {
    console.warn('Cannot create filters: city is required')
    return null
  }

  const filters: ProductSearchFilters = {
    city_slug: params.city.slug,
  }

  // Добавляем фильтр по цене (если есть)
  if (params.price) {
    const priceRange = parsePriceParam(params.price)
    if (priceRange.min) filters.min_price = priceRange.min
    if (priceRange.max) filters.max_price = priceRange.max
  }

  // Добавляем поиск по предпочтениям (если есть)
  if (params.preferences) {
    filters.preferences = params.preferences
  }

  return filters
}
