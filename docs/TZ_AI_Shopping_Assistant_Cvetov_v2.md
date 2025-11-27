# ТЕХНИЧЕСКОЕ ЗАДАНИЕ
## AI Shopping Assistant для Цветов.ру

**Версия:** 2.2  
**Дата:** 24 ноября 2025  
**Заказчик:** Цветов.ру  
**Исполнитель:** Claude Code

**Изменения в v2.2:**
- Решение: отдельный Firebase проект для AI Assistant
- Полная изоляция от существующей инфраструктуры
- Упрощены правила безопасности (нет ограничений)

---

## ⚡ QUICK REFERENCE ДЛЯ CLAUDE CODE

### Firebase проекты Цветов.ру:

| Проект | Назначение | Статус |
|--------|------------|--------|
| `cvetov-48d4d` | Клиенты (FCM) | Существующий, НЕ ТРОГАЕМ |
| `cvetov-mobile-admin` | Магазины | Существующий, НЕ ТРОГАЕМ |
| `cvetov-ai` | **AI Assistant** | **НОВЫЙ** ✅ |

### Ключевые команды:

```bash
# Создать новый проект
firebase projects:create cvetov-ai --display-name "Цветов.ру AI"

# Использовать проект AI
firebase use cvetov-ai

# Деплой Frontend
firebase deploy --only hosting --project cvetov-ai

# Деплой API
gcloud run deploy ai-cvetov-api --region europe-west1 --project cvetov-ai
```

### Домены:
- **Frontend:** ai.cvetov.com → Firebase Hosting (cvetov-ai)
- **API:** ai.cvetov24.ru/api → Cloud Run (cvetov-ai)

### ✅ Полная свобода:
- Можно использовать любые сервисы Firebase
- Нет риска для существующих проектов
- Независимый биллинг и квоты

---

## 1. ОБЩАЯ ИНФОРМАЦИЯ

### 1.1 Описание проекта

**Название:** AI Shopping Assistant Цветов.ру

**Цель:** Создать AI-ассистента для подбора и покупки цветов через диалоговый интерфейс, используя Claude 3.5 Sonnet API.

**Аналог:** ChatGPT Shopping (OpenAI Instant Checkout), адаптированный для российского рынка цветочной доставки.

### 1.2 Архитектура доменов

| Компонент | URL | Назначение |
|-----------|-----|------------|
| **AI Frontend** | https://ai.cvetov.com | Next.js (UI чата) |
| **AI API** | https://ai.cvetov24.ru/api | Cloud Run (Claude + логика) |

**Полная карта доменов Цветов.ру:**

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
├─────────────────────────────────────────────────────────────┤
│  cvetov.com           │  Основной сайт (Next.js)            │
│  ai.cvetov.com        │  AI Shopping Assistant (Next.js)    │
│  admin.cvetov24.ru    │  Админ панель                       │
│  academy.cvetov.com   │  Обучающая платформа                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        API                                   │
├─────────────────────────────────────────────────────────────┤
│  site.cvetov24.ru/api     │  API для сайта (FastAPI)        │
│  mobile.cvetov24.ru/api   │  API для приложения (FastAPI)   │
│  ai.cvetov24.ru/api       │  API для AI assistant (Cloud Run)│
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Технологический стек

| Слой | Технология | Хостинг |
|------|------------|---------|
| Frontend | Next.js 14, React 18, TypeScript | Firebase Hosting |
| API | Node.js, Fastify, TypeScript | Google Cloud Run |
| AI | Claude 3.5 Sonnet | Anthropic API |
| Database | Firestore (опционально) | Firebase |
| Auth | Firebase Auth (опционально) | Firebase |
| Products/Orders | FastAPI (существующий) | Ваш сервер |

### 1.4 Firebase Project

**Новый проект:** `cvetov-ai` (нужно создать)

**Console:** https://console.firebase.google.com/u/0/project/cvetov-ai

#### Создание проекта:

```bash
# 1. Создать проект
firebase projects:create cvetov-ai --display-name "Цветов.ру AI"

# 2. Включить Blaze план (для Cloud Run)
# https://console.firebase.google.com/project/cvetov-ai/usage/details

# 3. Настроить проект
firebase use cvetov-ai
firebase init hosting
```

#### Сервисы для AI Assistant:

| Сервис | Использование | Статус |
|--------|---------------|--------|
| **Firebase Hosting** | ai.cvetov.com | ✅ Обязательно |
| **Cloud Run** | ai.cvetov24.ru/api | ✅ Обязательно |
| Firestore | История чатов (опционально) | ⚪ По желанию |
| Firebase Auth | Авторизация (опционально) | ⚪ По желанию |
| Analytics | Аналитика | ⚪ По желанию |

#### Карта Firebase проектов Цветов.ру:

```
Firebase Projects
│
├── cvetov-48d4d (Клиенты) — НЕ ТРОГАЕМ
│   └── FCM — push для web/Telegram
│
├── cvetov-mobile-admin (Магазины) — НЕ ТРОГАЕМ
│   └── FCM — push для приложения магазинов
│
└── cvetov-ai (AI Assistant) — НОВЫЙ ✅
    ├── Hosting → ai.cvetov.com
    ├── Cloud Run → ai.cvetov24.ru/api
    └── (опционально) Firestore, Auth, Analytics
```

#### Преимущества отдельного проекта:

