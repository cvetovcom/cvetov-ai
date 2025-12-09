import React, { useState } from 'react';
import { ProductCard } from './product-card';
import type { MCPProduct } from '@/types';

interface ProductGridProps {
  products: MCPProduct[];
  onSelectProduct: (product: MCPProduct) => void;
  citySlug?: string;
}

const INITIAL_VISIBLE = 4;
const LOAD_MORE_COUNT = 4;
const MAX_VISIBLE = 16;

export function ProductGrid({ products, onSelectProduct, citySlug }: ProductGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, products.length, MAX_VISIBLE));
  };

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length && visibleCount < MAX_VISIBLE;
  const showSiteLink = visibleCount >= MAX_VISIBLE;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visibleProducts.map((product, index) => (
          <ProductCard
            key={product.guid || `product-${index}`}
            product={product}
            onSelect={onSelectProduct}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={handleShowMore}
          className="mt-3 w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Еще варианты
        </button>
      )}

      {showSiteLink && citySlug && (
        <a
          href={`https://cvetov.com/${citySlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full py-2 text-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors underline"
        >
          Больше вариантов на сайте
        </a>
      )}
    </div>
  );
}
