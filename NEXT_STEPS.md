# Следующие шаги разработки 🚀

## Что уже сделано ✅

1. ✅ Настроен Firebase проект `cvetov-ai`
2. ✅ Создан Next.js приложение с TypeScript и Tailwind
3. ✅ Реализован чат-интерфейс в стиле ChatGPT
4. ✅ Режим консультации с progress bar (сбор параметров)
5. ✅ Mock-логика AI для демонстрации работы
6. ✅ Firestore rules для безопасности
7. ✅ Деплой на Firebase Hosting: https://ai.cvetov.com

## Что нужно сделать дальше 🎯

### 1. Интеграция с Claude API ⚡ (ВЫСОКИЙ ПРИОРИТЕТ)

**Файлы для изменения:**
- `frontend/components/chat/chat-interface.tsx` - заменить mock функцию `generateMockResponse`

**Шаги:**
1. Создать Firebase Functions endpoint для Claude API
2. Реализовать streaming ответов
3. Добавить извлечение параметров из текста пользователя
4. Обновить логику обновления `session.params`

**Пример кода:**
```typescript
// functions/src/index.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const chat = onRequest(async (req, res) => {
  const { messages, params } = req.body

  const stream = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: messages,
    stream: true,
    system: getConsultationPrompt(params), // см. ниже
  })

  // Streaming response
  for await (const chunk of stream) {
    res.write(JSON.stringify(chunk))
  }
  res.end()
})
```

**System Prompt для режима консультации:**
```
Ты - AI-ассистент Цветов.ру. Твоя задача:

1. Собрать 3 параметра:
   - Кому предназначены цветы (маме, жене, коллеге и т.д.)
   - Повод (день рождения, извинение, романтика и т.д.)
   - Город доставки

2. Извлекай параметры из сообщений пользователя:
   - Если параметр упомянут, верни его в формате JSON: {"param": "value"}
   - Задавай наводящие вопросы для недостающих параметров
   - Будь дружелюбным и профессиональным

3. Когда все 3 параметра собраны, сообщи об этом.

Текущие параметры:
- Кому: {recipient || "не указано"}
- Повод: {occasion || "не указано"}
- Город: {city || "не указано"}
```

### 2. Подключение к MCP Server API ⚡ (ВЫСОКИЙ ПРИОРИТЕТ)

**URL:** `https://mcp.cvetov24.ru`
**Авторизация:** Token-based (Bearer token)

**Endpoints:**
- `POST /search` - поиск товаров по параметрам
- `GET /cities` - список доступных городов
- `POST /orders` - создание заказа

**Пример запроса:**
```typescript
// frontend/lib/api/mcp-client.ts
const MCP_API_URL = process.env.NEXT_PUBLIC_MCP_API_URL || 'https://mcp.cvetov24.ru'
const MCP_TOKEN = process.env.NEXT_PUBLIC_MCP_TOKEN

export async function searchProducts(params: {
  city_slug: string
  occasion?: string
  recipient?: string
  query?: string
}) {
  const response = await fetch(`${MCP_API_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MCP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to search products')
  }

  return response.json()
}

export async function getCities(query?: string) {
  const url = new URL(`${MCP_API_URL}/cities`)
  if (query) url.searchParams.append('query', query)

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${MCP_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get cities')
  }

  return response.json()
}
```

**Конфигурация (.env.local):**
```env
NEXT_PUBLIC_MCP_API_URL=https://mcp.cvetov24.ru
NEXT_PUBLIC_MCP_TOKEN=your_project_token_here
```

### 3. Режим поиска товаров 🎯 (СРЕДНИЙ ПРИОРИТЕТ)

**Когда все 3 параметра собраны:**

1. Переключить `session.mode` на `'search'`
2. Запросить товары через MCP API
3. Отобразить карточки товаров в чате
4. Добавить функцию "В корзину"

**Файлы для создания:**
```typescript
// frontend/components/products/product-card.tsx
interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image: string
    rating: number
    available: boolean
  }
  onAddToCart: (productId: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <img src={product.image} alt={product.name} />
      <div className="p-3">
        <h3>{product.name}</h3>
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-yellow-400" />
          <span>{product.rating}</span>
        </div>
        <p className="text-primary-500 font-bold">{product.price} ₽</p>
        <button
          onClick={() => onAddToCart(product.id)}
          className="w-full bg-primary-500 text-white rounded-lg py-2"
        >
          В корзину
        </button>
      </div>
    </div>
  )
}
```

**Интеграция в чат:**
```typescript
// В chat-interface.tsx
import { searchProducts } from '@/lib/api/mcp-client'
import { ProductCard } from '@/components/products/product-card'

