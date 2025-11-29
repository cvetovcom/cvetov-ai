# Архитектура AI Shopping Assistant

## Обзор

Проект переработан из монолитного компонента `ResponsiveAIAssistant.tsx` в модульную архитектуру с Zustand state management и интеграцией с MCP API.

## Структура файлов

```
/
├── app/
│   └── page.tsx                         # Главная страница (использует ChatInterface)
│
├── components/
│   └── chat/
│       ├── chat-interface.tsx           # 🔴 Главный компонент
│       ├── message-bubble.tsx           # Пузырь сообщения
│       ├── chat-input.tsx               # Поле ввода
│       ├── params-progress.tsx          # Индикатор параметров
│       ├── quick-replies.tsx            # Быстрые ответы
│       ├── product-card.tsx             # Карточка товара
│       ├── product-grid.tsx             # Сетка товаров
│       ├── shopping-cart.tsx            # Корзина
│       ├── checkout-modal.tsx           # Модальное окно заказа
│       └── index.ts                     # Экспорты
│
├── lib/
│   ├── store/
│   │   └── chat-store.ts                # 🔴 Zustand store
│   └── api/
│       └── mcp-integration.md           # Инструкции по MCP API
│
├── types/
│   └── index.ts                         # TypeScript типы
│
└── App.tsx                              # Точка входа
```

## Компонентная иерархия

```
ChatInterface
  ├── ParamsProgress                 # Прогресс сбора параметров
  │
  ├── Messages Container             # Область сообщений
  │   └── MessageBubble              # Сообщение
  │       ├── ProductGrid            # Сетка товаров (если есть)
  │       │   └── ProductCard        # Карточка товара
  │       └── QuickReplies           # Быстрые ответы (если есть)
  │
  ├── ShoppingCart                   # Корзина (над вводом)
  │
  ├── ChatInput                      # Поле ввода (внизу)
  │
  └── CheckoutModal                  # Модальное окно (опционально)
```

## State Management (Zustand)

### Структура Store

```typescript
interface ChatStore {
  // Сессия
  session: {
    id: string
    mode: 'consultation' | 'search'
    params: {
      recipient: string | null
      occasion: string | null
      city: MCPCity | null
      price: string | null
      preferences: string | null
    }
    messages: Message[]
    createdAt: Date
    updatedAt: Date
  }

  // UI
  isLoading: boolean
  quickReplies: QuickReply[]

  // Корзина
  cart: CartItem[]
  isCartOpen: boolean
  isCheckoutOpen: boolean

  // Методы
  addMessage()
  updateParam()
  switchMode()
  addToCart()
  updateCartQuantity()
  removeFromCart()
  getTotalPrice()
  setCartOpen()
  setCheckoutOpen()
}
```

## Режимы работы

### 1. CONSULTATION (консультация)

**Цель**: Собрать 3 обязательных параметра

- `recipient` (Кому)
- `occasion` (Повод)
- `city` (Город)

**Переход в SEARCH**: Когда все 3 параметра собраны

### 2. SEARCH (поиск товаров)

**Цель**: Показать товары и помочь с выбором

- Поиск через MCP API
- Отображение ProductGrid
- Добавление в корзину
- Оформление заказа

## Потоки данных

### Поток сообщения

```
User Input
  ↓
addMessage('user')
  ↓
Определить какой параметр собирать
  ↓
updateParam(key, value)
  ↓
Сгенерировать ответ
  ↓
addMessage('assistant', { quickReplies?, products? })
  ↓
Обновить UI
```

### Поток переключения режимов

```
params.recipient ✅
params.occasion ✅
params.city ✅
  ↓
switchMode('search')
  ↓
Загрузить товары (MCP API)
  ↓
Отобразить ProductGrid
```

## Сохранённые стили из ResponsiveAIAssistant

✅ Все стили Tailwind сохранены:
- Цветовая схема (серый + градиенты)
- Закругления (rounded-2xl, rounded-full)
- Отступы и spacing
- Аватары (User/AI)
- Карточки товаров с каруселью
- Модальное окно оформления

✅ Структура UI:
- Sidebar (desktop/mobile)
- Welcome screen
- Chat area
- Parameters progress bar
- Quick replies buttons
- Product cards grid
- Shopping cart
- Checkout modal

## Интеграция с MCP API

См. `/lib/api/mcp-integration.md`

## TODO

- [ ] Интегрировать MCP Client
- [ ] Добавить Claude API для NLP
- [ ] Добавить Web Speech API
- [ ] Обработка ошибок
- [ ] Loading states
- [ ] Тесты

## Отличия от оригинала

| Оригинал (ResponsiveAIAssistant) | Новая архитектура |
|----------------------------------|-------------------|
| Один большой компонент (1120 строк) | Модульные компоненты (~200 строк каждый) |
| Локальный state (useState) | Zustand store |
| Моковые данные | MCP API ready |
| Простая логика if/else | Режимы consultation/search |
| Всё в одном файле | Разделение по ответственности |

## Миграция

Если нужно вернуться к старой версии:

```tsx
// App.tsx
import { ResponsiveAIAssistant } from "./components/ResponsiveAIAssistant";

export default function App() {
  return <ResponsiveAIAssistant />;
}
```

Старый компонент сохранён в `/components/ResponsiveAIAssistant.tsx`
