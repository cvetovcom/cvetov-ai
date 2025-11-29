import type { SessionParams, MCPCity } from '@/types';
import { generateQuickReplies, getNextQuestion, formatParamsSummary } from './quick-replies-generator';

export interface MessageResponse {
  text: string;
  quickReplies?: string[];
  shouldFetchProducts?: boolean;
  updatedParam?: {
    key: keyof SessionParams;
    value: any;
  };
}

/**
 * Обрабатывает сообщение пользователя и определяет ответ ассистента
 */
export function handleUserMessage(
  userMessage: string,
  currentParams: SessionParams,
  mode: 'consultation' | 'search'
): MessageResponse {
  const lowerMessage = userMessage.toLowerCase();

  // ============================================
  // CONSULTATION MODE: Сбор параметров
  // ============================================
  
  if (mode === 'consultation') {
    // Шаг 1: Собираем получателя
    if (!currentParams.recipient) {
      return {
        text: getNextQuestion({ ...currentParams, recipient: userMessage }),
        quickReplies: generateQuickReplies({ ...currentParams, recipient: userMessage }),
        updatedParam: { key: 'recipient', value: userMessage },
      };
    }

    // Шаг 2: Собираем повод
    if (!currentParams.occasion) {
      return {
        text: getNextQuestion({ ...currentParams, occasion: userMessage }),
        quickReplies: generateQuickReplies({ ...currentParams, occasion: userMessage }),
        updatedParam: { key: 'occasion', value: userMessage },
      };
    }

    // Шаг 3: Собираем город
    if (!currentParams.city) {
      // TODO: Здесь должен быть запрос к MCP API для поиска города
      const cityObj: MCPCity = {
        name: userMessage,
        slug: userMessage.toLowerCase().replace(/\s+/g, '-'),
      };

      const summary = formatParamsSummary({
        ...currentParams,
        city: cityObj,
      });

      return {
        text: `Спасибо! Я собрал всю информацию:\n\n${summary}\n\nТеперь я могу помочь вам с подбором подарка. Что вас интересует?`,
        quickReplies: ['Букет цветов', 'Подарочный набор', 'Сладости', 'Показать всё'],
        updatedParam: { key: 'city', value: cityObj },
        shouldFetchProducts: true,
      };
    }
  }

  // ============================================
  // SEARCH MODE: Работа с товарами
  // ============================================

  if (mode === 'search') {
    // Пользователь хочет увидеть товары
    if (
      lowerMessage.includes('цветы') ||
      lowerMessage.includes('букет') ||
      lowerMessage.includes('показать') ||
      lowerMessage.includes('подобр')
    ) {
      return {
        text: 'Вот что я подобрал для вас:',
        shouldFetchProducts: true,
      };
    }

    // Пользователь хочет изменить бюджет
    if (
      lowerMessage.includes('бюджет') ||
      lowerMessage.includes('цена') ||
      lowerMessage.includes('₽') ||
      lowerMessage.includes('рубл')
    ) {
      return {
        text: 'Какой бюджет вы рассматриваете?',
        quickReplies: ['До 3000₽', '3000-5000₽', '5000-10000₽', 'Премиум'],
      };
    }

    // Пользователь хочет начать заново
    if (
      lowerMessage.includes('заново') ||
      lowerMessage.includes('сначала') ||
      lowerMessage.includes('начать')
    ) {
      return {
        text: 'Хорошо, давайте начнём заново. Для кого вы хотите подобрать подарок?',
        quickReplies: ['Маме', 'Девушке', 'Подруге', 'Коллеге'],
      };
    }

    // Пользователь благодарит
    if (lowerMessage.includes('спасибо') || lowerMessage.includes('благодар')) {
      return {
        text: 'Пожалуйста! Рад помочь. Есть ещё вопросы?',
        quickReplies: ['Показать ещё товары', 'Изменить параметры', 'Нет, спасибо'],
      };
    }

    // Общий ответ
    return {
      text: 'Я могу помочь с выбором подарка. Что вас интересует?',
      quickReplies: ['Букет цветов', 'Подарочный набор', 'Сладости', 'Другое'],
    };
  }

  // Fallback
  return {
    text: 'Извините, я не понял. Можете переформулировать?',
  };
}

/**
 * Извлекает ценовой диапазон из текста
 */
export function extractPriceRange(text: string): { min?: number; max?: number } | null {
  const lowerText = text.toLowerCase();

  // "До X"
  const upToMatch = lowerText.match(/до\s+(\d+)/);
  if (upToMatch) {
    return { max: parseInt(upToMatch[1]) };
  }

  // "От X до Y"
  const rangeMatch = lowerText.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  }

  // "Премиум"
  if (lowerText.includes('премиум')) {
    return { min: 5000 };
  }

  return null;
}
