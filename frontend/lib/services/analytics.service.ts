/**
 * Сервис аналитики для Яндекс.Метрики
 * Счётчик: 98635933
 */

// ID счётчика Яндекс.Метрики
const METRIKA_ID = 98635933;

// Типы событий для воронки AI-чата
export type FunnelStage =
  | 'chat_started'           // Пользователь начал чат
  | 'message_sent'           // Отправлено сообщение
  | 'param_recipient_set'    // Указан получатель
  | 'param_occasion_set'     // Указан повод
  | 'param_city_set'         // Указан город
  | 'catalog_shown'          // Показан каталог товаров
  | 'product_click'          // Клик на товар (кнопка Купить)
  | 'product_link_click'     // Переход по ссылке на cvetov.com
  | 'cart_add'               // Добавление в корзину
  | 'checkout_start'         // Начало оформления заказа
  | 'order_complete';        // Заказ оформлен

// Параметры события
interface AnalyticsParams {
  [key: string]: string | number | boolean | undefined;
}

// Очередь событий для отложенной отправки
interface QueuedEvent {
  type: 'goal' | 'params';
  goal?: string;
  params?: AnalyticsParams;
}

const eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;
let metrikaCheckInterval: NodeJS.Timeout | null = null;

/**
 * Проверяет доступность Яндекс.Метрики
 */
function isMetrikaAvailable(): boolean {
  return typeof window !== 'undefined' &&
         typeof (window as any).ym === 'function';
}

/**
 * Обрабатывает очередь событий когда Метрика загрузится
 */
function processQueue(): void {
  if (!isMetrikaAvailable() || isProcessingQueue) return;

  isProcessingQueue = true;

  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    if (!event) continue;

    try {
      if (event.type === 'goal' && event.goal) {
        (window as any).ym(METRIKA_ID, 'reachGoal', event.goal, event.params);
        console.log('[Analytics] Цель из очереди отправлена:', event.goal, event.params);
      } else if (event.type === 'params' && event.params) {
        (window as any).ym(METRIKA_ID, 'params', event.params);
        console.log('[Analytics] Параметры из очереди отправлены:', event.params);
      }
    } catch (error) {
      console.error('[Analytics] Ошибка отправки из очереди:', error);
    }
  }

  isProcessingQueue = false;

  // Останавливаем интервал проверки если очередь пуста
  if (metrikaCheckInterval) {
    clearInterval(metrikaCheckInterval);
    metrikaCheckInterval = null;
  }
}

/**
 * Запускает периодическую проверку загрузки Метрики
 */
function startMetrikaCheck(): void {
  if (metrikaCheckInterval) return;

  metrikaCheckInterval = setInterval(() => {
    if (isMetrikaAvailable()) {
      processQueue();
    }
  }, 100); // Проверяем каждые 100мс

  // Таймаут на 10 секунд - если Метрика не загрузилась, прекращаем попытки
  setTimeout(() => {
    if (metrikaCheckInterval) {
      clearInterval(metrikaCheckInterval);
      metrikaCheckInterval = null;
      if (eventQueue.length > 0) {
        console.warn('[Analytics] Метрика не загрузилась за 10 секунд, события потеряны:', eventQueue.length);
        eventQueue.length = 0;
      }
    }
  }, 10000);
}

/**
 * Отправляет цель в Яндекс.Метрику
 */
export function reachGoal(goal: string, params?: AnalyticsParams): void {
  if (typeof window === 'undefined') return;

  if (isMetrikaAvailable()) {
    try {
      (window as any).ym(METRIKA_ID, 'reachGoal', goal, params);
      console.log('[Analytics] Цель отправлена:', goal, params);
    } catch (error) {
      console.error('[Analytics] Ошибка отправки цели:', error);
    }
  } else {
    // Добавляем в очередь
    eventQueue.push({ type: 'goal', goal, params });
    console.log('[Analytics] Цель добавлена в очередь:', goal, params);
    startMetrikaCheck();
  }
}

