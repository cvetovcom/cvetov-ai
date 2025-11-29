# ТЕХНИЧЕСКОЕ ЗАДАНИЕ
## AI Shopping Assistant для Цветов.ру

**Версия:** 2.5
**Дата:** 29 ноября 2025
**Заказчик:** Цветов.ру
**Исполнитель:** Claude Code

**Изменения в v2.5:**
- ✅ Добавлена полная интеграция с MCP API (mcp.cvetov24.ru)
- ✅ Реализованы MCP клиент, типы и фильтры
- ✅ Протестированы все 4 endpoint (cities, shops, catalog, search)
- ✅ Добавлена поддержка gzip сжатия (66-75% оптимизация)
- ✅ Обновлена архитектура: AI → MCP → Backend API
- ✅ Документация MCP API с примерами кода

**Изменения в v2.4:**
- Добавлена авторизация через API cvetov.com
- Добавлена история чатов для авторизованных пользователей
- Добавлено хранение данных о клиенте (получатели, поводы, даты, адреса)
- Добавлена персонализация на основе истории
- Добавлена структура Firestore для пользователей, чатов, доставок

---

## ⚡ QUICK REFERENCE ДЛЯ CLAUDE CODE

### Два режима работы чата:

```
┌─────────────────────┐         ┌─────────────────────┐
│ РЕЖИМ КОНСУЛЬТАЦИИ  │  ────►  │  РЕЖИМ ПОИСКА       │
│ (без API товаров)   │         │  (с API товаров)    │
├─────────────────────┤         ├─────────────────────┤
│ Сбор параметров:    │         │ search_products()   │
│ • Кому              │         │ с city_slug         │
│ • Повод             │         │                     │
│ • Город             │         │ [Карточки товаров]  │
└─────────────────────┘         └─────────────────────┘
        ↓                               
   Все 3 параметра ──────────────────►
   заполнены?
```

### Авторизация и персонализация:

```
┌─────────────────────────────────────────────────────────────┐
│  ГОСТЬ                        │  АВТОРИЗОВАННЫЙ             │
├───────────────────────────────┼─────────────────────────────┤
│  ✓ Полный доступ к чату       │  ✓ Полный доступ к чату    │
│  ✗ История не сохраняется     │  ✓ История чатов           │
│  ✗ Нет персонализации         │  ✓ Данные о получателях    │
│  → Предложение войти          │  ✓ Персонализация AI       │
│    при оформлении             │  ✓ Напоминания о датах     │
└───────────────────────────────┴─────────────────────────────┘
```

### Firestore структура:

```
users/{userId}
├── recipients/{recipientId}     // Кому заказывал
│   ├── type, label, customName
│   ├── occasions[]              // Поводы + даты
│   └── addresses[]              // Города + адреса
├── chats/{chatId}               // История чатов
│   └── messages/{messageId}
└── deliveries/{deliveryId}      // Все доставки (для рассылок)
```

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
- **MCP Proxy:** mcp.cvetov24.ru → Products API Proxy (с кешированием)

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
│     Claude API           │  │    mcp.cvetov24.ru                │
│     (Anthropic)          │  │    (MCP Proxy Server)             │
│                          │  │                                   │
│  • AI диалог             │  │  • GET /api/v1/cities             │
│  • Tool calls            │  │  • GET /api/v1/shops              │
│  • Streaming responses   │  │  • GET /api/v2/catalog_items      │
│                          │  │  • GET /api/v1/search             │
└──────────────────────────┘  └───────────────────────────────────┘
                                           │
                                           ▼
                              ┌───────────────────────────────────┐
                              │    site.cvetov24.ru/api           │
                              │    (Backend FastAPI)              │
                              │                                   │
                              │  • Товары и категории             │
                              │  • Заказы и оплата                │
                              │  • Авторизация                    │
                              └───────────────────────────────────┘
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
│   │   │   ├── mcp-client.ts       # MCP API client ✅
│   │   │   ├── mcp-types.ts        # MCP TypeScript types ✅
│   │   │   ├── mcp-filters.ts      # MCP filters utilities ✅
│   │   │   ├── products.ts         # Products API (legacy)
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

## 3.5 MCP API (Model Context Protocol)

### Зачем нужен MCP сервер?

**MCP (mcp.cvetov24.ru)** — это специальный proxy-сервер между AI Assistant и основным API товаров. Он решает несколько критических задач:

1. **Кеширование данных** — города и магазины кешируются на сервере
2. **Оптимизация запросов** — сжатие данных через gzip (66-75% меньше)
3. **Изоляция нагрузки** — AI Assistant не создает лишнюю нагрузку на основной API
4. **Единая точка доступа** — все запросы товаров идут через один сервер

### ⚠️ КРИТИЧЕСКИ ВАЖНО

**ЗАПРЕЩЕНО обращаться напрямую к `site.cvetov24.ru/api`!**

Все запросы товаров, городов и магазинов **ОБЯЗАТЕЛЬНО** должны идти через MCP сервер:
```
✅ ПРАВИЛЬНО:  https://mcp.cvetov24.ru/api/v1/cities
❌ НЕПРАВИЛЬНО: https://site.cvetov24.ru/api/cities
```

### Архитектура MCP

```
┌─────────────────────────────────────────────────────────────┐
│  AI Assistant (ai.cvetov.com)                                │
│  └── mcpClient.getCities()                                   │
│      mcpClient.getShops(citySlug)                            │
│      mcpClient.searchProducts(filters)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server (mcp.cvetov24.ru)                                │
│  • Кеширование (города, магазины)                           │
│  • Gzip сжатие (66-75% меньше данных)                        │
│  • Bearer Token авторизация                                  │
│  • Лимиты и rate limiting                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API (site.cvetov24.ru/api)                          │
│  • Товары, категории, заказы                                │
│  • Оплата, доставка                                          │
│  • Авторизация пользователей                                 │
└─────────────────────────────────────────────────────────────┘
```

### MCP API Endpoints

| Метод | Путь | Описание | Кеш |
|-------|------|----------|-----|
| GET | `/api/v1/cities` | Список всех городов | ✅ Да |
| GET | `/api/v1/shops?city_slug={slug}` | Магазины в городе | ✅ Да |
| GET | `/api/v2/catalog_items?page=0&page_size=20` | Каталог товаров | ❌ Нет |
| GET | `/api/v1/search?text={query}&slug_city={city}` | Поиск товаров | ❌ Нет |

### Настройки подключения

```typescript
// frontend/lib/api/mcp-client.ts

const MCP_BASE_URL = 'https://mcp.cvetov24.ru'  // БЕЗ /api!
const MCP_TOKEN = 'mcp_IRuYYJjDRzoeA-Lt8ivOxAcDNux5V2wA'

// ВАЖНО: Обязательные заголовки
const headers = {
  'Authorization': `Bearer ${MCP_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip, deflate',  // ← Для сжатия!
}
```

### Структура данных MCP API

#### 1. Cities (GET /api/v1/cities)

**Возвращает:** Массив напрямую (НЕ обёрнут в объект)

```typescript
interface MCPCity {
  slug: string        // "moscow", "saint-petersburg"
  name: string        // "Москва", "Санкт-Петербург"
  region?: string     // "г Москва"
}