✅ **Полная изоляция** — никакого риска для существующих сервисов  
✅ **Свобода действий** — можно использовать любые сервисы Firebase  
✅ **Независимые квоты** — нагрузка AI не влияет на другие проекты  
✅ **Раздельный биллинг** — легче отслеживать расходы на AI  
✅ **Простое управление** — можно удалить весь проект если не нужен

---

## 2. ИЗОЛЯЦИЯ ПРОЕКТОВ

### 2.1 Разделение инфраструктуры

```
┌─────────────────────────────────────────────────────────────────┐
│                    СУЩЕСТВУЮЩАЯ ИНФРАСТРУКТУРА                   │
│                         (НЕ ТРОГАЕМ)                             │
├─────────────────────────────────────────────────────────────────┤
│  cvetov-48d4d          │  cvetov-mobile-admin                   │
│  └── FCM (клиенты)     │  └── FCM (магазины)                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    НОВАЯ ИНФРАСТРУКТУРА                          │
│                       (AI Assistant)                             │
├─────────────────────────────────────────────────────────────────┤
│  cvetov-ai (НОВЫЙ ПРОЕКТ)                                       │
│  ├── Firebase Hosting → ai.cvetov.com                           │
│  ├── Cloud Run → ai.cvetov24.ru/api                             │
│  └── (опционально) Firestore, Auth                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Преимущества изоляции

| Аспект | Результат |
|--------|-----------|
| Риск для FCM клиентов | ✅ Нулевой (другой проект) |
| Риск для FCM магазинов | ✅ Нулевой (другой проект) |
| Свобода разработки | ✅ Полная |
| Возможность экспериментов | ✅ Да |
| Откат при проблемах | ✅ Просто удалить проект |

### 2.3 Что можно делать в cvetov-ai

✅ Любые сервисы Firebase  
✅ Cloud Functions если нужно  
✅ Firestore для истории чатов  
✅ Firebase Auth для авторизации  
✅ Любые Security Rules  
✅ Любые эксперименты  

**Ограничений нет — это изолированный проект!**

---

## 3. АРХИТЕКТУРА СИСТЕМЫ

### 2.1 Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                     ai.cvetov.com                                │
│                  (Firebase Hosting)                              │
│                                                                  │
│   Next.js Static/SSG                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Chat UI (React + shadcn/ui)                          │   │
│   │  • Product Cards                                         │   │
│   │  • Shopping Cart (Zustand + localStorage)               │   │
│   │  • Checkout Flow                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTPS (fetch + SSE streaming)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ai.cvetov24.ru/api                             │
│                    (Cloud Run)                                   │
│                                                                  │
│   Node.js + Fastify                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  POST /api/chat           → Claude AI streaming         │   │
│   │  POST /api/products/search → Proxy to FastAPI           │   │
│   │  POST /api/orders/create  → Proxy to FastAPI            │   │
│   │  GET  /api/cities         → Proxy to FastAPI            │   │
│   │  GET  /api/health         → Health check                │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌───────────────────────────────────┐
│     Claude API           │  │    site.cvetov24.ru/api           │
│     (Anthropic)          │  │    (Existing FastAPI)             │
│                          │  │                                   │
│  • AI диалог             │  │  • GET /products                  │
│  • Tool calls            │  │  • POST /products/search          │
│  • Streaming responses   │  │  • POST /orders                   │
│                          │  │  • GET /cities                    │
└──────────────────────────┘  └───────────────────────────────────┘
```

### 2.2 Структура репозитория

```
ai-cvetov/
│
├── frontend/                        # Next.js приложение
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── chat/
│   │   │   └── page.tsx            # Chat interface
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   │
│   ├── components/
│   │   ├── chat/                   # Chat компоненты
│   │   │   ├── chat-interface.tsx  # Основной компонент чата
│   │   │   ├── message-list.tsx    # Список сообщений
│   │   │   ├── message-bubble.tsx  # Отдельное сообщение
│   │   │   ├── chat-input.tsx      # Поле ввода
│   │   │   ├── typing-indicator.tsx # Индикатор печати
│   │   │   └── quick-replies.tsx   # Быстрые ответы
│   │   │
│   │   ├── products/               # Товары
│   │   │   ├── product-card.tsx    # Карточка товара
│   │   │   ├── product-grid.tsx    # Сетка товаров
│   │   │   └── product-skeleton.tsx # Skeleton loading
│   │   │
│   │   ├── cart/                   # Корзина
│   │   │   ├── shopping-cart.tsx   # Sidebar корзины
│   │   │   ├── cart-button.tsx     # Кнопка в header
│   │   │   ├── cart-item.tsx       # Товар в корзине
│   │   │   └── cart-summary.tsx    # Итог
│   │   │
│   │   ├── checkout/               # Checkout
│   │   │   ├── address-input.tsx   # Ввод адреса
│   │   │   ├── time-slots.tsx      # Выбор времени
│   │   │   ├── greeting-card.tsx   # Текст открытки
│   │   │   └── payment-method.tsx  # Способ оплаты
│   │   │
│   │   ├── ui/                     # shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── sheet.tsx
│   │   │   └── ...
│   │   │
│   │   └── layout/
│   │       ├── header.tsx
│   │       └── footer.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts           # API client
│   │   │   ├── chat.ts             # Chat API
│   │   │   ├── products.ts         # Products API
│   │   │   └── orders.ts           # Orders API
│   │   │
│   │   ├── store/
│   │   │   ├── cart-store.ts       # Zustand cart
│   │   │   └── chat-store.ts       # Chat state
│   │   │
│   │   └── utils/
│   │       ├── cn.ts               # classNames helper
│   │       └── format.ts           # Formatters
│   │
│   ├── types/
│   │   ├── product.ts
│   │   ├── cart.ts
│   │   ├── order.ts
│   │   ├── message.ts
│   │   └── index.ts
│   │
│   ├── public/
│   │   ├── images/
│   │   │   └── logo.svg
│   │   └── favicon.ico
│   │
│   ├── .env.local                  # Environment variables
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── firebase.json               # Firebase Hosting config
│   └── package.json
│
├── api/                             # Cloud Run API
│   ├── src/
│   │   ├── index.ts                # Entry point
│   │   │
│   │   ├── routes/
│   │   │   ├── chat.ts             # POST /api/chat
│   │   │   ├── products.ts         # Products routes
│   │   │   ├── orders.ts           # Orders routes
│   │   │   └── health.ts           # Health check
│   │   │
│   │   ├── services/
│   │   │   ├── claude.ts           # Claude API client
│   │   │   ├── cvetov-api.ts       # FastAPI proxy
│   │   │   └── tools.ts            # AI tools definitions
│   │   │
│   │   ├── middleware/
│   │   │   ├── cors.ts
│   │   │   ├── logger.ts
│   │   │   └── error-handler.ts
│   │   │
│   │   └── config/
│   │       ├── env.ts              # Environment config
│   │       └── prompts.ts          # System prompts
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml     # Firebase Hosting CI/CD
│       └── deploy-api.yml          # Cloud Run CI/CD
│
├── docs/
│   ├── API.md                      # API documentation
│   ├── DEPLOYMENT.md               # Deployment guide
│   └── DEVELOPMENT.md              # Development guide
│
├── README.md
└── .gitignore
```

