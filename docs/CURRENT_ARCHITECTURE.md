# Структура текущего проекта AI Shopping Assistant

> **Цель документа**: Описать текущую архитектуру для адаптации Figma-дизайна под существующую логику

## 1. Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ Chat UI      │──────│ Zustand      │                    │
│  │ Components   │      │ Store        │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                     │                             │
│         └─────────┬───────────┘                             │
│                   │                                         │
│            ┌──────▼──────┐                                  │
│            │ MCP Client  │                                  │
│            └──────┬──────┘                                  │
└────────────────────┼────────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │ MCP API     │ (https://mcp.cvetov24.ru)
              │ Proxy       │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │ Backend API │ (cvetov24.ru)
              └─────────────┘
```

## 2. Структура файлов (File Organization)

```
/frontend/
├── app/
│   ├── page.tsx                 # Главная страница с чатом
│   ├── layout.tsx               # Общий layout приложения
│   └── globals.css              # Глобальные стили Tailwind
│
├── components/
│   └── chat/
│       ├── chat-interface.tsx        # 🔴 ГЛАВНЫЙ компонент чата
│       ├── message-bubble.tsx        # Пузырь сообщения (user/assistant)
│       ├── chat-input.tsx            # Поле ввода + кнопка отправки
│       ├── quick-replies.tsx         # Быстрые ответы (кнопки)
│       ├── params-progress.tsx       # Прогресс сбора параметров
│       └── typing-indicator.tsx      # Анимация "печатает..."
│
├── lib/
│   ├── store/
│   │   └── chat-store.ts        # 🔴 Zustand store (состояние)
│   │
│   └── api/
│       ├── mcp-client.ts        # ✅ MCP API клиент (готов)
│       ├── mcp-types.ts         # ✅ TypeScript типы
│       └── mcp-filters.ts       # ✅ Утилиты фильтров
│
└── types/
    └── index.ts                 # Общие типы (Message, ChatSession)
```

## 3. Компонентная иерархия (Component Hierarchy)

```
page.tsx
  └── ChatInterface                    # Основной контейнер чата
        ├── ParamsProgress             # Прогресс-бар параметров (вверху)
        │
        ├── Messages Container         # Область сообщений
        │     ├── MessageBubble        # Сообщение пользователя
        │     ├── MessageBubble        # Ответ ассистента
        │     ├── TypingIndicator      # "Печатает..." (если идёт запрос)
        │     └── ...                  # Повторяется для каждого сообщения
        │
        ├── QuickReplies              # Быстрые кнопки (если есть)
        │
        └── ChatInput                 # Поле ввода (внизу)
              ├── <input>             # Текстовое поле
              └── <button>            # Кнопка "Отправить"
```

## 4. Система режимов (Two-Mode System)

### Режим 1: CONSULTATION (консультация)

**Цель**: Собрать 3 обязательных параметра

```
Обязательные параметры:
  1. recipient    (Кому: "маме", "девушке", "коллеге")
  2. occasion     (Повод: "день рождения", "8 марта")
  3. city         (Город: { name: "Москва", slug: "moscow" })

Опциональные параметры:
  4. price        (Бюджет: "до 5000", "от 2000 до 5000")
  5. preferences  (Предпочтения: "розы", "красные цветы")
```

**Переход в режим SEARCH**:
- Когда собраны ВСЕ 3 обязательных параметра (recipient, occasion, city)
- Автоматически вызывается MCP API для поиска товаров

### Режим 2: SEARCH (поиск товаров)

**Что происходит**:
1. `sessionParamsToFilters()` конвертирует params → MCP фильтры
2. `mcpClient.searchProducts(filters)` запрашивает товары
3. Ассистент показывает товары пользователю
4. **TODO**: Добавить ProductCard компоненты в сообщения

## 5. Потоки данных (Data Flow)

### 5.1 Основной поток сообщения

```
User Input (ChatInput)
    │
    ▼
addMessage() → chat-store.ts
    │
    ├──→ Добавить user message
    │
    ├──→ Отправить в Claude API (Haiku 3.5)
    │
    ├──→ Извлечь параметры из ответа Claude
    │    (extractParamsFromClaudeResponse)
    │
    ├──→ Обновить params в store
    │
    ├──→ Добавить assistant message
    │
    └──→ Сгенерировать QuickReplies
         (generateQuickReplies)
```

### 5.2 Поток переключения режимов

```
params.recipient ✅
params.occasion  ✅
params.city      ✅
    │
    ▼
mode = 'consultation' → mode = 'search'
    │
    ▼
sessionParamsToFilters(params)
    │
    ▼
mcpClient.searchProducts(filters)
    │
    ▼
MCPProduct[] → Товары готовы
    │
    ▼
TODO: Показать ProductCard в сообщениях
```

### 5.3 MCP API Integration Flow

```
searchProducts(filters)
    │
    ├──→ Если есть preferences (текст поиска)
    │    └──→ /api/v1/search?text=розы&slug_city=moscow
    │
    └──→ Если нет preferences
         └──→ /api/v2/catalog_items?page=0&page_size=20
              │
              ▼
         Получить все товары
              │
              ▼
         Фильтрация на клиенте:
              ├──→ По city (через getShops + shop_public_uuid)
              ├──→ По min_price
              └──→ По max_price
              │
              ▼
         MCPProduct[] (отфильтрованные)
```

## 6. Zustand Store Structure

```typescript
// /frontend/lib/store/chat-store.ts

interface ChatStore {
  // Текущая сессия
  session: {
    id: string
    mode: 'consultation' | 'search'    // Режим работы
    params: {
      recipient: string | null          // "маме", "девушке"
      occasion: string | null           // "день рождения"
      city: { name, slug } | null       // { name: "Москва", slug: "moscow" }
      price: string | null              // "до 5000"
      preferences: string | null        // "розы"
    }
    messages: Message[]
    createdAt: Date
    updatedAt: Date
  }

  // Состояния UI
  isLoading: boolean                    // Запрос к Claude идёт?
  quickReplies: QuickReply[]           // Текущие быстрые ответы

  // Методы
  addMessage: (content: string) => void          // Добавить сообщение
  updateParam: (key, value) => void              // Обновить параметр
  switchMode: (mode) => void                     // Сменить режим
  resetSession: () => void                       // Начать новую сессию
}
```

**TODO для дизайнеров**: Добавить в store:
```typescript
cart: MCPProduct[]                     // Корзина товаров
addToCart: (product) => void          // Добавить в корзину
removeFromCart: (productId) => void   // Удалить из корзины
clearCart: () => void                 // Очистить корзину
```

## 7. TypeScript Types (Основные типы)

```typescript
// Message - одно сообщение в чате
interface Message {
  id: string                           // UUID
  role: 'user' | 'assistant'          // Кто отправил
  content: string                      // Текст сообщения
  timestamp: Date                      // Время отправки
  // TODO: добавить products?: MCPProduct[] для сообщений с товарами
}

// QuickReply - быстрая кнопка
interface QuickReply {
  label: string                        // Текст на кнопке ("Маме", "Подруге")
  value: string                        // Значение для params ("маме", "подруге")
}

// MCP API Types (полностью готовы в mcp-types.ts)
interface MCPProduct {
  id: string
  name: string                         // "Букет из 25 красных роз"
  price: {
    final_price: number                // 4500 (финальная цена)
    original_price?: number            // 6000 (если была скидка)
    discount?: number                  // 25 (процент скидки)
  }
  main_image: string                   // URL главного фото
  images?: string[]                    // Дополнительные фото
  parent_category_slug: string         // "bouquets"
  shop_public_uuid: string             // ID магазина
  description?: string
  in_stock?: boolean
}

interface MCPCity {
  slug: string                         // "moscow"
  name: string                         // "Москва"
  region?: string
}

interface MCPShop {
  guid: string                         // ID магазина
  name: string                         // "Цветы24 на Тверской"
  city_guid: string
  city_id: string
  address?: string
  slug?: string
}
```

## 8. Логика Quick Replies (Быстрые ответы)

### Этапы генерации:

```
Stage 1 (occasion отсутствует):
  → Показать ТОЛЬКО кнопки поводов
  Примеры: "День рождения", "8 Марта", "Романтика"

Stage 2 (occasion есть, recipient отсутствует):
  → Показать ТОЛЬКО кнопки получателей
  Примеры: "Маме", "Девушке", "Коллеге"

Stage 3 (occasion + recipient есть, city отсутствует):
  → Показать кнопки городов ИЛИ preferences
  Примеры: "Москва", "Санкт-Петербург" ИЛИ "Розы", "Тюльпаны"

После всех 3 обязательных:
  → Переход в режим search
  → Quick replies НЕ показываются (или показывать уточнения типа "Изменить бюджет")
```

### Код генерации (упрощённо):

```typescript
function generateQuickReplies(params) {
  if (!params.occasion) {
    return OCCASION_REPLIES  // Stage 1
  }
  if (!params.recipient) {
    return RECIPIENT_REPLIES // Stage 2
  }
  if (!params.city) {
    return CITY_REPLIES      // Stage 3
  }
  return []                  // Search mode - нет кнопок
}
```

## 9. Styling Guide (Стилизация)

### 9.1 Цветовая схема Tailwind

```typescript
// tailwind.config.ts
colors: {
  primary: {
    50: '#fef2f2',    // Очень светлый красный (фоны)
    100: '#fee2e2',   // Светлый красный (hover состояния)
    500: '#DD0B20',   // 🔴 ОСНОВНОЙ БРЕНД-ЦВЕТ
    600: '#c40a1c',   // Темнее для hover
    900: '#61050e',   // Очень тёмный (текст)
  }
}
```

### 9.2 Паттерны использования

**Кнопки (Quick Replies, Send Button)**:
```css
/* Обычное состояние */
bg-white border-2 border-gray-200 text-gray-700

/* Hover */
hover:border-primary-500 hover:text-primary-500

/* Active/Selected */
bg-primary-500 text-white
```

**Message Bubble (пользователь)**:
```css
bg-gray-100 text-gray-900 rounded-2xl px-4 py-2
```

**Message Bubble (ассистент)**:
```css
bg-white border border-gray-200 text-gray-900 rounded-2xl px-4 py-2
```

**Input Field**:
```css
bg-gray-50 border border-gray-200 rounded-full px-4 py-3
focus:ring-2 focus:ring-primary-100 focus:border-primary-500
```

**Params Progress (заполненный параметр)**:
```css
bg-green-100 text-green-700 border-green-300
```

**Params Progress (незаполненный)**:
```css
bg-gray-100 text-gray-400 border-gray-200
```

### 9.3 Spacing & Layout

```css
/* Контейнер чата */
max-w-4xl mx-auto h-screen flex flex-col

/* Отступы между сообщениями */
space-y-4

/* Padding контейнера */
p-4 md:p-6

/* Rounded corners */
rounded-2xl    /* Сообщения, карточки */
rounded-full   /* Кнопки, инпуты */
```

## 10. Точки интеграции для новых компонентов

### 10.1 ProductCard - где показывать товары

**Вариант 1**: Внутри MessageBubble
```typescript
// message-bubble.tsx
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: MCPProduct[]  // ← ДОБАВИТЬ
  timestamp: Date
}