// Response: MCPCity[] (массив)
```

Пример:
```json
[
  {
    "slug": "moscow",
    "name": "Москва",
    "region": "г Москва"
  },
  {
    "slug": "saint-petersburg",
    "name": "Санкт-Петербург",
    "region": "г Санкт-Петербург"
  }
]
```

#### 2. Shops (GET /api/v1/shops?city_slug=moscow)

**Возвращает:** Массив напрямую (НЕ обёрнут в объект)

```typescript
interface MCPShop {
  guid: string        // "6014f251-7251-4e1b-835b-b61248ed163d"
  name: string        // "Цветов.ру - Ландау"
  city_guid: string   // GUID города
  city_id: string     // ID города
  address?: string    // "г. Москва, ул. Ландау, д. 5"
  slug?: string       // "tsvetov-ru-landau"
}

// Response: MCPShop[] (массив)
```

#### 3. Catalog Items (GET /api/v2/catalog_items)

**Возвращает:** Объект с пагинацией

```typescript
interface MCPProduct {
  guid: string
  name: string
  description?: string
  price: {
    base_price: number
    discount: number
    final_price: number
  }
  main_image: string
  images?: string[]
  parent_category_slug: string
  shop_public_uuid: string  // ← Связь с магазином!
  slug: string
  in_stock?: boolean
}

interface MCPCatalogResponse {
  catalog_items: MCPProduct[]
  catalog_items_count: number  // ← Правильное поле!
  total_count: number          // Тоже может быть
  page: number
  page_size: number
}
```

#### 4. Search (GET /api/v1/search)

**Параметры:**
- `text` (НЕ `q`!) — текст поиска
- `slug_city` (обязательно!) — slug города
- `page` — номер страницы (0-based)
- `page_size` — размер страницы

```typescript
interface MCPSearchResponse {
  catalog_items: MCPProduct[]
  catalog_items_count: number
  page: number
  page_count: number  // Общее кол-во страниц
}
```

### MCP Client Implementation

#### Создание клиента

```typescript
// frontend/lib/api/mcp-client.ts

class MCPClient {
  private baseUrl = 'https://mcp.cvetov24.ru'
  private token = 'mcp_IRuYYJjDRzoeA-Lt8ivOxAcDNux5V2wA'

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
    })

    if (!response.ok) {
      throw new Error(`MCP API error: ${response.status}`)
    }

    return response.json()
  }

  // Получить все города
  async getCities(): Promise<MCPCity[]> {
    return await this.request<MCPCity[]>('/api/v1/cities')
  }

  // Найти город по имени
  async findCityByName(cityName: string): Promise<MCPCity | null> {
    const cities = await this.getCities()
    const normalized = cityName.toLowerCase().trim()

    return cities.find(city =>
      city.name.toLowerCase() === normalized ||
      city.slug === normalized
    ) || null
  }

  // Получить магазины в городе
  async getShops(citySlug: string): Promise<MCPShop[]> {
    return await this.request<MCPShop[]>(
      `/api/v1/shops?city_slug=${citySlug}`
    )
  }

  // Поиск товаров с фильтрами
  async searchProducts(filters: ProductSearchFilters): Promise<MCPCatalogResponse> {
    const {
      city_slug,
      min_price,
      max_price,
      preferences,
      page = 0,
      page_size = 20,
    } = filters

    let items: MCPProduct[]
    let totalCount: number

    // Если есть preferences — используем поиск
    if (preferences?.trim()) {
      const result = await this.request<MCPSearchResponse>(
        `/api/v1/search?text=${encodeURIComponent(preferences)}&slug_city=${city_slug}&page=${page}&page_size=${page_size}`
      )
      items = result.catalog_items
      totalCount = result.catalog_items_count
    } else {
      // Иначе — обычный каталог
      const result = await this.request<MCPCatalogResponse>(
        `/api/v2/catalog_items?page=${page}&page_size=${page_size}`
      )
      items = result.catalog_items
      totalCount = result.catalog_items_count || result.total_count
    }

    // Фильтруем по городу (обязательно!)
    const shops = await this.getShops(city_slug)
    const shopGuids = new Set(shops.map(s => s.guid))

    let filtered = items.filter(item =>
      shopGuids.has(item.shop_public_uuid)
    )

    // Фильтр по цене
    if (min_price !== undefined) {
      filtered = filtered.filter(item => item.price.final_price >= min_price)
    }
    if (max_price !== undefined) {
      filtered = filtered.filter(item => item.price.final_price <= max_price)
    }

    return {
      catalog_items: filtered,
      total_count: filtered.length,
      catalog_items_count: filtered.length,
      page,
      page_size,
    }
  }
}

// Singleton экземпляр
export const mcpClient = new MCPClient()
```

#### Фильтры и утилиты

```typescript
// frontend/lib/api/mcp-filters.ts

interface ProductSearchFilters {
  city_slug: string         // Обязательно!
  min_price?: number        // Из параметра price
  max_price?: number        // Из параметра price
  preferences?: string      // Поиск по тексту
  page?: number
  page_size?: number
}

// Парсинг цены из текста
function parsePriceParam(text: string): { min?: number, max?: number } {
  const lower = text.toLowerCase()

  // "до 5000"
  const maxMatch = lower.match(/до\s+(\d+)/)
  if (maxMatch) {
    return { max: parseInt(maxMatch[1]) }
  }

  // "от 2000 до 5000"
  const rangeMatch = lower.match(/от\s+(\d+)\s+до\s+(\d+)/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2]),
    }
  }

  // "бюджет 3000" → ±20%
  const budgetMatch = lower.match(/(?:бюджет|около|примерно)\s+(\d+)/)
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[1])
    return {
      min: Math.floor(budget * 0.8),
      max: Math.ceil(budget * 1.2),
    }
  }

  return {}
}

// Конвертация параметров сессии в фильтры
function sessionParamsToFilters(
  params: ChatSession['params']
): ProductSearchFilters | null {
  if (!params.city) {
    return null  // Город обязателен!
  }

  const filters: ProductSearchFilters = {
    city_slug: params.city.slug,
  }

  if (params.price) {
    const priceRange = parsePriceParam(params.price)
    if (priceRange.min) filters.min_price = priceRange.min
    if (priceRange.max) filters.max_price = priceRange.max
  }

  if (params.preferences) {
    filters.preferences = params.preferences
  }

  return filters
}
```

### Тестирование MCP API

```bash
# Тест всех endpoints
node test-mcp-api.mjs

# Результаты:
# ✅ /api/v1/cities - 184 города (515ms)
# ✅ /api/v1/shops?city_slug=moscow - 20 магазинов (450ms)
# ✅ /api/v2/catalog_items - 16,222 товара (320ms)
# ✅ /api/v1/search?text=розы&slug_city=moscow - найдено товаров (380ms)
```

### Важные особенности

1. **Gzip обязателен** — без `Accept-Encoding: gzip, deflate` запросы к `/api/v1/cities` и `/api/v1/shops` будут timeout из-за больших данных

2. **Массивы vs Объекты** — cities и shops возвращают массивы напрямую, а catalog_items и search возвращают объекты с пагинацией

3. **Поля ответов:**
   - Shops используют `guid` (НЕ `public_uuid`)
   - Products используют `shop_public_uuid` для связи
   - Search использует `catalog_items_count` (НЕ `total_count`)

4. **Параметры search:**
   - `text` (НЕ `q`)
   - `slug_city` (обязательно!)

5. **Фильтрация по городу** — ОБЯЗАТЕЛЬНА на клиенте, т.к. API может вернуть товары из других городов

### Файлы реализации

```
frontend/
├── lib/api/
│   ├── mcp-client.ts       ✅ MCP API клиент
│   ├── mcp-types.ts        ✅ TypeScript типы
│   └── mcp-filters.ts      ✅ Утилиты фильтрации
│
└── app/test-mcp/
    └── page.tsx            ✅ Тестовая страница