---

## 3. FRONTEND (ai.cvetov.com)

### 3.1 Technology Stack

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    
    "zustand": "^4.5.0",
    "zod": "^3.22.4",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.344.0",
    "sonner": "^1.4.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0"
  }
}
```

### 3.2 Environment Variables

**frontend/.env.local:**
```bash
# API
NEXT_PUBLIC_API_URL=https://ai.cvetov24.ru/api

# Site
NEXT_PUBLIC_SITE_URL=https://ai.cvetov.com

# Analytics
NEXT_PUBLIC_YANDEX_METRICA_ID=98635933

# Firebase (если используется Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cvetov-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cvetov-ai
```

### 3.3 Next.js Configuration

**frontend/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export для Firebase Hosting
  
  images: {
    unoptimized: true,  // Для static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cvetov.com',
      },
      {
        protocol: 'https',
        hostname: '**.cvetov24.ru',
      },
    ],
  },
  
  // Trailing slash для Firebase Hosting
  trailingSlash: true,
}

module.exports = nextConfig
```

### 3.4 Firebase Hosting Configuration

**frontend/firebase.json:**
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

### 3.5 API Client

**frontend/lib/api/client.ts:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://ai.cvetov24.ru/api'

interface FetchOptions extends RequestInit {
  timeout?: number
}

