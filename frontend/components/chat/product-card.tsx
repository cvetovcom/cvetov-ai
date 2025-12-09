import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { MCPProduct } from '@/types';
import { getThumbnailUrl } from '@/lib/utils/image-utils';

interface ProductCardProps {
  product: MCPProduct;
  onSelect: (product: MCPProduct) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>(
    product.images && product.images.length > 0
      ? product.images
      : [product.main_image]
  );
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Feature flag для прямых ссылок на cvetov.com
  const enableDirectLinks = process.env.NEXT_PUBLIC_ENABLE_DIRECT_LINKS === 'true';

  // Генерация URL товара на cvetov.com
  const getProductUrl = (): string => {
    // Используем parent_category_slug и slug из MCPProduct
    if (product.slug && product.parent_category_slug) {
      return `https://cvetov.com/product/${product.parent_category_slug}/${product.slug}/`;
    }

    // Fallback если slug отсутствует
    return product.detailUrl || 'https://cvetov.com';
  };

  // Форматирование цены без копеек
  const formatPrice = (price: number) => {
    return Math.floor(price).toLocaleString('ru-RU');
  };

  // Определяем размер шрифта в зависимости от длины цены
  const getPriceFontSize = (price: number) => {
    const priceStr = formatPrice(price);
    if (priceStr.length > 9) return 'text-xs'; // Очень длинная цена
    if (priceStr.length > 7) return 'text-sm'; // Длинная цена
    return 'text-sm'; // Нормальная цена
  };

  // Ленивая загрузка дополнительных изображений
  useEffect(() => {
    // Если уже есть несколько изображений или нет detailUrl - ничего не делаем
    if (images.length > 1 || !product.detailUrl || isLoadingImages) {
      return;
    }

    const loadAdditionalImages = async () => {
      if (!product.detailUrl) return;

      setIsLoadingImages(true);
      try {
        const response = await fetch(product.detailUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.images && Array.isArray(data.images) && data.images.length > 1) {
            // API возвращает изображения в полном размере (detail format)
            setImages(data.images);
          }
        }
      } catch (error) {
        console.error('Failed to load additional images:', error);
      } finally {
        setIsLoadingImages(false);
      }
    };

    // Загружаем дополнительные изображения сразу при монтировании компонента
    loadAdditionalImages();
  }, [product.detailUrl, product.guid]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Image Carousel */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={images[currentImageIndex]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleImageClick}
        />

        {/* Dots indicator */}
        {images.length > 1 && (
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
        )}

        {/* Discount Badge */}
        {(product.price.discount ?? 0) > 0 && (
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
            <span className={`${getPriceFontSize(product.price.final_price)} font-medium text-gray-800 whitespace-nowrap`}>
              {formatPrice(product.price.final_price)} ₽
            </span>
            {(product.price.original_price ?? 0) > product.price.final_price && (
              <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                {formatPrice(product.price.original_price ?? 0)} ₽
              </span>
            )}
          </div>
          {enableDirectLinks ? (
            <Button
              asChild
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-white h-8 px-3 flex-shrink-0"
            >
              <a
                href={getProductUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Купить
              </a>
            </Button>
          ) : (
            <Button
              onClick={() => onSelect(product)}
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-white h-8 px-3 flex-shrink-0"
            >
              Купить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