/**
 * Отправляет событие в Яндекс.Метрику (для параметров визитов)
 */
export function trackParams(params: AnalyticsParams): void {
  if (typeof window === 'undefined') return;

  if (isMetrikaAvailable()) {
    try {
      (window as any).ym(METRIKA_ID, 'params', params);
      console.log('[Analytics] Параметры отправлены:', params);
    } catch (error) {
      console.error('[Analytics] Ошибка отправки параметров:', error);
    }
  } else {
    // Добавляем в очередь
    eventQueue.push({ type: 'params', params });
    console.log('[Analytics] Параметры добавлены в очередь:', params);
    startMetrikaCheck();
  }
}

/**
 * Отслеживает этап воронки AI-чата
 */
export function trackFunnelStage(stage: FunnelStage, params?: AnalyticsParams): void {
  // Отправляем как цель с префиксом ai_chat_
  const goal = `ai_chat_${stage}`;
  reachGoal(goal, params);

  // Также отправляем параметры визита для сегментации
  trackParams({
    ai_chat_funnel_stage: stage,
    ...params,
  });
}

/**
 * Отслеживает начало чата
 */
export function trackChatStarted(): void {
  trackFunnelStage('chat_started');
}

/**
 * Отслеживает отправку сообщения пользователем
 */
export function trackMessageSent(message: string, messageNumber: number): void {
  trackFunnelStage('message_sent', {
    message_text: message.substring(0, 200), // Ограничиваем длину
    message_number: messageNumber,
  });
}

/**
 * Отслеживает установку параметра "Кому"
 */
export function trackRecipientSet(recipient: string): void {
  trackFunnelStage('param_recipient_set', {
    recipient,
  });
}

/**
 * Отслеживает установку параметра "Повод"
 */
export function trackOccasionSet(occasion: string): void {
  trackFunnelStage('param_occasion_set', {
    occasion,
  });
}

/**
 * Отслеживает установку параметра "Город"
 */
export function trackCitySet(city: string): void {
  trackFunnelStage('param_city_set', {
    city,
  });
}

/**
 * Отслеживает показ каталога товаров
 */
export function trackCatalogShown(productsCount: number): void {
  trackFunnelStage('catalog_shown', {
    products_count: productsCount,
  });
}

/**
 * Отслеживает клик на кнопку "Купить" (добавление в корзину)
 */
export function trackProductClick(productName: string, productPrice: number, shopName?: string): void {
  trackFunnelStage('product_click', {
    product_name: productName,
    product_price: productPrice,
    shop_name: shopName,
  });
}

/**
 * Отслеживает переход по ссылке на cvetov.com
 */
export function trackProductLinkClick(productName: string, productPrice: number, productUrl: string): void {
  trackFunnelStage('product_link_click', {
    product_name: productName,
    product_price: productPrice,
    product_url: productUrl,
  });
}

/**
 * Отслеживает добавление в корзину
 */
export function trackCartAdd(productName: string, productPrice: number): void {
  trackFunnelStage('cart_add', {
    product_name: productName,
    product_price: productPrice,
  });
}

/**
 * Отслеживает начало оформления заказа
 */
export function trackCheckoutStart(totalPrice: number, itemsCount: number): void {
  trackFunnelStage('checkout_start', {
    total_price: totalPrice,
    items_count: itemsCount,
  });
}

/**
 * Отслеживает завершение заказа
 */
export function trackOrderComplete(totalPrice: number, itemsCount: number): void {
  trackFunnelStage('order_complete', {
    total_price: totalPrice,
    items_count: itemsCount,
  });
}

/**
 * Генерирует URL с UTM-метками для перехода на cvetov.com
 */
export function addUtmParams(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  const utmParams = new URLSearchParams({
    utm_source: 'ai_chat',
    utm_medium: 'referral',
    utm_campaign: 'ai_assistant',
  });
  return `${url}${separator}${utmParams.toString()}`;
}
