# Quick Start Guide

## Что было сделано

✅ **Создана модульная архитектура** на основе ResponsiveAIAssistant.tsx

✅ **Все стили сохранены** - дизайн полностью идентичен оригиналу

✅ **Готова интеграция с MCP API** - осталось только подключить

## Структура проекта

```
/components/chat/          # Модульные компоненты чата
/lib/store/                # Zustand state management
/types/                    # TypeScript типы
/lib/api/                  # MCP API интеграция (инструкции)
```

## Запуск

Приложение уже работает с моковыми данными:

```bash
npm run dev
```

Откройте http://localhost:3000

## Основные компоненты

### 1. ChatInterface (главный)

```tsx
import { ChatInterface } from "./components/chat/chat-interface";

export default function App() {
  return <ChatInterface />;
}
```

### 2. Zustand Store

```tsx
import { useChatStore } from '@/lib/store/chat-store';

// В компоненте:
const { session, cart, addMessage, updateParam } = useChatStore();
```

### 3. Компоненты чата

- `ParamsProgress` - индикатор параметров
- `MessageBubble` - пузырь сообщения
- `QuickReplies` - быстрые ответы
- `ProductCard` - карточка товара
- `ProductGrid` - сетка товаров
- `ShoppingCart` - корзина
- `CheckoutModal` - оформление заказа

## Как это работает

### Этап 1: Сбор параметров (consultation mode)

1. Пользователь начинает разговор
2. Ассистент собирает 3 параметра:
   - Кому (recipient)
   - Повод (occasion)
   - Город (city)
3. Показывает быстрые ответы для каждого этапа
4. Прогресс отображается в ParamsProgress

### Этап 2: Поиск товаров (search mode)

1. Когда все параметры собраны → переключение в search mode
2. Загружаются товары из MCP API (пока моковые данные)
3. Отображается ProductGrid с карточками
4. Можно добавить в корзину

### Этап 3: Оформление заказа

1. Товары в корзине отображаются в ShoppingCart
2. Нажатие "Оформить заказ" → открывается CheckoutModal
3. Заполнение формы → отправка заказа

## Следующие шаги

### Интеграция с MCP API

См. `/lib/api/mcp-integration.md`

Основные шаги:

1. Создать `/lib/api/mcp-client.ts`
2. Заменить моковые данные на реальные в `chat-interface.tsx`
3. Добавить обработку ошибок

### Пример замены моковых данных:

```tsx
// Было (моковые данные):
const mockProducts: MCPProduct[] = [...]
addMessage(aiResponse, 'assistant', { products: mockProducts });

// Стало (реальные данные):
const products = await mcpClient.searchProducts({
  city_slug: session.params.city?.slug,
  preferences: session.params.preferences,
});
addMessage(aiResponse, 'assistant', { products });
```

## Тестирование

Попробуйте сценарий:

1. Нажмите "Начать разговор"
2. Введите "Маме" → получатель сохранён
3. Выберите "День рождения" → повод сохранён
4. Введите "Москва" → город сохранён
5. Выберите "Букет цветов" → показываются товары
6. Нажмите "Выбрать" на товаре → добавлен в корзину
7. Нажмите "Оформить заказ" → открывается форма

## Отладка

### Проверить состояние store:

```tsx
// В любом компоненте:
const store = useChatStore();
console.log('Session:', store.session);
console.log('Cart:', store.cart);
console.log('Mode:', store.session.mode);
```

### Проверить сообщения:

```tsx
console.log('Messages:', store.session.messages);
```

## Возврат к старой версии

Если нужно вернуться к ResponsiveAIAssistant:

```tsx
// App.tsx
import { ResponsiveAIAssistant } from "./components/ResponsiveAIAssistant";

export default function App() {
  return <ResponsiveAIAssistant />;
}
```

## Сравнение

| Функция | ResponsiveAIAssistant | ChatInterface (новая) |
|---------|----------------------|----------------------|
| Размер файла | 1120 строк | ~400 строк (разделено на модули) |
| State | useState | Zustand |
| Данные | Моковые (встроенные) | MCP API ready |
| Режимы | Неявные | Explicit (consultation/search) |
| Расширяемость | Сложно | Легко (модули) |
| Стили | ✅ Сохранены | ✅ Полностью идентичны |

## Полезные ссылки

- Архитектура: `/ARCHITECTURE.md`
- MCP API: `/lib/api/mcp-integration.md`
- Типы: `/types/index.ts`
- Store: `/lib/store/chat-store.ts`

## Вопросы?

Все компоненты задокументированы с TypeScript типами. Используйте autocomplete в IDE для изучения API.
