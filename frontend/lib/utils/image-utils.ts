/**
 * Преобразует URL изображения к нужному размеру
 *
 * @param url - Оригинальный URL изображения
 * @param size - Целевой размер ('640x640' | '1280x1280')
 * @returns URL изображения в указанном размере
 *
 * @example
 * const thumbnailUrl = getImageWithSize(product.main_image, '640x640')
 * // https://storage.yandexcloud.net/cvetov24-catalog/640x640_uuid.webp
 */
export function getImageWithSize(
  url: string | undefined,
  size: '640x640' | '1280x1280'
): string {
  if (!url) return '';

  // Замена размера в URL
  return url.replace(/\d{3,4}x\d{3,4}/, size);
}

/**
 * Получить thumbnail (640x640) для быстрой загрузки
 */
export function getThumbnailUrl(url: string | undefined): string {
  return getImageWithSize(url, '640x640');
}

/**
 * Получить полноразмерное изображение (1280x1280)
 */
export function getFullSizeUrl(url: string | undefined): string {
  return getImageWithSize(url, '1280x1280');
}