async function fetchAPI<T>(
  endpoint: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

export { fetchAPI, API_BASE }
```

**frontend/lib/api/chat.ts:**
```typescript
import { API_BASE } from './client'
import type { Message, StreamEvent } from '@/types/message'

export async function* streamChat(
  messages: Message[]
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    throw new Error(`Chat API Error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          yield data
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

**frontend/lib/api/products.ts:**
```typescript
import { fetchAPI } from './client'
import type { Product, SearchParams } from '@/types/product'

export async function searchProducts(params: SearchParams): Promise<{ products: Product[] }> {
  return fetchAPI('/products/search', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getProduct(id: string): Promise<Product> {
  return fetchAPI(`/products/${id}`)
}
```

**frontend/lib/api/orders.ts:**
```typescript
import { fetchAPI } from './client'
import type { OrderData, OrderResponse } from '@/types/order'

export async function createOrder(order: OrderData): Promise<OrderResponse> {
  return fetchAPI('/orders/create', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}
```

### 3.6 Cart Store (Zustand)

**frontend/lib/store/cart-store.ts:**
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types/product'

interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  
  // Actions
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  
  // Computed
  getTotal: () => number
  getItemCount: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          )

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
              isOpen: true,
            }
          }

          return {
            items: [...state.items, { product, quantity: 1 }],
            isOpen: true,
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cvetov-ai-cart',
    }
  )
)
```

### 3.7 Types

**frontend/types/product.ts:**
```typescript
export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  images?: string[]
  rating: number
  reviewCount: number
  city: string
  deliveryDate: string
  shopName: string
  shopId: string
  available: boolean
  tags?: string[]
}

export interface SearchParams {
  query: string
  city: string
  budget_min?: number
  budget_max?: number
  occasion?: string
  limit?: number
}
```

**frontend/types/message.ts:**
```typescript
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
  timestamp: Date
}

export interface StreamEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'end'
  content?: string
  tool?: {
    name: string
    input: Record<string, any>
  }
  result?: any
}
```

**frontend/types/order.ts:**
```typescript
export interface OrderData {
  items: Array<{
    productId: string
    quantity: number
  }>
  delivery: {
    address: string
    city: string
    date: string
    timeSlot: string
  }
  customer: {
    name: string
    phone: string
    email?: string
  }
  greetingCard?: {
    text: string
  }
  paymentMethod: 'online' | 'cash'
}

export interface OrderResponse {
  orderId: string
  status: 'created' | 'pending' | 'confirmed'
  total: number
  paymentUrl?: string
}
```

### 3.8 Components

#### 3.8.1 Chat Interface

**frontend/components/chat/chat-interface.tsx:**
```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { ProductGrid } from '../products/product-grid'
import { streamChat } from '@/lib/api/chat'
import type { Message, StreamEvent } from '@/types/message'

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! 🌸 Я помогу подобрать идеальный букет. Расскажи, для кого и по какому поводу ищешь цветы?',
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // Stream response
      let assistantContent = ''
      let products: Product[] = []

      for await (const event of streamChat(apiMessages)) {
        if (event.type === 'text' && event.content) {
          assistantContent += event.content
          
          // Update message in real-time
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage.role === 'assistant' && lastMessage.id === 'streaming') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: assistantContent },
              ]
            } else {
              return [
                ...prev,
                {
                  id: 'streaming',
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date(),
                },
              ]
            }
          })
        }
        
        if (event.type === 'tool_result' && event.result?.products) {
          products = event.result.products
          setCurrentProducts(products)
        }
      }

      // Finalize assistant message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage.id === 'streaming') {
          return [
            ...prev.slice(0, -1),
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: assistantContent,
              products,
              timestamp: new Date(),
            },
          ]
        }
        return prev
      })
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Извини, произошла ошибка. Попробуй еще раз или обратись в поддержку.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        
        {/* Show products if available */}
        {currentProducts.length > 0 && (
          <div className="mt-4">
            <ProductGrid products={currentProducts} />
          </div>
        )}
        
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <ChatInput 
          onSend={handleSendMessage} 
          disabled={isLoading} 
        />
      </div>
    </div>
  )
}
```

#### 3.8.2 Product Card

**frontend/components/products/product-card.tsx:**
```tsx
import Image from 'next/image'
import { Star, MapPin, Truck, Store } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/store/cart-store'
import type { Product } from '@/types/product'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem)

  const handleAddToCart = () => {
    addItem(product)
    toast.success(`${product.name} добавлен в корзину`)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="relative h-48 w-full">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {/* Availability badge */}
        <div className="absolute top-2 right-2">
          {product.available ? (
            <Badge className="bg-green-500">✅ В наличии</Badge>
          ) : (
            <Badge variant="destructive">Нет в наличии</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="mb-3">
          <span className="text-2xl font-bold text-pink-500">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            ({product.reviewCount} отзывов)
          </span>
        </div>

        {/* Delivery Info */}
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{product.city}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Truck className="w-4 h-4 flex-shrink-0" />
            <span>Доставка {product.deliveryDate}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Store className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{product.shopName}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-pink-500 hover:bg-pink-600"
          onClick={handleAddToCart}
          disabled={!product.available}
        >
          Добавить в корзину
        </Button>
      </CardFooter>
    </Card>
  )
}
```

#### 3.8.3 Shopping Cart

**frontend/components/cart/shopping-cart.tsx:**
```tsx
'use client'

import { X, ShoppingCart as CartIcon, Minus, Plus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart-store'
import Image from 'next/image'

export function ShoppingCart() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    getTotal,
    getItemCount 
  } = useCart()

  const total = getTotal()
  const itemCount = getItemCount()

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CartIcon className="w-5 h-5" />
            Корзина ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Корзина пуста</p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.product.id} 
                  className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-pink-500 font-semibold">
                      {item.product.price.toLocaleString('ru-RU')} ₽
                    </p>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto text-red-500"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Итого:</span>
                <span className="font-bold text-pink-500">
                  {total.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <Button className="w-full bg-pink-500 hover:bg-pink-600">
                Оформить заказ
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={clearCart}
              >
                Очистить корзину
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

---

## 4. API (ai.cvetov24.ru)

### 4.1 Technology Stack

```json
{
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/cors": "^8.5.0",
    "@fastify/helmet": "^11.1.0",
    "@anthropic-ai/sdk": "^0.27.0",
    "zod": "^3.22.4",
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "esbuild": "^0.20.0"
  }
}
```

### 4.2 Environment Variables

**api/.env:**
```bash
# Server
PORT=8080
NODE_ENV=production

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Цветов.ру API
CVETOV_API_URL=https://site.cvetov24.ru/api
CVETOV_API_KEY=...

# CORS
ALLOWED_ORIGINS=https://ai.cvetov.com,http://localhost:3000
```

### 4.3 Server Entry Point

**api/src/index.ts:**
```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { chatRoutes } from './routes/chat'
import { productsRoutes } from './routes/products'
import { ordersRoutes } from './routes/orders'
import { healthRoutes } from './routes/health'
import { errorHandler } from './middleware/error-handler'
import { env } from './config/env'

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Middleware
await fastify.register(helmet)
await fastify.register(cors, {
  origin: env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
})

// Error handler
fastify.setErrorHandler(errorHandler)

// Routes
fastify.register(chatRoutes, { prefix: '/api' })
fastify.register(productsRoutes, { prefix: '/api' })
fastify.register(ordersRoutes, { prefix: '/api' })
fastify.register(healthRoutes, { prefix: '/api' })

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: env.PORT, 
      host: '0.0.0.0' 
    })
    fastify.log.info(`Server running on port ${env.PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
```

### 4.4 Chat Route (Claude Integration)

**api/src/routes/chat.ts:**
```typescript
import { FastifyPluginAsync } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { SYSTEM_PROMPT, TOOLS } from '../config/prompts'
import { searchProducts } from '../services/cvetov-api'
import { env } from '../config/env'

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
})

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  
  fastify.post('/chat', async (request, reply) => {
    const body = ChatRequestSchema.parse(request.body)
    const { messages } = body

    // Set headers for SSE streaming
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    try {
      const stream = anthropic.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
        tools: TOOLS,
      })

      for await (const event of stream) {
        // Handle different event types
        if (event.type === 'content_block_delta') {
          const delta = event.delta
          
          if ('text' in delta) {
            const data = JSON.stringify({
              type: 'text',
              content: delta.text,
            })
            reply.raw.write(`data: ${data}\n\n`)
          }
        }
        
        if (event.type === 'content_block_start') {
          const block = event.content_block
          
          if (block.type === 'tool_use') {
            const data = JSON.stringify({
              type: 'tool_use',
              tool: {
                name: block.name,
                id: block.id,
              },
            })
            reply.raw.write(`data: ${data}\n\n`)
          }
        }
        
        if (event.type === 'message_stop') {
          // Check for tool use and execute
          const message = await stream.finalMessage()
          
          for (const block of message.content) {
            if (block.type === 'tool_use') {
              // Execute tool
              const result = await executeToolCall(block.name, block.input)
              
              const data = JSON.stringify({
                type: 'tool_result',
                toolId: block.id,
                result,
              })
              reply.raw.write(`data: ${data}\n\n`)
            }
          }
        }
      }

      // End stream
      reply.raw.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`)
      reply.raw.end()
      
    } catch (error) {
      fastify.log.error(error)
      
      const errorData = JSON.stringify({
        type: 'error',
        message: 'Произошла ошибка при обработке запроса',
      })
      reply.raw.write(`data: ${errorData}\n\n`)
      reply.raw.end()
    }
  })
}

