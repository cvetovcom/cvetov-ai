import React, { useState } from 'react';
import { ProductCard } from './product-card';
import type { MCPProduct } from '@/types';
import { Copy, Tag } from 'lucide-react';

interface ProductGridProps {
  products: MCPProduct[];
  onSelectProduct: (product: MCPProduct) => void;
  onShareProduct?: (product: MCPProduct, url: string) => void;
  citySlug?: string;
}

const INITIAL_VISIBLE = 4;
const LOAD_MORE_COUNT = 4;
const MAX_VISIBLE = 16;

export function ProductGrid({ products, onSelectProduct, onShareProduct, citySlug }: ProductGridProps) {
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
            onShare={onShareProduct}
          />
        ))}
      </div>

      {/* Info Block - Only when direct links are enabled */}
      {enableDirectLinks && (
        <div className="mt-6 space-y-4">
          {/* Info Message - стиль сообщения ассистента */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 text-sm">
                Пока я учусь принимать оплату — переходите на сайт для заказа
              </p>
            </div>
          </div>

          {/* Promocode Block - минималистичный стиль */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800 text-sm mb-2">Скидка 500 ₽ по промокоду:</p>
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 rounded-xl px-4 py-2 font-mono font-semibold text-gray-800 tracking-wider">
                  CHAT
                </span>
                <button
                  onClick={handleCopyPromocode}
                  className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Копировать"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied && (
                  <span className="text-sm text-gray-500">Скопировано</span>
                )}
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