test-mcp-api.mjs            ✅ Node.js тест скрипт
```

### Статус реализации

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| MCP Types | ✅ Готово | `/frontend/lib/api/mcp-types.ts` |
| MCP Client | ✅ Готово | `/frontend/lib/api/mcp-client.ts` |
| MCP Filters | ✅ Готово | `/frontend/lib/api/mcp-filters.ts` |
| Test Page | ✅ Готово | `/frontend/app/test-mcp/page.tsx` |
| Test Script | ✅ Готово | `test-mcp-api.mjs` |
| Все endpoints | ✅ Работают | Gzip включен, все 4 endpoint протестированы |

---

## 4. ЛОГИКА РАБОТЫ ЧАТА

### 4.1 Два режима работы

```
┌─────────────────────────────────────────────────────────────────┐
│                      РЕЖИМ КОНСУЛЬТАЦИИ                          │
│                    (без запросов к API товаров)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Сбор параметров от клиента:                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    КОМУ     │  │    ПОВОД    │  │    ГОРОД    │             │
│  │   ✓ / ✗     │  │   ✓ / ✗     │  │   ✓ / ✗     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  Все три параметра заполнены?                                   │
│                    │                                             │
│                    ▼                                             │
│              ┌─────────┐                                        │
│              │   ДА    │────────────────────────────────────┐   │
│              └─────────┘                                    │   │
│                                                              │   │
└──────────────────────────────────────────────────────────────│───┘
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      РЕЖИМ ПОИСКА ТОВАРОВ                        │
│                    (запросы к API с городом)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  → Запрос товаров по API с параметрами:                         │
│    - city_slug: выбранный город                                 │
│    - occasion: повод (опционально)                              │
│    - recipient: кому (опционально)                              │
│                                                                  │
│  → Показ карточек товаров                                       │
│  → Добавление в корзину                                         │
│  → Оформление заказа                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Параметры сессии

```typescript
// types/session.ts
interface ChatSession {
  id: string
  mode: 'consultation' | 'search'
  
  // Параметры консультации
  params: {
    recipient: string | null    // Кому (жене, маме, сестре...)
    occasion: string | null     // Повод (день рождения, свадьба...)
    city: {
      name: string              // "Москва"
      slug: string              // "moscow"
    } | null
  }
  
  // История сообщений
  messages: Message[]
  
  // Корзина
  cart: CartItem[]
  
  createdAt: Date
  updatedAt: Date
}
```

### 4.3 Справочник "Кому" (recipients)

```typescript
// config/recipients.ts
export const RECIPIENTS = [
  { value: 'wife', label: 'Жене', keywords: ['жене', 'жена', 'супруге', 'супруга'] },
  { value: 'husband', label: 'Мужу', keywords: ['мужу', 'муж', 'супругу', 'супруг'] },
  { value: 'mother', label: 'Маме', keywords: ['маме', 'мама', 'матери', 'мать'] },
  { value: 'father', label: 'Папе', keywords: ['папе', 'папа', 'отцу', 'отец'] },
  { value: 'sister', label: 'Сестре', keywords: ['сестре', 'сестра', 'сестрёнке'] },
  { value: 'brother', label: 'Брату', keywords: ['брату', 'брат'] },
  { value: 'grandmother', label: 'Бабушке', keywords: ['бабушке', 'бабушка', 'бабуле'] },
  { value: 'grandfather', label: 'Дедушке', keywords: ['дедушке', 'дедушка', 'деду'] },
  { value: 'daughter', label: 'Дочери', keywords: ['дочери', 'дочь', 'дочке', 'дочка'] },
  { value: 'son', label: 'Сыну', keywords: ['сыну', 'сын'] },
  { value: 'girlfriend', label: 'Девушке', keywords: ['девушке', 'девушка', 'любимой'] },
  { value: 'boyfriend', label: 'Парню', keywords: ['парню', 'парень', 'любимому'] },
  { value: 'friend_female', label: 'Подруге', keywords: ['подруге', 'подруга'] },
  { value: 'friend_male', label: 'Другу', keywords: ['другу', 'друг'] },
  { value: 'colleague', label: 'Коллеге', keywords: ['коллеге', 'коллега', 'сотруднику', 'начальнику', 'боссу'] },
  { value: 'teacher', label: 'Учителю', keywords: ['учителю', 'учитель', 'преподавателю', 'воспитателю'] },
  { value: 'doctor', label: 'Врачу', keywords: ['врачу', 'врач', 'доктору'] },
  { value: 'self', label: 'Себе', keywords: ['себе', 'для себя', 'мне'] },
  { value: 'other', label: 'Другое', keywords: [] },
] as const

export type RecipientValue = typeof RECIPIENTS[number]['value']
```

### 4.4 Справочник "Повод" (occasions)

```typescript
// config/occasions.ts
export const OCCASIONS = [
  { value: 'birthday', label: 'День рождения', keywords: ['день рождения', 'др', 'днюха', 'именины'] },
  { value: 'anniversary', label: 'Юбилей', keywords: ['юбилей', 'круглая дата'] },
  { value: 'wedding', label: 'Свадьба', keywords: ['свадьба', 'свадьбу', 'бракосочетание'] },
  { value: 'wedding_anniversary', label: 'Годовщина свадьбы', keywords: ['годовщина', 'годовщину свадьбы'] },
  { value: 'mothers_day', label: 'День матери', keywords: ['день матери', 'день мамы'] },
  { value: 'valentines', label: '14 февраля', keywords: ['14 февраля', 'день влюблённых', 'валентинка', 'день святого валентина'] },
  { value: 'march_8', label: '8 марта', keywords: ['8 марта', 'восьмое марта', 'женский день'] },
  { value: 'new_year', label: 'Новый год', keywords: ['новый год', 'рождество'] },
  { value: 'graduation', label: 'Выпускной', keywords: ['выпускной', 'окончание школы', 'окончание университета'] },
  { value: 'baby_birth', label: 'Рождение ребёнка', keywords: ['рождение', 'выписка', 'выписку из роддома'] },
  { value: 'proposal', label: 'Предложение руки', keywords: ['предложение', 'помолвка', 'предложение руки'] },
  { value: 'apology', label: 'Извинение', keywords: ['извинение', 'извиниться', 'прощение', 'простить'] },
  { value: 'thanks', label: 'Благодарность', keywords: ['благодарность', 'спасибо', 'поблагодарить'] },
  { value: 'get_well', label: 'Выздоровление', keywords: ['выздоровление', 'болеет', 'в больнице', 'поправляйся'] },
  { value: 'condolences', label: 'Соболезнования', keywords: ['соболезнования', 'похороны', 'траур', 'прощание'] },
  { value: 'love', label: 'Признание в любви', keywords: ['люблю', 'любовь', 'признание'] },
  { value: 'no_reason', label: 'Без повода', keywords: ['без повода', 'просто так', 'настроение', 'порадовать'] },
  { value: 'other', label: 'Другой повод', keywords: [] },
] as const

export type OccasionValue = typeof OCCASIONS[number]['value']
```

