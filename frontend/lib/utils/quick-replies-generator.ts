import type { SessionParams } from '@/types';

/**
 * Генерирует быстрые ответы на основе текущих собранных параметров
 */
export function generateQuickReplies(params: SessionParams): string[] {
  // Этап 1: Собираем повод
  if (!params.occasion) {
    return ['День рождения', 'Юбилей', '8 Марта', 'Просто так'];
  }
  
  // Этап 2: Собираем получателя
  if (!params.recipient) {
    return ['Маме', 'Девушке', 'Подруге', 'Коллеге'];
  }
  
  // Этап 3: Собираем город
  if (!params.city) {
    return ['Москва', 'Санкт-Петербург', 'Казань', 'Другой город'];
  }
  
  // Все параметры собраны - показываем категории
  return ['Букет цветов', 'Подарочный набор', 'Сладости', 'Показать всё'];
}

/**
 * Определяет следующий вопрос для пользователя
 */
export function getNextQuestion(params: SessionParams): string {
  if (!params.recipient) {
    return 'Для кого вы хотите подобрать подарок?';
  }
  
  if (!params.occasion) {
    return 'Отлично! Теперь подскажите, пожалуйста, по какому поводу?';
  }
  
  if (!params.city) {
    return 'Замечательно! И последний вопрос - в каком городе вы находитесь?';
  }
  
  return 'Спасибо! Я могу помочь вам с подбором подарка. Что вас интересует?';
}

/**
 * Проверяет, все ли обязательные параметры собраны
 */
export function areRequiredParamsCollected(params: SessionParams): boolean {
  return !!(params.recipient && params.occasion && params.city);
}

/**
 * Форматирует сводку собранных параметров
 */
export function formatParamsSummary(params: SessionParams): string {
  const lines: string[] = [];
  
  if (params.recipient) {
    lines.push(`✓ Кому: ${params.recipient}`);
  }
  
  if (params.occasion) {
    lines.push(`✓ Повод: ${params.occasion}`);
  }
  
  if (params.city) {
    lines.push(`✓ Город: ${params.city.name}`);
  }
  
  if (params.price) {
    lines.push(`✓ Бюджет: ${params.price}`);
  }
  
  if (params.preferences) {
    lines.push(`✓ Предпочтения: ${params.preferences}`);
  }
  
  return lines.join('\n');
}