async function executeToolCall(name: string, input: any) {
  switch (name) {
    case 'search_products':
      return await searchProducts(input)
    
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
```

### 4.5 System Prompt

**api/src/config/prompts.ts:**
```typescript
export const SYSTEM_PROMPT = `
Ты AI-ассистент магазина доставки цветов Цветов.ру (cvetov.com).

# ТВОЯ РОЛЬ
Помогать клиентам подобрать идеальный букет цветов и оформить заказ.

# ТВОИ ЗАДАЧИ

## 1. Сбор информации
Узнай у клиента:
- Повод (день рождения, извинение, годовщина, просто так и т.д.)
- Получатель (мама, девушка, жена, коллега, друг и т.д.)
- Бюджет (приблизительный диапазон в рублях)
- Город доставки (обязательно!)
- Дата доставки (сегодня, завтра, конкретная дата)

## 2. Подбор букетов
После сбора информации:
- Используй функцию search_products
- Покажи 2-3 лучших варианта
- Объясни почему выбрал именно эти букеты

## 3. Оформление заказа
Когда клиент выбрал букет:
- Спроси адрес доставки
- Предложи временные слоты
- Предложи добавить открытку
- Помоги выбрать способ оплаты

# СТИЛЬ ОБЩЕНИЯ

**Тон:** Дружелюбный, но профессиональный. Как опытный флорист.

**Длина:** Короткие сообщения 2-3 предложения.

**Эмодзи:** Умеренно: 🌸, 💐, 🌹, ✅, 📍, 🚚, 💌

**Обращение:** На "ты"

**НЕ делай:**
- ❌ Не извиняйся без причины
- ❌ Не будь многословным
- ❌ Не используй формальный язык

# ВАЖНЫЕ ПРАВИЛА

1. **Всегда спрашивай город** перед подбором товаров
2. **Предлагай только реальные товары** из search_products
3. **Указывай точную цену** и наличие
4. **Один вопрос за раз** — не перегружай клиента

# ПРИМЕР ДИАЛОГА

User: Нужен букет
AI: Привет! 🌸 Помогу подобрать букет. Какой повод?

User: День рождения мамы
AI: Отлично! Сколько планируешь потратить?

User: До 3000
AI: Супер! В каком городе доставить?

User: Москва
AI: [использует search_products]
    Вот 3 отличных варианта для мамы:
    [показывает карточки]
    Какой больше нравится?
`

export const TOOLS = [
  {
    name: 'search_products',
    description: 'Поиск букетов в каталоге Цветов.ру по заданным критериям',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (например: "розы для мамы", "букет на годовщину")',
        },
        city: {
          type: 'string',
          description: 'Город доставки',
        },
        budget_min: {
          type: 'number',
          description: 'Минимальный бюджет в рублях',
        },
        budget_max: {
          type: 'number',
          description: 'Максимальный бюджет в рублях',
        },
        occasion: {
          type: 'string',
          description: 'Повод: birthday, anniversary, apology, romance, congratulations, sympathy, other',
        },
      },
      required: ['query', 'city'],
    },
  },
]
```

### 4.6 Цветов.ру API Client

**api/src/services/cvetov-api.ts:**
```typescript
import { env } from '../config/env'

const API_BASE = env.CVETOV_API_URL
const API_KEY = env.CVETOV_API_KEY

interface SearchParams {
  query: string
  city: string
  budget_min?: number
  budget_max?: number
  occasion?: string
  limit?: number
}