### 4.5 Города (загрузка из API)

#### Структура данных

```typescript
// types/city.ts
interface City {
  id: string
  name: string          // "Москва"
  slug: string          // "moscow"
  region?: string       // "Московская область"
  isActive: boolean
  updatedAt: Date
}
```

#### База данных (Firestore)

```
Firestore Collection: cities
├── moscow
│   ├── name: "Москва"
│   ├── slug: "moscow"
│   ├── region: "Московская область"
│   ├── isActive: true
│   └── updatedAt: 2025-11-24T12:00:00Z
├── saint-petersburg
│   ├── name: "Санкт-Петербург"
│   ├── slug: "saint-petersburg"
│   ...
└── ...
```

#### Синхронизация городов (Cloud Scheduler — каждый час)

```typescript
// jobs/sync-cities.ts
import { db } from '../lib/firebase-admin'

const CVETOV_API_URL = process.env.CVETOV_API_URL

/**
 * Синхронизация городов из API Цветов.ру
 * Запускается каждый час через Cloud Scheduler
 */
export async function syncCities() {
  console.log('[SyncCities] Starting sync...')
  
  try {
    // 1. Получить города из API
    const response = await fetch(`${CVETOV_API_URL}/cities`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const { cities } = await response.json() as { cities: ApiCity[] }
    
    console.log(`[SyncCities] Received ${cities.length} cities from API`)
    
    // 2. Batch update в Firestore
    const batch = db.batch()
    const citiesRef = db.collection('cities')
    
    for (const city of cities) {
      const docRef = citiesRef.doc(city.slug)
      batch.set(docRef, {
        name: city.name,
        slug: city.slug,
        region: city.region || null,
        isActive: true,
        updatedAt: new Date(),
      }, { merge: true })
    }
    
    await batch.commit()
    
    console.log(`[SyncCities] Successfully synced ${cities.length} cities`)
    
    return { success: true, count: cities.length }
    
  } catch (error) {
    console.error('[SyncCities] Error:', error)
    throw error
  }
}

// API Response type
interface ApiCity {
  name: string
  slug: string
  region?: string
}
```

#### Cloud Scheduler настройка

```yaml
# cloud-scheduler.yaml
name: sync-cities-job
schedule: "0 * * * *"  # Каждый час в :00
timeZone: "Europe/Moscow"
httpTarget:
  uri: "https://ai.cvetov24.ru/api/jobs/sync-cities"
  httpMethod: "POST"
  headers:
    Authorization: "Bearer ${CRON_SECRET}"
```

#### API endpoint для синхронизации

```typescript
// api/routes/jobs.ts
import { FastifyInstance } from 'fastify'
import { syncCities } from '../jobs/sync-cities'

export async function jobsRoutes(fastify: FastifyInstance) {
  
  // POST /api/jobs/sync-cities
  fastify.post('/jobs/sync-cities', {
    preHandler: async (request, reply) => {
      // Проверка авторизации (только Cloud Scheduler)
      const authHeader = request.headers.authorization
      const expectedToken = `Bearer ${process.env.CRON_SECRET}`
      
      if (authHeader !== expectedToken) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
    }
  }, async (request, reply) => {
    try {
      const result = await syncCities()
      return { success: true, ...result }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: 'Sync failed' })
    }
  })
}
```

### 4.6 Сопоставление города от клиента

```typescript
// services/city-matcher.ts
import { db } from '../lib/firebase-admin'

interface MatchedCity {
  name: string
  slug: string
}

/**
 * Поиск города по пользовательскому вводу
 * Поддерживает: точное совпадение, частичное, с опечатками
 */
export async function matchCity(userInput: string): Promise<MatchedCity | null> {
  const normalizedInput = normalizeString(userInput)
  
  // 1. Получить все активные города из Firestore
  const snapshot = await db
    .collection('cities')
    .where('isActive', '==', true)
    .get()
  
  const cities = snapshot.docs.map(doc => ({
    name: doc.data().name,
    slug: doc.data().slug,
    normalizedName: normalizeString(doc.data().name),
  }))
  
  // 2. Точное совпадение
  const exactMatch = cities.find(c => c.normalizedName === normalizedInput)
  if (exactMatch) {
    return { name: exactMatch.name, slug: exactMatch.slug }
  }
  
  // 3. Частичное совпадение (город содержится в вводе или наоборот)
  const partialMatch = cities.find(c => 
    c.normalizedName.includes(normalizedInput) || 
    normalizedInput.includes(c.normalizedName)
  )
  if (partialMatch) {
    return { name: partialMatch.name, slug: partialMatch.slug }
  }
  
  // 4. Fuzzy match (расстояние Левенштейна)
  const fuzzyMatch = findClosestMatch(normalizedInput, cities)
  if (fuzzyMatch && fuzzyMatch.distance <= 2) {
    return { name: fuzzyMatch.city.name, slug: fuzzyMatch.city.slug }
  }
  
  return null
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ёе]/g, 'е')
    .replace(/\s+/g, ' ')
}

function findClosestMatch(input: string, cities: Array<{ name: string; slug: string; normalizedName: string }>) {
  let closest = { city: cities[0], distance: Infinity }
  
  for (const city of cities) {
    const distance = levenshteinDistance(input, city.normalizedName)
    if (distance < closest.distance) {
      closest = { city, distance }
    }
  }
  
  return closest.distance < Infinity ? closest : null
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      )
    }
  }
  
  return matrix[b.length][a.length]
}
```

### 4.7 Логика Claude AI (System Prompt)

```typescript
// config/prompts.ts

export const CONSULTATION_MODE_PROMPT = `
Ты AI-ассистент магазина Цветов.ру. 

## ТЕКУЩИЙ РЕЖИМ: КОНСУЛЬТАЦИЯ

Твоя задача — помочь клиенту подобрать идеальный букет, собрав информацию:

### ПАРАМЕТРЫ ДЛЯ СБОРА:
1. **КОМУ** — для кого букет (жене, маме, сестре, коллеге и т.д.)
2. **ПОВОД** — по какому случаю (день рождения, свадьба, 8 марта и т.д.)
3. **ГОРОД** — куда доставить

### ТЕКУЩИЙ СТАТУС ПАРАМЕТРОВ:
{{PARAMS_STATUS}}

### ПРАВИЛА:
- Задавай по ОДНОМУ вопросу за раз
- Будь дружелюбным, используй эмодзи умеренно (🌸💐✅)
- Короткие сообщения (2-3 предложения)
- Обращайся на "ты"
- НЕ предлагай конкретные букеты пока не собраны все 3 параметра
- Когда параметр получен, подтверди его и переходи к следующему

