import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MCPProduct } from '@/types';

interface ProductCardProps {
  product: MCPProduct;
  onSelect: (product: MCPProduct) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Формируем массив изображений
  const images = [product.main_image, ...(product.images || [])].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Image Carousel */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={images[currentImageIndex]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Discount Badge */}
        {product.price.discount && product.price.discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            -{product.price.discount}%
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="text-sm mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2 truncate">{product.shop_name || product.shop_public_uuid}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-gray-800">{product.price.final_price.toLocaleString()} ₽</span>
            {product.price.original_price && product.price.original_price > product.price.final_price && (
              <span className="text-xs text-gray-400 line-through">
                {product.price.original_price.toLocaleString()} ₽
              </span>
            )}
          </div>
          <Button
            onClick={() => onSelect(product)}
            size="sm"
            className="bg-gray-800 hover:bg-gray-700 text-white h-8 px-3 flex-shrink-0"
          >
            Купить
          </Button>
        </div>
      </div>
    </div>
  );
}
