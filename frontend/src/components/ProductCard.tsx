/**
 * Product Card Component
 * Displays product information in a card layout
 */

'use client'

import { Product } from '@/store/chat.store'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }

  const discountPercentage = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0

  return (
    <div className="bg-[#444654] rounded-lg overflow-hidden hover:bg-[#4a4b5e] transition-all duration-200 flex flex-col">
      {/* Product Image */}
      <div className="aspect-square relative bg-[#343541] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-20 h-20 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            -{discountPercentage}%
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white text-lg font-semibold">Нет в наличии</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2 sm:p-3 flex-1 flex flex-col">
        {/* Shop Name */}
        {product.shop_name && (
          <div className="text-[#10a37f] text-[10px] sm:text-xs font-medium mb-1">
            {product.shop_name}
          </div>
        )}

        <h3 className="text-white font-medium text-xs sm:text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-400 text-[10px] sm:text-xs mb-2 line-clamp-1 sm:line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-center gap-1 sm:gap-2 mb-2">
            <span className="text-white font-semibold text-sm sm:text-base">
              {formatPrice(product.price)}
            </span>
            {product.old_price && (
              <span className="text-gray-500 line-through text-xs sm:text-sm">
                {formatPrice(product.old_price)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.in_stock}
            className={`w-full py-1.5 sm:py-2 px-2 sm:px-4 rounded-md font-medium text-xs sm:text-sm transition-colors ${
              product.in_stock
                ? 'bg-[#10a37f] text-white hover:bg-[#0d8f6e]'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {product.in_stock ? 'Выбрать' : 'Нет в наличии'}
          </button>
        </div>
      </div>
    </div>
  )
}