### ПОРЯДОК ВОПРОСОВ:
1. Сначала спроси КОМУ (если не указано)
2. Затем спроси ПОВОД (если не указан)
3. В конце спроси ГОРОД доставки (если не указан)

### ПРИМЕРЫ ДИАЛОГА:

Клиент: Привет!
Ассистент: Привет! 🌸 Рада помочь с выбором букета! Подскажи, для кого подбираем цветы?

Клиент: Для мамы
Ассистент: Отлично, букет для мамы! 💐 А какой повод? День рождения, просто порадовать или что-то другое?

Клиент: День рождения у неё
Ассистент: Замечательный повод! 🎂 В какой город нужна доставка?

Клиент: Москва
Ассистент: Отлично! Москва, день рождения мамы — сейчас подберу лучшие варианты! ✨
[ПЕРЕХОД В РЕЖИМ ПОИСКА]
`

export const SEARCH_MODE_PROMPT = `
Ты AI-ассистент магазина Цветов.ру.

## ТЕКУЩИЙ РЕЖИМ: ПОИСК ТОВАРОВ

### СОБРАННЫЕ ПАРАМЕТРЫ:
- Кому: {{RECIPIENT}}
- Повод: {{OCCASION}}  
- Город: {{CITY_NAME}} ({{CITY_SLUG}})

### ЗАДАЧИ:
1. Используй инструмент search_products для поиска букетов
2. Показывай 2-4 подходящих варианта
3. Помогай с выбором, отвечай на вопросы о букетах
4. Помогай оформить заказ

### ПРАВИЛА:
- Используй ТОЛЬКО реальные товары из search_products
- Указывай точную цену и наличие
- Если клиент хочет изменить параметры (город, повод) — обнови и сделай новый поиск
- Будь готов помочь с оформлением заказа

### ДОСТУПНЫЕ ИНСТРУМЕНТЫ:
- search_products — поиск букетов по параметрам
- get_product_details — детали конкретного букета
`

export function buildSystemPrompt(session: ChatSession): string {
  if (session.mode === 'consultation') {
    const paramsStatus = `
- Кому: ${session.params.recipient || '❓ не указано'}
- Повод: ${session.params.occasion || '❓ не указан'}
- Город: ${session.params.city?.name || '❓ не указан'}
    `.trim()
    
    return CONSULTATION_MODE_PROMPT.replace('{{PARAMS_STATUS}}', paramsStatus)
  }
  
  // Search mode
  return SEARCH_MODE_PROMPT
    .replace('{{RECIPIENT}}', session.params.recipient || 'не указано')
    .replace('{{OCCASION}}', session.params.occasion || 'не указан')
    .replace('{{CITY_NAME}}', session.params.city?.name || '')
    .replace('{{CITY_SLUG}}', session.params.city?.slug || '')
}
```

### 4.8 Определение параметров из сообщения

```typescript
// services/param-extractor.ts
import { RECIPIENTS, OCCASIONS } from '../config'
import { matchCity } from './city-matcher'

interface ExtractedParams {
  recipient?: string
  occasion?: string
  city?: { name: string; slug: string }
}

/**
 * Извлекает параметры из сообщения пользователя
 */
export async function extractParams(message: string): Promise<ExtractedParams> {
  const normalizedMessage = message.toLowerCase()
  const result: ExtractedParams = {}
  
  // 1. Поиск "кому"
  for (const recipient of RECIPIENTS) {
    if (recipient.keywords.some(kw => normalizedMessage.includes(kw))) {
      result.recipient = recipient.value
      break
    }
  }
  
  // 2. Поиск "повод"
  for (const occasion of OCCASIONS) {
    if (occasion.keywords.some(kw => normalizedMessage.includes(kw))) {
      result.occasion = occasion.value
      break
    }
  }
  
  // 3. Поиск города (асинхронно через базу)
  // Простая эвристика: ищем слова с большой буквы, которые могут быть городами
  const potentialCities = message.match(/[А-ЯЁ][а-яё]+(?:-[А-Яа-яЁё]+)?/g) || []
  
  for (const potentialCity of potentialCities) {
    const matchedCity = await matchCity(potentialCity)
    if (matchedCity) {
      result.city = matchedCity
      break
    }
  }
  
  // Также проверяем весь текст на случай "доставка в москву"
  if (!result.city) {
    const matchedCity = await matchCity(message)
    if (matchedCity) {
      result.city = matchedCity
    }
  }
  
  return result
}
```

### 4.9 Обновление сессии и смена режима

```typescript
// services/session-manager.ts
import { ChatSession } from '../types/session'
import { extractParams } from './param-extractor'

export async function processMessageAndUpdateSession(
  session: ChatSession,
  userMessage: string
): Promise<{
  updatedSession: ChatSession
  shouldSwitchToSearch: boolean
}> {
  // Извлекаем параметры из сообщения
  const extractedParams = await extractParams(userMessage)
  
  // Обновляем сессию новыми параметрами (не перезаписываем существующие)
  const updatedParams = {
    recipient: extractedParams.recipient || session.params.recipient,
    occasion: extractedParams.occasion || session.params.occasion,
    city: extractedParams.city || session.params.city,
  }
  
  // Проверяем, все ли параметры заполнены
  const allParamsFilled = !!(
    updatedParams.recipient && 
    updatedParams.occasion && 
    updatedParams.city
  )
  
  // Определяем новый режим
  const newMode = allParamsFilled ? 'search' : 'consultation'
  const shouldSwitchToSearch = session.mode === 'consultation' && newMode === 'search'
  
  return {
    updatedSession: {
      ...session,
      mode: newMode,
      params: updatedParams,
      updatedAt: new Date(),
    },
    shouldSwitchToSearch,
  }
}
```

### 4.10 Пример полного флоу