// В рендере:
{message.products && message.products.length > 0 && (
  <div className="mt-4 space-y-3">
    {message.products.map(product => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
)}
```

**Вариант 2**: Отдельный компонент после сообщений
```tsx
// chat-interface.tsx
<div className="messages">
  {messages.map(msg => <MessageBubble {...msg} />)}

  {mode === 'search' && products.length > 0 && (
    <ProductGrid products={products} />
  )}
</div>
```

### 10.2 Shopping Cart - где показывать корзину

**Рекомендация**: Slide-over panel (выезжающая панель справа)

```tsx
// chat-interface.tsx
<div className="relative">
  {/* Основной чат */}
  <ChatMessages />

  {/* Кнопка корзины (fixed, справа вверху) */}
  <button
    onClick={() => setIsCartOpen(true)}
    className="fixed top-4 right-4 bg-primary-500 text-white"
  >
    🛒 Корзина ({cart.length})
  </button>

  {/* Slide-over panel корзины */}
  {isCartOpen && (
    <ShoppingCartPanel
      cart={cart}
      onClose={() => setIsCartOpen(false)}
      onCheckout={() => setIsCheckoutOpen(true)}
    />
  )}
</div>
```

### 10.3 Checkout - где показывать оформление заказа

**Рекомендация**: Modal dialog (модальное окно поверх всего)

```tsx
// chat-interface.tsx
{isCheckoutOpen && (
  <CheckoutModal
    cart={cart}
    onClose={() => setIsCheckoutOpen(false)}
    onSubmit={(orderData) => handleOrderSubmit(orderData)}
  />
)}
```

## 11. Референс из Figma (что нужно адаптировать)

**Файл**: `/docs/AI Voice Assistant with Chat/src/components/ResponsiveAIAssistant.tsx`

### Компоненты для портирования:

1. **ProductCard** (строки 120-188)
   - Carousel для фото
   - Название, цена, скидка
   - Кнопка "В корзину"
   - Нужно адаптировать под MCPProduct type

2. **ShoppingCart** (строки 812-870)
   - Slide-over panel справа
   - Список товаров в корзине
   - Итоговая сумма
   - Кнопки "Продолжить покупки" / "Оформить заказ"

3. **CheckoutModal** (строки 931-1118)
   - Форма с полями: имя, телефон, адрес, комментарий
   - Выбор способа оплаты
   - Список товаров (summary)
   - Итоговая сумма
   - Кнопка "Оформить заказ"

### shadcn/ui компоненты (уже доступны):

```
✅ button, input, card, dialog, badge
✅ carousel, scroll-area, avatar
✅ sheet (для slide-over panel)
✅ radio-group (для способа оплаты)
```

## 12. State Management - что добавить

### Текущий store (chat-store.ts):

```typescript
✅ session (id, mode, params, messages)
✅ isLoading
✅ quickReplies
✅ addMessage()
✅ updateParam()
✅ switchMode()
```

### TODO - добавить для e-commerce:

```typescript
// Корзина
cart: MCPProduct[]
addToCart: (product: MCPProduct) => void
removeFromCart: (productId: string) => void
updateCartQuantity: (productId: string, quantity: number) => void
clearCart: () => void
getTotalPrice: () => number

// UI состояния
isCartOpen: boolean
isCheckoutOpen: boolean
setCartOpen: (open: boolean) => void
setCheckoutOpen: (open: boolean) => void

// Заказы (опционально, можно отдельный store)
submitOrder: (orderData: OrderData) => Promise<void>
```

## 13. API Integration Points

### MCP Client методы (уже готовы ✅):

```typescript
// mcp-client.ts
mcpClient.getCities()                    // Получить все города
mcpClient.findCityByName('Москва')      // Найти город по имени
mcpClient.getShops('moscow')            // Магазины в городе
mcpClient.searchProducts({              // Поиск товаров
  city_slug: 'moscow',
  preferences: 'розы',
  min_price: 2000,
  max_price: 5000,
  page: 0,
  page_size: 20
})
```

### TODO - Backend для заказов:

Нужен новый endpoint для создания заказа:

```typescript
// Примерный интерфейс (TODO: уточнить с бэкендом)
interface OrderData {
  customer: {
    name: string
    phone: string
    address: string
  }
  items: {
    product_id: string
    quantity: number
    price: number
  }[]
  total: number
  payment_method: 'card' | 'cash'
  delivery_time?: string
  comment?: string
}

// Метод для отправки заказа
async function submitOrder(orderData: OrderData) {
  // TODO: интеграция с backend API
}
```

## 14. Рекомендации для дизайнеров

### ✅ ЧТО СОХРАНИТЬ из текущей логики:

1. **Двухрежимная система** (consultation → search)
2. **Три обязательных параметра** (recipient, occasion, city)
3. **Quick Replies генерация** (по этапам)
4. **Params Progress индикатор** (визуальный прогресс сбора)
5. **MessageBubble структура** (user слева, assistant справа)
6. **Цветовая схема** (primary #DD0B20)

### 🎨 ЧТО МОЖНО ИЗМЕНИТЬ в дизайне:

1. **Визуальный стиль ProductCard** (форма, тени, анимации)
2. **Layout корзины** (slide-over vs modal vs inline)
3. **Checkout flow** (одна страница vs multi-step)
4. **Анимации** (transitions, micro-interactions)
5. **Typography** (шрифты, размеры)
6. **Spacing** (отступы между элементами)

### ⚠️ ВАЖНО УЧЕСТЬ:

1. **Mobile-first**: Всё должно работать на телефонах
2. **Responsive breakpoints**: sm (640px), md (768px), lg (1024px)
3. **Accessibility**: Контрастность, размер кликабельных элементов (min 44x44px)
4. **Loading states**: Анимации загрузки для всех async операций
5. **Error states**: Показывать ошибки пользователю

## 15. Приоритеты внедрения (порядок)

### Фаза 1: Product Display (показ товаров)
1. Добавить `products?: MCPProduct[]` в Message type
2. Создать `<ProductCard>` компонент
3. Интегрировать ProductCard в MessageBubble
4. Подключить MCP API в момент переключения в search mode

### Фаза 2: Shopping Cart (корзина)
1. Добавить cart state в Zustand store
2. Создать `<ShoppingCartPanel>` компонент (slide-over)
3. Добавить кнопку "В корзину" в ProductCard
4. Добавить иконку корзины с счётчиком товаров

### Фаза 3: Checkout (оформление)
1. Создать `<CheckoutModal>` компонент
2. Форма с валидацией (name, phone, address)
3. Подключить backend endpoint для создания заказа
4. Добавить success/error состояния

---

## Контакты и вопросы

Если у дизайнеров возникнут вопросы по структуре, пишите в общий чат проекта.

**Дата документа**: 29.11.2025
**Версия**: 1.0
**Основано на**: Текущая архитектура cvetov-ai + MCP API v2.5