// После сбора всех параметров
const loadProducts = async () => {
  const products = await searchProducts({
    city_slug: session.params.city.slug,
    occasion: session.params.occasion,
    recipient: session.params.recipient,
  })

  // Отобразить карточки в чате
  setProducts(products)
}
```

### 4. Корзина и оформление заказа 🛒 (СРЕДНИЙ ПРИОРИТЕТ)

**ВАЖНО:**
- ⚠️ Заказ создается на **продакшен основного проекта** (не в AI-ассистенте)
- ⚠️ Оплата открывается точно так же, как если бы клиент оформил заказ на основном сайте
- 🔍 **Нужно изучить:** Как работает платежная система **CloudPayments** в основном проекте

**Компоненты:**
- `frontend/components/cart/shopping-cart.tsx` - sidebar корзины
- `frontend/components/cart/cart-button.tsx` - кнопка корзины в header
- `frontend/lib/store/cart-store.ts` - Zustand store для корзины

**Пример корзины:**
```typescript
// lib/store/cart-store.ts
interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product) => set((state) => {
    const existing = state.items.find(item => item.product.id === product.id)
    if (existing) {
      return {
        items: state.items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      }
    }
    return { items: [...state.items, { product, quantity: 1 }] }
  }),

  removeItem: (productId) => set((state) => ({
    items: state.items.filter(item => item.product.id !== productId),
  })),

  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ),
  })),

  clearCart: () => set({ items: [] }),

  total: () => {
    const state = get()
    return state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  },
}))
```

**Создание заказа на проде:**
```typescript
// frontend/lib/api/orders.ts
export async function createOrder(orderData: {
  items: CartItem[]
  delivery: {
    address: string
    city: string
    recipient_name: string
    recipient_phone: string
    delivery_date: string
    delivery_time_range?: string
    comment?: string
  }
  payment_method: 'card_online' | 'cash' | 'card_courier' | 'sbp'
}) {
  // Создаем заказ через MCP API
  // который проксирует запрос на основной проект
  const response = await fetch(`${MCP_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MCP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...orderData,
      platform: 'ai_assistant', // Помечаем источник заказа
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create order')
  }

  const order = await response.json()

  // order содержит:
  // - order_number
  // - payment_url (для CloudPayments)
  // - status

  return order
}
```

**Интеграция с CloudPayments:**

**TODO: Изучить документацию CloudPayments основного проекта**

Вероятная логика:
```typescript
// После создания заказа
const order = await createOrder(orderData)

if (order.payment.method === 'card_online' && order.payment.payment_url) {
  // Перенаправляем на страницу оплаты CloudPayments
  // Точно так же, как на основном сайте
  window.location.href = order.payment.payment_url

  // ИЛИ открываем в iframe/popup
  // (в зависимости от того, как реализовано в основном проекте)
}
```

**Что нужно выяснить о CloudPayments:**
1. Как генерируется payment_url?
2. Какие параметры передаются в CloudPayments?
3. Куда возвращается пользователь после оплаты (success_url, fail_url)?
4. Как обрабатываются callback'и от CloudPayments?
5. Нужна ли интеграция CloudPayments SDK в AI-ассистенте?

**Файлы для изучения в основном проекте:**
- `/api/src/services/payment.service.ts` (или аналог)
- `/api/src/routes/orders.routes.ts`
- Документация CloudPayments интеграции

### 5. Firebase Authentication 🔐 (НИЗКИЙ ПРИОРИТЕТ - делать в конце)

**Когда делать:** После того как чат полностью работает (Claude API + MCP API + корзина + оплата)

**Зачем нужно:**
- Сохранение истории чатов
- Персонализация рекомендаций
- Повторные заказы

**Что нужно реализовать:**
1. Email/Password и Google auth
2. UI для входа/регистрации
3. Сохранение чатов в Firestore под user ID
4. Связь получателей и адресов с пользователем

**Firestore структура (будет потом):**
```
users/{userId}
├── profile: {name, email, phone}
├── chats/{chatId}
│   ├── params: {recipient, occasion, city}
│   └── messages/{messageId}
└── recipients/{recipientId}
    └── occasions[{occasion, date}]
```

## Приоритеты разработки 📊

### Этап 1: Базовый чат (СЕЙЧАС) 🔴
1. ✅ Mock-чат интерфейс
2. ⏳ Интеграция Claude API
3. ⏳ Подключение к MCP API (mcp.cvetov24.ru)

### Этап 2: Поиск и покупка 🟡
4. Режим поиска товаров
5. Карточки товаров в чате
6. Корзина и оформление заказа
7. **Изучить CloudPayments** в основном проекте
8. Интеграция оплаты (точно как на основном сайте)

### Этап 3: Персонализация 🟢
9. Firebase Authentication
10. История чатов
11. Персонализация и рекомендации

## TODO: Исследование 🔍

**Перед реализацией оплаты нужно:**

1. **Изучить основной проект:**
   - Как создаются заказы?
   - Как генерируется payment_url?
   - Какая интеграция с CloudPayments?

2. **Документация CloudPayments:**
   - API endpoints
   - Параметры платежа
   - Success/Fail redirects
   - Webhook callbacks

3. **Тестовая среда:**
   - Есть ли тестовый аккаунт CloudPayments?
   - Как тестировать платежи?

## Полезные команды 💻

```bash
# Локальная разработка
cd frontend
npm run dev

# Сборка
npm run build

# Деплой на Firebase
cd /Users/bulat/cvetov-ai
firebase deploy --only hosting

# Деплой с правилами Firestore
firebase deploy --only hosting,firestore:rules

# Запуск эмуляторов (для разработки)
firebase emulators:start
```

## Конфигурация окружения 🔧

Создайте `frontend/.env.local`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cvetov-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cvetov-ai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cvetov-ai.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MCP API
NEXT_PUBLIC_MCP_API_URL=https://mcp.cvetov24.ru
NEXT_PUBLIC_MCP_TOKEN=your_project_token

# Основной проект (для справки)
NEXT_PUBLIC_MAIN_SITE_URL=https://cvetov.com
```

## Структура файлов для создания 📁

```
frontend/
├── lib/
│   └── api/
│       ├── mcp-client.ts          # ⏳ Создать - клиент для MCP API
│       ├── orders.ts              # ⏳ Создать - создание заказов
│       └── payments.ts            # ⏳ Создать - интеграция CloudPayments
├── components/
│   ├── products/
│   │   ├── product-card.tsx       # ⏳ Создать - карточка товара
│   │   └── product-grid.tsx       # ⏳ Создать - сетка товаров
│   ├── cart/
│   │   ├── shopping-cart.tsx      # ⏳ Создать - sidebar корзины
│   │   └── cart-button.tsx        # ⏳ Создать - кнопка корзины
│   └── checkout/
│       ├── checkout-modal.tsx     # ⏳ Создать - форма оформления
│       └── payment-frame.tsx      # ⏳ Создать - iframe/popup оплаты
└── types/
    ├── product.ts                 # ⏳ Создать - типы для товаров
    └── order.ts                   # ⏳ Создать - типы для заказов
```

## Документация 📚

- **ТЗ:** `docs/TZ_AI_Shopping_Assistant_Cvetov_v2.md`
- **Дизайн:** `docs/DESIGN_SPEC_AI_Shopping_Assistant.md`
- **API:** `docs/API_DOCUMENTATION.md`
- **CloudPayments:** (нужно изучить в основном проекте)

## Тестирование 🧪

**Чек-лист:**
- [x] Landing page загружается
- [x] Переход в чат работает
- [x] Сообщения отправляются
- [x] Quick replies работают
- [x] Progress bar обновляется
- [x] Адаптивность на мобильных
- [x] Анимации плавные
- [ ] Claude API работает
- [ ] MCP API подключен
- [ ] Товары отображаются
- [ ] Корзина работает
- [ ] Заказ создается на проде
- [ ] Оплата CloudPayments работает

## Следующий шаг 🎯

**Сейчас нужно:** Интегрировать Claude API для умного чата

Удачи! 🚀