```
┌─────────────────────────────────────────────────────────────────┐
│ НАЧАЛО СЕССИИ                                                    │
│ mode: 'consultation'                                             │
│ params: { recipient: null, occasion: null, city: null }         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Пользователь: "Привет, хочу заказать цветы маме"                │
│                                                                  │
│ → extractParams() находит: recipient = 'mother'                 │
│ → params: { recipient: 'mother', occasion: null, city: null }   │
│ → mode: 'consultation' (не все параметры)                       │
│                                                                  │
│ AI: "Отлично, букет для мамы! 💐 Какой повод?"                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Пользователь: "У неё день рождения"                             │
│                                                                  │
│ → extractParams() находит: occasion = 'birthday'                │
│ → params: { recipient: 'mother', occasion: 'birthday', city: null }
│ → mode: 'consultation' (город не указан)                        │
│                                                                  │
│ AI: "День рождения — прекрасный повод! 🎂 В какой город доставка?"
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Пользователь: "Санкт-Петербург"                                 │
│                                                                  │
│ → extractParams() находит город в базе:                         │
│   city = { name: 'Санкт-Петербург', slug: 'saint-petersburg' }  │
│ → params: { recipient: 'mother', occasion: 'birthday',          │
│             city: { name: 'Санкт-Петербург', slug: '...' } }    │
│                                                                  │
│ ✅ ВСЕ ПАРАМЕТРЫ ЗАПОЛНЕНЫ                                       │
│ → mode: 'search'                                                 │
│ → shouldSwitchToSearch = true                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ РЕЖИМ ПОИСКА                                                     │
│                                                                  │
│ AI использует tool: search_products({                           │
│   city_slug: 'saint-petersburg',                                │
│   occasion: 'birthday',                                         │
│   recipient: 'mother'                                           │
│ })                                                               │
│                                                                  │
│ AI: "Вот что я подобрал для мамы на день рождения в Питере! 🌸"│
│ [Карточки товаров]                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. АВТОРИЗАЦИЯ И ПЕРСОНАЛИЗАЦИЯ

### 5.1 Обзор системы персонализации

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISION: ПЕРСОНАЛЬНЫЙ АССИСТЕНТ                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Сейчас (MVP):                                                  │
│  • Авторизация через API cvetov.com                             │
│  • История чатов                                                 │
│  • Сбор данных о получателях, поводах, датах, адресах           │
│                                                                  │
│  Через 1 год:                                                   │
│  • AI знает всех получателей клиента                            │
│  • Напоминания о важных датах                                   │
│  • Рекомендации на основе истории                               │
│                                                                  │
│  Через 3 года:                                                  │
│  • Полностью персональный помощник                              │
│  • Предугадывание потребностей                                  │
│  • "Скоро день рождения мамы, вот что я подобрал..."           │
│  • Интеграция с календарём клиента                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Авторизация (интеграция с cvetov.com)

#### Архитектура авторизации

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   ai.cvetov.com │      │ ai.cvetov24.ru  │      │ site.cvetov24.ru│
│   (Frontend)    │ ───► │     (API)       │ ───► │  (Auth API)     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │  1. Login form         │  2. Proxy auth         │  3. Validate
        │     (phone/email)      │     request            │     credentials
        │                        │                        │
        ▼                        ▼                        ▼
   Получаем token          Проверяем token          Возвращаем user
   Сохраняем в             Создаём/обновляем        data + token
   localStorage            профиль в Firestore
```

#### Эндпоинты авторизации (proxy к существующему API)

```typescript
// api/routes/auth.ts

// POST /api/auth/login
// Proxy к site.cvetov24.ru/api/auth/login
interface LoginRequest {
  phone?: string
  email?: string
  password: string
}

interface LoginResponse {
  success: boolean
  token: string
  user: {
    id: string
    phone: string
    email: string
    name: string
  }
}

// POST /api/auth/verify
// Проверка токена
interface VerifyRequest {
  token: string
}

interface VerifyResponse {
  valid: boolean
  user?: {
    id: string
    phone: string
    email: string
    name: string
  }
}

// POST /api/auth/logout
// Инвалидация токена
```

#### Хранение токена на клиенте

```typescript
// lib/auth.ts
const AUTH_TOKEN_KEY = 'cvetov_ai_token'
const AUTH_USER_KEY = 'cvetov_ai_user'

export function setAuthToken(token: string, user: User) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getAuthUser(): User | null {
  const data = localStorage.getItem(AUTH_USER_KEY)
  return data ? JSON.parse(data) : null
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
```

#### Auth Context (React)

```typescript
// contexts/auth-context.tsx
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Проверяем токен при загрузке
    const token = getAuthToken()
    if (token) {
      verifyToken(token)
        .then(setUser)
        .catch(() => clearAuth())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    const data = await response.json()
    if (data.success) {
      setAuthToken(data.token, data.user)
      setUser(data.user)
    } else {
      throw new Error(data.error)
    }
  }

  const logout = () => {
    clearAuth()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 5.3 Структура данных пользователя (Firestore)

```
Firestore Collections:

users/{userId}
├── cvetovUserId: string          // ID из API cvetov.com
├── phone: string
├── email: string
├── name: string
├── createdAt: timestamp
├── lastActiveAt: timestamp
│
├── // Агрегированные данные для персонализации
├── stats: {
│     totalOrders: number
│     totalSpent: number
│     favoriteCity: string
│     lastOrderDate: timestamp
│   }
│
└── settings: {
      notifications: boolean
      reminderDays: number        // За сколько дней напоминать
    }


users/{userId}/recipients/{recipientId}
├── type: string                  // 'mother', 'wife', 'friend_female'...
├── label: string                 // "Маме", "Жене Анне"
├── customName: string | null     // Имя получателя (если указано)
├── occasions: [                  // Поводы для этого получателя
│     {
│       type: string              // 'birthday', 'march_8'...
│       date: string | null       // "03-15" (день-месяц) для ежегодных
│       lastUsed: timestamp
│     }
│   ]
├── addresses: [                  // Адреса доставки
│     {
│       city: { name, slug }
│       address: string | null    // Полный адрес (если известен)
│       lastUsed: timestamp
│     }
│   ]
├── orderCount: number
├── lastOrderDate: timestamp
├── createdAt: timestamp
└── updatedAt: timestamp


users/{userId}/chats/{chatId}
├── title: string                 // Автогенерируемый заголовок
├── mode: 'consultation' | 'search'
├── params: {
│     recipient: string | null
│     occasion: string | null
│     city: { name, slug } | null
│   }
├── messageCount: number
├── hasOrder: boolean             // Был ли заказ в этом чате
├── createdAt: timestamp
└── updatedAt: timestamp


users/{userId}/chats/{chatId}/messages/{messageId}
├── role: 'user' | 'assistant'
├── content: string
├── products: Product[] | null    // Показанные товары
├── toolCalls: ToolCall[] | null  // Вызовы инструментов
├── createdAt: timestamp


users/{userId}/deliveries/{deliveryId}
├── recipientId: string           // Ссылка на получателя
├── recipientType: string
├── recipientName: string | null
├── occasion: string
├── date: timestamp               // Дата доставки
├── city: { name, slug }
├── address: string | null
├── orderId: string | null        // ID заказа в cvetov.com
├── chatId: string                // Из какого чата
├── createdAt: timestamp

// Индексы для быстрого поиска дат
// Используется для рассылок: "Скоро день рождения мамы!"
```

### 5.4 Типы данных

```typescript
// types/user.ts

interface User {
  id: string                      // Firestore document ID
  cvetovUserId: string            // ID в системе cvetov.com
  phone: string
  email: string
  name: string
  createdAt: Date
  lastActiveAt: Date
  stats: UserStats
  settings: UserSettings
}

interface UserStats {
  totalOrders: number
  totalSpent: number
  favoriteCity: string | null
  lastOrderDate: Date | null
}

interface UserSettings {
  notifications: boolean
  reminderDays: number
}

// types/recipient.ts

interface Recipient {
  id: string
  userId: string
  type: RecipientValue            // 'mother', 'wife', etc.
  label: string                   // "Маме"
  customName: string | null       // "Анна Петровна"
  occasions: RecipientOccasion[]
  addresses: RecipientAddress[]
  orderCount: number
  lastOrderDate: Date | null
  createdAt: Date
  updatedAt: Date
}

interface RecipientOccasion {
  type: OccasionValue             // 'birthday', 'march_8', etc.
  date: string | null             // "03-15" для ежегодных событий
  lastUsed: Date
}

interface RecipientAddress {
  city: { name: string; slug: string }
  address: string | null
  lastUsed: Date
}

// types/chat.ts