export async function searchProducts(params: SearchParams) {
  try {
    const response = await fetch(`${API_BASE}/products/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        limit: params.limit || 3,
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    return { products: data.products }
    
  } catch (error) {
    console.error('Cvetov API error:', error)
    return { 
      products: [],
      error: 'Не удалось загрузить товары' 
    }
  }
}

export async function createOrder(orderData: any) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    throw new Error(`Order creation failed: ${response.status}`)
  }

  return response.json()
}

export async function getCities() {
  const response = await fetch(`${API_BASE}/cities`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Cities fetch failed: ${response.status}`)
  }

  return response.json()
}
```

### 4.7 Dockerfile

**api/Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER api

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

---

## 5. DEPLOYMENT

### 5.1 Создание Firebase проекта cvetov-ai

**Шаг 1: Создать проект**
```bash
# Через CLI
firebase projects:create cvetov-ai --display-name "Цветов.ру AI"

# Или через консоль:
# https://console.firebase.google.com/ → Add project → cvetov-ai
```

**Шаг 2: Включить Blaze план**
```
Firebase Console → cvetov-ai → Upgrade → Blaze (pay as you go)
```
⚠️ Blaze план нужен для Cloud Run и custom domains

**Шаг 3: Установить инструменты**
```bash
# Firebase CLI
npm install -g firebase-tools

# Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Login
firebase login
gcloud auth login
```

**Шаг 4: Настроить проект локально**
```bash
cd frontend

# Выбрать проект
firebase use cvetov-ai

# Инициализировать hosting
firebase init hosting

# Ответы на вопросы:
# ? What do you want to use as your public directory? out
# ? Configure as a single-page app? Yes
# ? Set up automatic builds with GitHub? No
```

### 5.2 Deploy API (Cloud Run)

**Шаг 1: Build и Push**
```bash
cd api

# Build image
gcloud builds submit --tag gcr.io/cvetov-ai/ai-cvetov-api --project cvetov-ai

# Или локально
docker build -t gcr.io/cvetov-ai/ai-cvetov-api .
docker push gcr.io/cvetov-ai/ai-cvetov-api
```

**Шаг 2: Deploy на Cloud Run**
```bash
gcloud run deploy ai-cvetov-api \
  --image gcr.io/cvetov-ai/ai-cvetov-api \
  --project cvetov-ai \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300s \
  --set-env-vars "ANTHROPIC_API_KEY=sk-ant-...,CVETOV_API_URL=https://site.cvetov24.ru/api,CVETOV_API_KEY=...,ALLOWED_ORIGINS=https://ai.cvetov.com"
```

**Шаг 3: Настройка домена ai.cvetov24.ru**

1. В Google Cloud Console → Cloud Run → ai-cvetov-api → Manage Custom Domains
2. Add mapping → ai.cvetov24.ru
3. Получить DNS записи:
   ```
   Type: CNAME
   Name: ai
   Value: ghs.googlehosted.com
   ```
4. Добавить записи у регистратора cvetov24.ru
5. Дождаться SSL сертификата (до 24 часов)

### 5.3 Deploy Frontend (Firebase Hosting)

**Шаг 1: Проверить firebase.json**

```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Шаг 2: Build**
```bash
cd frontend

# Install dependencies
npm install

# Build
npm run build
```

**Шаг 3: Deploy**
```bash
# Убедиться что выбран правильный проект
firebase use cvetov-ai

# Deploy
firebase deploy --only hosting --project cvetov-ai
```

**Шаг 4: Настройка домена ai.cvetov.com**

1. Firebase Console → cvetov-ai → Hosting → Add custom domain
2. Ввести: ai.cvetov.com
3. Добавить DNS записи у регистратора cvetov.com:
   ```
   Type: A
   Name: ai
   Values: 
     151.101.1.195
     151.101.65.195
   
   Type: TXT
   Name: ai
   Value: hosting-site=cvetov-ai
   ```
4. Дождаться верификации

### 5.4 CI/CD (GitHub Actions)

**.github/workflows/deploy-api.yml:**
```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
      - '.github/workflows/deploy-api.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Auth to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Build and Push
        run: |
          cd api
          gcloud builds submit --tag gcr.io/cvetov-ai/ai-cvetov-api
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ai-cvetov-api \
            --image gcr.io/cvetov-ai/ai-cvetov-api \
            --region europe-west1 \
            --platform managed
```

**.github/workflows/deploy-frontend.yml:**
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        run: |
          cd frontend
          npm run build
        env:
          NEXT_PUBLIC_API_URL: https://ai.cvetov24.ru/api
          NEXT_PUBLIC_SITE_URL: https://ai.cvetov.com
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: cvetov-ai
          entryPoint: frontend
```

---

## 6. API ENDPOINTS

### 6.1 POST /api/chat

**Назначение:** AI диалог с Claude (streaming)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Нужен букет маме" },
    { "role": "assistant", "content": "Какой повод?" },
    { "role": "user", "content": "День рождения" }
  ]
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"type":"text","content":"Отлично!"}
data: {"type":"text","content":" Сколько"}
data: {"type":"text","content":" планируешь потратить?"}
data: {"type":"tool_use","tool":{"name":"search_products","id":"tool_123"}}
data: {"type":"tool_result","toolId":"tool_123","result":{"products":[...]}}
data: {"type":"end"}
```

### 6.2 POST /api/products/search

**Назначение:** Поиск товаров (proxy к FastAPI)

