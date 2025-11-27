/**
 * Product Grid Component
 * Displays a grid of product cards with "Load More" functionality
 */

'use client'

import { useState } from 'react'
import { Product } from '@/store/chat.store'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onLoadMore?: () => void
  hasMore?: boolean
}

export function ProductGrid({
  products,
  onAddToCart,
  onLoadMore,
  hasMore = false
}: ProductGridProps) {
  const [displayCount, setDisplayCount] = useState(4) // Initially show 4 products
  const MAX_PRODUCTS = 8 // Maximum products to show

  if (!products || products.length === 0) {
    return null
  }

  // Filter out products that are not in stock
  const availableProducts = products.filter(product => product.in_stock)

  if (availableProducts.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        К сожалению, все товары временно недоступны
      </div>
    )
  }

  // Limit available products to MAX_PRODUCTS
  const limitedProducts = availableProducts.slice(0, MAX_PRODUCTS)

  // Products to display (limited by displayCount)
  const displayedProducts = limitedProducts.slice(0, displayCount)
  const hasMoreLocal = displayCount < limitedProducts.length
  const allDisplayed = displayCount >= limitedProducts.length

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + 4, MAX_PRODUCTS)) // Show 4 more products, but not more than MAX_PRODUCTS
  }

  return (
    <div className="w-full">
      {/* Grid with 2 columns on mobile, 3 on tablet, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {displayedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Load More Button or All Products Shown Message */}
      {hasMoreLocal && (
        <div className="mt-4 text-center">
          <button
            onClick={handleShowMore}
            className="px-6 py-2 bg-[#444654] hover:bg-[#4a4b5e] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Еще варианты
          </button>
        </div>
      )}

      {/* Message when all products are displayed */}
      {allDisplayed && limitedProducts.length === MAX_PRODUCTS && (
        <div className="mt-4 text-center">
          <div className="text-gray-400 text-sm">
            Показаны все подходящие варианты. Выберите из представленных или уточните параметры поиска.
          </div>
        </div>
      )}

      {/* Info about hidden products */}
      {products.length > availableProducts.length && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Скрыто товаров не в наличии: {products.length - availableProducts.length}
        </div>
      )}
    </div>
  )
}