interface Chat {
  id: string
  userId: string
  title: string
  mode: 'consultation' | 'search'
  params: ChatParams
  messageCount: number
  hasOrder: boolean
  createdAt: Date
  updatedAt: Date
}

interface ChatMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string
  products: Product[] | null
  toolCalls: ToolCall[] | null
  createdAt: Date
}

// types/delivery.ts

interface Delivery {
  id: string
  userId: string
  recipientId: string
  recipientType: string
  recipientName: string | null
  occasion: string
  date: Date
  city: { name: string; slug: string }
  address: string | null
  orderId: string | null
  chatId: string
  createdAt: Date
}
```

### 5.5 Сервисы для работы с данными

```typescript
// services/user-service.ts

export class UserService {
  
  /**
   * Создать или обновить профиль пользователя при логине
   */
  async upsertUser(cvetovUser: CvetovUser): Promise<User> {
    const usersRef = db.collection('users')
    
    // Ищем по cvetovUserId
    const snapshot = await usersRef
      .where('cvetovUserId', '==', cvetovUser.id)
      .limit(1)
      .get()
    
    if (snapshot.empty) {
      // Создаём нового пользователя
      const newUser = {
        cvetovUserId: cvetovUser.id,
        phone: cvetovUser.phone,
        email: cvetovUser.email,
        name: cvetovUser.name,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          favoriteCity: null,
          lastOrderDate: null,
        },
        settings: {
          notifications: true,
          reminderDays: 3,
        },
      }
      const docRef = await usersRef.add(newUser)
      return { id: docRef.id, ...newUser }
    }
    
    // Обновляем существующего
    const doc = snapshot.docs[0]
    await doc.ref.update({ lastActiveAt: new Date() })
    return { id: doc.id, ...doc.data() } as User
  }
  
  /**
   * Получить профиль пользователя
   */
  async getUser(userId: string): Promise<User | null> {
    const doc = await db.collection('users').doc(userId).get()
    return doc.exists ? { id: doc.id, ...doc.data() } as User : null
  }
}
```

```typescript
// services/recipient-service.ts

export class RecipientService {
  
  /**
   * Добавить или обновить получателя
   */
  async upsertRecipient(
    userId: string,
    data: {
      type: string
      customName?: string
      occasion?: { type: string; date?: string }
      city?: { name: string; slug: string }
    }
  ): Promise<Recipient> {
    const recipientsRef = db.collection(`users/${userId}/recipients`)
    
    // Ищем существующего получателя этого типа
    const snapshot = await recipientsRef
      .where('type', '==', data.type)
      .limit(1)
      .get()
    
    if (snapshot.empty) {
      // Создаём нового получателя
      const label = RECIPIENTS.find(r => r.value === data.type)?.label || data.type
      const newRecipient = {
        type: data.type,
        label,
        customName: data.customName || null,
        occasions: data.occasion ? [{
          type: data.occasion.type,
          date: data.occasion.date || null,
          lastUsed: new Date(),
        }] : [],
        addresses: data.city ? [{
          city: data.city,
          address: null,
          lastUsed: new Date(),
        }] : [],
        orderCount: 0,
        lastOrderDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const docRef = await recipientsRef.add(newRecipient)
      return { id: docRef.id, userId, ...newRecipient }
    }
    
    // Обновляем существующего
    const doc = snapshot.docs[0]
    const existingData = doc.data() as Recipient
    
    const updates: Partial<Recipient> = { updatedAt: new Date() }
    
    // Добавляем повод если новый
    if (data.occasion) {
      const existingOccasion = existingData.occasions.find(
        o => o.type === data.occasion!.type
      )
      if (!existingOccasion) {
        updates.occasions = [...existingData.occasions, {
          type: data.occasion.type,
          date: data.occasion.date || null,
          lastUsed: new Date(),
        }]
      } else {
        // Обновляем lastUsed
        updates.occasions = existingData.occasions.map(o =>
          o.type === data.occasion!.type
            ? { ...o, lastUsed: new Date() }
            : o
        )
      }
    }
    
    // Добавляем город если новый
    if (data.city) {
      const existingAddress = existingData.addresses.find(
        a => a.city.slug === data.city!.slug
      )
      if (!existingAddress) {
        updates.addresses = [...existingData.addresses, {
          city: data.city,
          address: null,
          lastUsed: new Date(),
        }]
      } else {
        updates.addresses = existingData.addresses.map(a =>
          a.city.slug === data.city!.slug
            ? { ...a, lastUsed: new Date() }
            : a
        )
      }
    }
    
    await doc.ref.update(updates)
    return { id: doc.id, userId, ...existingData, ...updates }
  }
  
  /**
   * Получить всех получателей пользователя
   */
  async getRecipients(userId: string): Promise<Recipient[]> {
    const snapshot = await db
      .collection(`users/${userId}/recipients`)
      .orderBy('lastOrderDate', 'desc')
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...doc.data(),
    })) as Recipient[]
  }
}
```

```typescript
// services/chat-service.ts

export class ChatService {
  
  /**
   * Создать новый чат
   */
  async createChat(userId: string): Promise<Chat> {
    const chat = {
      title: 'Новый чат',
      mode: 'consultation' as const,
      params: {
        recipient: null,
        occasion: null,
        city: null,
      },
      messageCount: 0,
      hasOrder: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const docRef = await db
      .collection(`users/${userId}/chats`)
      .add(chat)
    
    return { id: docRef.id, userId, ...chat }
  }
  
  /**
   * Получить список чатов пользователя
   */
  async getChats(userId: string, limit = 20): Promise<Chat[]> {
    const snapshot = await db
      .collection(`users/${userId}/chats`)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId,
      ...doc.data(),
    })) as Chat[]
  }
  
  /**
   * Получить сообщения чата
   */
  async getMessages(userId: string, chatId: string): Promise<ChatMessage[]> {
    const snapshot = await db
      .collection(`users/${userId}/chats/${chatId}/messages`)
      .orderBy('createdAt', 'asc')
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      chatId,
      ...doc.data(),
    })) as ChatMessage[]
  }
  
  /**
   * Добавить сообщение в чат
   */
  async addMessage(
    userId: string,
    chatId: string,
    message: Omit<ChatMessage, 'id' | 'chatId' | 'createdAt'>
  ): Promise<ChatMessage> {
    const messageData = {
      ...message,
      createdAt: new Date(),
    }
    
    const docRef = await db
      .collection(`users/${userId}/chats/${chatId}/messages`)
      .add(messageData)
    
    // Обновляем чат
    await db.doc(`users/${userId}/chats/${chatId}`).update({
      messageCount: FieldValue.increment(1),
      updatedAt: new Date(),
    })
    
    return { id: docRef.id, chatId, ...messageData }
  }
  
  /**
   * Обновить заголовок чата (автогенерация)
   */
  async updateChatTitle(userId: string, chatId: string, params: ChatParams) {
    let title = 'Новый чат'
    
    if (params.recipient && params.occasion) {
      const recipientLabel = RECIPIENTS.find(r => r.value === params.recipient)?.label
      const occasionLabel = OCCASIONS.find(o => o.value === params.occasion)?.label
      title = `${recipientLabel} — ${occasionLabel}`
    } else if (params.recipient) {
      title = RECIPIENTS.find(r => r.value === params.recipient)?.label || title
    }
    
    await db.doc(`users/${userId}/chats/${chatId}`).update({ title })
  }
}
```

```typescript
// services/delivery-service.ts

