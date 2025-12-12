import React, { useState } from 'react';
import { ProductCard } from './product-card';
import type { MCPProduct } from '@/types';
import { Copy, Tag } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  // Feature flag для прямых ссылок на cvetov.com
  const enableDirectLinks = process.env.NEXT_PUBLIC_ENABLE_DIRECT_LINKS === 'true';

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, products.length, MAX_VISIBLE));
  };

  const handleCopyPromocode = async () => {
    try {
      await navigator.clipboard.writeText('CHAT');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy promocode:', err);
    }
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

      {/* Info Block - Only when direct links are enabled */}
      {enableDirectLinks && (
        <div className="mt-4 space-y-3">
          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 text-center">
              Ассистент еще не научился принимать оплату, поэтому временно отправляем вас на сайт
            </p>
          </div>

          {/* Promocode Block */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Tag className="w-5 h-5 text-green-600 mt-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 mb-2">
                  Промокод для скидки 500 руб
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-white border-2 border-green-300 rounded-lg px-4 py-2">
                    <span className="text-lg font-bold text-green-700 tracking-wider">CHAT</span>
                  </div>
                  <button
                    onClick={handleCopyPromocode}
                    className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {copied ? 'Скопировано!' : 'Копировать'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
