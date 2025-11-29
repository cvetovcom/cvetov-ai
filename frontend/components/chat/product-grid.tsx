import React, { useState } from 'react';
import { ProductCard } from './product-card';
import type { MCPProduct } from '@/types';

interface ProductGridProps {
  products: MCPProduct[];
  onSelectProduct: (product: MCPProduct) => void;
  initialVisible?: number;
}

export function ProductGrid({ products, onSelectProduct, initialVisible = 4 }: ProductGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 4, products.length));
  };

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
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
    </div>
  );
}