**Request:**
```json
{
  "query": "розы для мамы",
  "city": "Москва",
  "budget_max": 3000,
  "occasion": "birthday",
  "limit": 3
}
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Букет «Нежность»",
      "description": "25 розовых роз с эвкалиптом",
      "price": 2500,
      "image": "https://cdn.cvetov.com/...",
      "rating": 4.8,
      "reviewCount": 124,
      "city": "Москва",
      "deliveryDate": "завтра",
      "shopName": "Цветочный рай",
      "shopId": "shop_456",
      "available": true
    }
  ]
}
```

### 6.3 POST /api/orders/create

**Назначение:** Создание заказа (proxy к FastAPI)

**Request:**
```json
{
  "items": [
    { "productId": "prod_123", "quantity": 1 }
  ],
  "delivery": {
    "address": "ул. Ленина 5, кв 10",
    "city": "Москва",
    "date": "2025-11-24",
    "timeSlot": "10:00-12:00"
  },
  "customer": {
    "name": "Иван Иванов",
    "phone": "+79991234567",
    "email": "ivan@example.com"
  },
  "greetingCard": {
    "text": "С днем рождения, мама!"
  },
  "paymentMethod": "online"
}
```

**Response:**
```json
{
  "orderId": "order_abc123",
  "status": "created",
  "total": 2500,
  "paymentUrl": "https://securepay.tbank.ru/..."
}
```

### 6.4 GET /api/health

**Назначение:** Health check для Cloud Run

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T12:00:00Z",
  "version": "1.0.0"
}
```

---

## 7. АНАЛИТИКА

### 7.1 Yandex.Metrica

**Counter ID:** 98635933 (существующий)

**События:**
```typescript
// frontend/lib/analytics.ts

declare global {
  interface Window {
    ym: (id: number, action: string, goal?: string, params?: object) => void
  }
}

const COUNTER_ID = 98635933

export const analytics = {
  // Chat events
  chatStarted: () => {
    window.ym(COUNTER_ID, 'reachGoal', 'ai_chat_started')
  },
  
  productsShown: (count: number) => {
    window.ym(COUNTER_ID, 'reachGoal', 'ai_products_shown', { count })
  },
  
  // Cart events
  addToCart: (product: Product) => {
    window.ym(COUNTER_ID, 'reachGoal', 'ai_add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
    })
  },
  
  // Checkout events
  checkoutStarted: (total: number) => {
    window.ym(COUNTER_ID, 'reachGoal', 'ai_checkout_started', { total })
  },
  
  orderCreated: (orderId: string, total: number) => {
    window.ym(COUNTER_ID, 'reachGoal', 'ai_order_created', {
      order_id: orderId,
      total,
    })
  },
}
```

### 7.2 Воронка конверсии

```
1. ai_chat_started     → Открыл чат
2. ai_products_shown   → AI показал товары
3. ai_add_to_cart      → Добавил в корзину
4. ai_checkout_started → Начал checkout
5. ai_order_created    → Создал заказ
```

---

## 8. ТЕСТИРОВАНИЕ

### 8.1 Manual Testing Checklist

**Базовый flow:**
- [ ] Открыть ai.cvetov.com
- [ ] Видно приветственное сообщение от AI
- [ ] Ввести сообщение "Нужен букет маме"
- [ ] AI отвечает и спрашивает детали
- [ ] Ввести бюджет и город
- [ ] AI показывает карточки товаров
- [ ] Нажать "Добавить в корзину"
- [ ] Открыть корзину
- [ ] Изменить количество
- [ ] Удалить товар
- [ ] Очистить корзину

**API тесты:**
- [ ] `/api/health` возвращает 200
- [ ] `/api/chat` возвращает streaming response
- [ ] `/api/products/search` возвращает товары
- [ ] CORS работает для ai.cvetov.com

### 8.2 Cross-Browser Testing

- [ ] Chrome (Windows, Mac, Android)
- [ ] Safari (Mac, iOS)
- [ ] Firefox (Windows, Mac)
- [ ] Yandex Browser

### 8.3 Mobile Testing

- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Responsive design
- [ ] Touch interactions
- [ ] Virtual keyboard не перекрывает input

---

## 9. SECURITY

### 9.1 Environment Variables

**Секреты (не комитить!):**
- `ANTHROPIC_API_KEY`
- `CVETOV_API_KEY`

**Хранение:**
- Cloud Run: Secret Manager или env variables
- GitHub Actions: Repository secrets
- Local: `.env.local` (в .gitignore)

### 9.2 CORS

```typescript
// Разрешенные origins
const ALLOWED_ORIGINS = [
  'https://ai.cvetov.com',
  'http://localhost:3000', // dev only
]
```

### 9.3 Rate Limiting

**Claude API:**
- Tier 1: 50 RPM, 40K TPM
- Tier 2: 1000 RPM, 80K TPM

**Рекомендация:** Добавить rate limiting в Cloud Run или через API Gateway

---

## 10. MONITORING

### 10.1 Cloud Run Metrics

- Request count
- Request latency
- Container instances
- Memory utilization
- CPU utilization

### 10.2 Error Tracking

**Опционально: Sentry**
```typescript
// api/src/index.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### 10.3 Logging

```typescript
// Structured logging for Cloud Run
fastify.log.info({
  event: 'chat_request',
  messages_count: messages.length,
  city: extractCity(messages),
})
```

---

## 11. COSTS

### 11.1 Firebase Hosting