export class DeliveryService {
  
  /**
   * Записать информацию о доставке
   */
  async recordDelivery(
    userId: string,
    data: {
      recipientId: string
      recipientType: string
      recipientName?: string
      occasion: string
      date: Date
      city: { name: string; slug: string }
      address?: string
      orderId?: string
      chatId: string
    }
  ): Promise<Delivery> {
    const delivery = {
      ...data,
      recipientName: data.recipientName || null,
      address: data.address || null,
      orderId: data.orderId || null,
      createdAt: new Date(),
    }
    
    const docRef = await db
      .collection(`users/${userId}/deliveries`)
      .add(delivery)
    
    return { id: docRef.id, userId, ...delivery }
  }
  
  /**
   * Получить предстоящие важные даты
   * Используется для рассылок и напоминаний
   */
  async getUpcomingDates(
    userId: string,
    daysAhead: number = 30
  ): Promise<Array<{
    recipientType: string
    recipientName: string | null
    occasion: string
    date: Date
    city: { name: string; slug: string }
  }>> {
    // Получаем всех получателей с ежегодными датами
    const recipients = await db
      .collection(`users/${userId}/recipients`)
      .get()
    
    const upcoming: Array<any> = []
    const today = new Date()
    const targetDate = new Date()
    targetDate.setDate(today.getDate() + daysAhead)
    
    for (const doc of recipients.docs) {
      const recipient = doc.data() as Recipient
      
      for (const occasion of recipient.occasions) {
        if (occasion.date) {
          // Парсим дату "MM-DD"
          const [month, day] = occasion.date.split('-').map(Number)
          const thisYearDate = new Date(today.getFullYear(), month - 1, day)
          
          // Если дата уже прошла в этом году, берём следующий год
          if (thisYearDate < today) {
            thisYearDate.setFullYear(today.getFullYear() + 1)
          }
          
          if (thisYearDate <= targetDate) {
            upcoming.push({
              recipientType: recipient.type,
              recipientName: recipient.customName,
              occasion: occasion.type,
              date: thisYearDate,
              city: recipient.addresses[0]?.city || null,
            })
          }
        }
      }
    }
    
    return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}
```

### 5.6 Использование данных в System Prompt

```typescript
// config/prompts.ts

export async function buildPersonalizedPrompt(
  session: ChatSession,
  userId: string | null
): Promise<string> {
  let basePrompt = buildSystemPrompt(session)
  
  if (!userId) {
    return basePrompt
  }
  
  // Получаем данные о пользователе
  const recipientService = new RecipientService()
  const recipients = await recipientService.getRecipients(userId)
  
  if (recipients.length === 0) {
    return basePrompt
  }
  
  // Формируем контекст персонализации
  const personalizationContext = `

### ДАННЫЕ О КЛИЕНТЕ (используй для персонализации):

#### Получатели, которым клиент заказывал раньше:
${recipients.map(r => {
  const occasions = r.occasions.map(o => 
    OCCASIONS.find(oc => oc.value === o.type)?.label
  ).filter(Boolean).join(', ')
  
  const cities = r.addresses.map(a => a.city.name).join(', ')
  
  return `- ${r.label}${r.customName ? ` (${r.customName})` : ''}: ${occasions || 'повод неизвестен'}, города: ${cities || 'неизвестно'}`
}).join('\n')}

#### Рекомендации:
- Если клиент не указал получателя, можешь предложить: "${recipients.slice(0, 3).map(r => r.label).join(', ')}"
- Если клиент выбрал получателя, предложи город из его истории
- Упоминай прошлые заказы, если уместно: "В прошлый раз для мамы выбрали розы, попробуем что-то новое?"
`

  return basePrompt + personalizationContext
}
```

### 5.7 UI: Меню чатов

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (на desktop) / DRAWER (на mobile)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [+] Новый чат                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Сегодня                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💐 Маме — День рождения                    ●          │   │
│  │     Санкт-Петербург · 2 мин назад                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Вчера                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💐 Жене — Просто так                                   │   │
│  │     Москва · Заказ оформлен ✓                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Ноябрь                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💐 Коллеге — День рождения                             │   │
│  │     Казань                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  👤 Иван Петров                                                 │
│  +7 (999) 123-45-67                                             │
│  [Выйти]                                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.8 Flow для неавторизованных пользователей

```
┌─────────────────────────────────────────────────────────────────┐
│  НЕАВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  • Может пользоваться чатом без ограничений                     │
│  • История НЕ сохраняется между сессиями                        │
│  • Данные о получателях НЕ накапливаются                        │
│                                                                  │
│  При попытке оформить заказ:                                    │
│  → Предложение авторизоваться                                   │
│  → "Войдите, чтобы оформить заказ и сохранить историю"         │
│                                                                  │
│  После авторизации:                                             │
│  → Текущий чат сохраняется в профиль                           │
│  → Данные из чата (получатель, повод, город) записываются      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.9 Миграция данных из гостевой сессии

```typescript
// services/session-migration.ts

export async function migrateGuestSession(
  guestSession: ChatSession,
  userId: string
): Promise<Chat> {
  const chatService = new ChatService()
  const recipientService = new RecipientService()
  
  // 1. Создаём чат в профиле пользователя
  const chat = await chatService.createChat(userId)
  
  // 2. Копируем сообщения
  for (const message of guestSession.messages) {
    await chatService.addMessage(userId, chat.id, {
      role: message.role,
      content: message.content,
      products: message.products || null,
      toolCalls: message.toolCalls || null,
    })
  }
  
  // 3. Сохраняем параметры
  if (guestSession.params.recipient) {
    await recipientService.upsertRecipient(userId, {
      type: guestSession.params.recipient,
      occasion: guestSession.params.occasion 
        ? { type: guestSession.params.occasion }
        : undefined,
      city: guestSession.params.city || undefined,
    })
  }
  
  // 4. Обновляем заголовок чата
  await chatService.updateChatTitle(userId, chat.id, guestSession.params)
  
  return chat
}
```

---

## 6. FRONTEND (ai.cvetov.com)

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

**КОНЕЦ ТЕХНИЧЕСКОГО ЗАДАНИЯ v2.4**

**Версия:** 2.4  
**Дата:** 28 ноября 2025  
**Архитектура:** Firebase Hosting + Cloud Run + Firestore  
**Домены:** ai.cvetov.com + ai.cvetov24.ru/api  
**Firebase Project:** cvetov-ai (НОВЫЙ, изолированный)

**Ключевые моменты v2.4:**
- ✅ Два режима чата: консультация → поиск товаров
- ✅ Авторизация через API cvetov.com
- ✅ История чатов для авторизованных
- ✅ Хранение данных: получатели, поводы, даты, города
- ✅ Персонализация AI на основе истории
- ✅ Firestore: users, recipients, chats, deliveries
- ✅ Cloud Scheduler для синхронизации городов

**Vision (1-3 года):**
- Персональный помощник, знающий всё о клиенте
- Напоминания о важных датах
- "Скоро день рождения мамы, вот что я подобрал..."

---

**Для вопросов:** Продолжить диалог в Claude Code