| Plan | Price | Limits |
|------|-------|--------|
| Spark (free) | $0 | 10GB storage, 360MB/day |
| Blaze | Pay-as-you-go | $0.026/GB transfer |

**Estimate:** $0-5/мес для MVP

### 11.2 Cloud Run

| Resource | Price |
|----------|-------|
| CPU | $0.00002400/vCPU-second |
| Memory | $0.00000250/GiB-second |
| Requests | $0.40/million |

**Estimate (10K запросов/мес):**
- ~$10-20/мес

### 11.3 Claude API

| Model | Input | Output |
|-------|-------|--------|
| Claude 3.5 Sonnet | $3/1M tokens | $15/1M tokens |

**Estimate (10K диалогов/мес):**
- Input: 10K × 2K tokens = 20M tokens → $60
- Output: 10K × 500 tokens = 5M tokens → $75
- **Total: ~$135/мес**

### 11.4 Total Monthly Cost

| Component | Cost |
|-----------|------|
| Firebase Hosting | $0-5 |
| Cloud Run | $10-20 |
| Claude API | $135 |
| **Total** | **~$150-160/мес** |

---

## 12. TIMELINE

### Week 1: Setup & API

**День 1-2:** Project setup
- [ ] Создать репозиторий
- [ ] Настроить frontend (Next.js + shadcn/ui)
- [ ] Настроить api (Fastify + TypeScript)

**День 3-4:** API development
- [ ] Интеграция с Claude API
- [ ] Streaming endpoint
- [ ] Tool calls для search_products

**День 5-7:** API deployment
- [ ] Dockerfile
- [ ] Deploy на Cloud Run
- [ ] Настроить ai.cvetov24.ru

### Week 2: Frontend Core

**День 1-3:** Chat interface
- [ ] Message list
- [ ] Chat input
- [ ] Typing indicator
- [ ] Streaming display

**День 4-5:** Product display
- [ ] Product card
- [ ] Product grid
- [ ] Loading states

**День 6-7:** Shopping cart
- [ ] Cart store (Zustand)
- [ ] Cart sidebar
- [ ] Add/Remove/Update

### Week 3: Integration & Polish

**День 1-3:** Integration
- [ ] Connect frontend to API
- [ ] Error handling
- [ ] Loading states

**День 4-5:** UI polish
- [ ] Animations
- [ ] Responsive design
- [ ] Cross-browser testing

**День 6-7:** Deployment
- [ ] Deploy frontend to Firebase
- [ ] Configure ai.cvetov.com
- [ ] Final testing

### Week 4: Testing & Launch

**День 1-2:** Testing
- [ ] Manual testing
- [ ] Bug fixes

**День 3-4:** Analytics
- [ ] Yandex.Metrica events
- [ ] Conversion tracking

**День 5:** Launch
- [ ] Go live
- [ ] Monitor

---

## 13. ACCEPTANCE CRITERIA

### 13.1 MVP Definition of Done

**Функционал:**
- [ ] AI диалог работает с Claude 3.5 Sonnet
- [ ] Streaming responses отображаются в реальном времени
- [ ] Tool calls для поиска товаров работают
- [ ] Карточки товаров отображаются в чате
- [ ] Корзина работает (add/remove/update)
- [ ] Корзина сохраняется в localStorage

**Инфраструктура:**
- [ ] API задеплоен на ai.cvetov24.ru
- [ ] Frontend задеплоен на ai.cvetov.com
- [ ] SSL работает на обоих доменах
- [ ] CORS настроен корректно

**Качество:**
- [ ] Работает на мобильных устройствах
- [ ] Нет критичных багов
- [ ] Lighthouse Score ≥ 80

---

## 14. APPENDIX: Quick Start for Claude Code

### Начало работы

```bash
# 1. Clone репозиторий
git clone <repo-url>
cd ai-cvetov

# 2. Установить зависимости
cd frontend && npm install
cd ../api && npm install

# 3. Создать .env файлы
cp frontend/.env.example frontend/.env.local
cp api/.env.example api/.env

# 4. Заполнить переменные окружения
# ANTHROPIC_API_KEY, CVETOV_API_URL, etc.

# 5. Запустить в dev режиме
# Terminal 1:
cd api && npm run dev

# Terminal 2:
cd frontend && npm run dev

# 6. Открыть http://localhost:3000
```

### Порядок разработки

1. **Сначала API:**
   - `/api/health` endpoint
   - `/api/chat` с Claude интеграцией
   - `/api/products/search` proxy

2. **Потом Frontend:**
   - Chat interface
   - Product cards
   - Shopping cart

3. **Затем интеграция:**
   - Connect frontend to API
   - Test full flow

4. **В конце deployment:**
   - Deploy API to Cloud Run
   - Deploy frontend to Firebase
   - Configure domains

---

**КОНЕЦ ТЕХНИЧЕСКОГО ЗАДАНИЯ v2.2**

**Версия:** 2.2  
**Дата:** 24 ноября 2025  
**Архитектура:** Firebase Hosting + Cloud Run  
**Домены:** ai.cvetov.com + ai.cvetov24.ru/api  
**Firebase Project:** cvetov-ai (НОВЫЙ, изолированный)

**Ключевые моменты:**
- ✅ Отдельный Firebase проект (полная изоляция)
- ✅ Нулевой риск для существующих сервисов
- ✅ Свобода использования любых сервисов Firebase
- ✅ Независимый биллинг и квоты

---

**Для вопросов:** Продолжить диалог в Claude Code
