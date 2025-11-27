# Cvetov.ru Backend API Documentation

Документация для интеграции AI Shopping Assistant с существующими микросервисами Cvetov.ru.

**Base URL (Demo)**: `https://site.demo.cvetov24.ru/api`

**Архитектура**: Микросервисы с KrakenD API Gateway

## Аутентификация

Все защищенные эндпоинты требуют JWT токен в заголовке:

```
Authorization: Bearer <access_token>
```

### JWT Token Structure

```typescript
interface JWTPayload {
  user_uuid: string
  role: 'user' | 'anonym' | 'promo'
  exp: number
  iat: number
}
```

### Получение токена

Токен передается из frontend приложения Cvetov.ru. AI Shopping Assistant НЕ создает собственную аутентификацию, а использует токен текущего пользователя.

**Важно**: Анонимные пользователи могут иметь роль `anonym` - для них доступен поиск, но создание заказа требует регистрации.

---

## 1. Поиск товаров

### `GET /api/v1/search`

Полнотекстовый поиск по каталогу с фильтрацией по локации.

**Требования**: JWT токен (любая роль)

#### Query Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `text` | string | Да | Поисковый запрос (минимум 3 символа) |
| `shop_uuid` | uuid | Нет* | UUID магазина для фильтрации |
| `latitude` | float | Нет* | Широта для геопоиска |
| `longitude` | float | Нет* | Долгота для геопоиска |
| `slug_city` | string | Нет* | Slug города (например, "moscow") |
| `page` | integer | Нет | Номер страницы (default: 1) |
| `page_size` | integer | Нет | Размер страницы (default: 20, max: 100) |

**\* Локация**: Один из параметров локации обязателен: `shop_uuid` ИЛИ `latitude+longitude` ИЛИ `slug_city`

#### Request Example

```bash
GET /api/v1/search?text=розы&slug_city=moscow&page=1&page_size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Schema

```typescript
interface SearchResponse {
  page: number
  page_size: number
  total_count: number
  catalog_items: ShortCatalogItemEntity[]
}

interface ShortCatalogItemEntity {
  uuid: string
  name: string
  slug: string
  price: number
  old_price: number | null
  discount_percent: number | null
  preview_image: ImageEntity | null
  is_available: boolean
  shop: {
    uuid: string
    name: string
    slug: string
    city: {
      uuid: string
      name: string
      slug: string
    }
  }
  categories: CategoryEntity[]
  rating: number | null
  reviews_count: number
  is_new: boolean
  is_hit: boolean
}

interface ImageEntity {
  uuid: string
  url: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
  alt: string | null
}

interface CategoryEntity {
  uuid: string
  name: string
  slug: string
  parent_uuid: string | null
}
```

#### Response Example

```json
{
  "page": 1,
  "page_size": 20,
  "total_count": 156,
  "catalog_items": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Букет из красных роз 'Вдохновение'",
      "slug": "buket-iz-krasnyh-roz-vdohnovenie",
      "price": 2500,
      "old_price": 3000,
      "discount_percent": 17,
      "preview_image": {
        "uuid": "650e8400-e29b-41d4-a716-446655440001",
        "url": "https://storage.yandexcloud.net/cvetov/catalog/image.jpg",
        "thumbnail_url": "https://storage.yandexcloud.net/cvetov/catalog/image_thumb.jpg",
        "width": 800,
        "height": 1200,
        "alt": "Букет из красных роз"
      },
      "is_available": true,
      "shop": {
        "uuid": "750e8400-e29b-41d4-a716-446655440002",
        "name": "Цветочный Дом на Арбате",
        "slug": "cvetochnyy-dom-na-arbate",
        "city": {
          "uuid": "850e8400-e29b-41d4-a716-446655440003",
          "name": "Москва",
          "slug": "moscow"
        }
      },
      "categories": [
        {
          "uuid": "950e8400-e29b-41d4-a716-446655440004",
          "name": "Букеты",
          "slug": "bukety",
          "parent_uuid": null
        },
        {
          "uuid": "a50e8400-e29b-41d4-a716-446655440005",
          "name": "Розы",
          "slug": "rozy",
          "parent_uuid": "950e8400-e29b-41d4-a716-446655440004"
        }
      ],
      "rating": 4.8,
      "reviews_count": 124,
      "is_new": false,
      "is_hit": true
    }
  ]
}
```

#### Error Codes

| Код | Описание |
|-----|----------|
| 400 | Невалидные параметры (например, text меньше 3 символов) |
| 401 | Отсутствует или невалидный JWT токен |
| 404 | Локация не найдена (несуществующий slug_city или shop_uuid) |
| 500 | Внутренняя ошибка сервера |

---

## 2. Детали товара

### `GET /api/v1/catalog/items/{slug}`

Получение полной информации о товаре по slug.

**Требования**: JWT токен (любая роль)

#### Path Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `slug` | string | URL slug товара |

#### Query Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `shop_uuid` | uuid | Нет | UUID магазина для проверки наличия |

#### Response Schema

```typescript
interface CatalogItemEntity {
  uuid: string
  name: string
  slug: string
  description: string
  composition: string | null
  price: number
  old_price: number | null
  discount_percent: number | null
  images: ImageEntity[]
  is_available: boolean
  shop: ShopEntity
  categories: CategoryEntity[]
  rating: number | null
  reviews_count: number
  reviews: ReviewEntity[]
  is_new: boolean
  is_hit: boolean
  characteristics: CharacteristicEntity[]
  related_items: ShortCatalogItemEntity[]
  created_at: string
  updated_at: string
}

interface ShopEntity {
  uuid: string
  name: string
  slug: string
  address: string
  phone: string
  email: string
  working_hours: string
  city: CityEntity
  coordinates: {
    latitude: number
    longitude: number
  }
}

interface CityEntity {
  uuid: string
  name: string
  slug: string
  region: string | null
}

interface ReviewEntity {
  uuid: string
  user_name: string
  rating: number
  text: string
  images: ImageEntity[]
  created_at: string
}

interface CharacteristicEntity {
  uuid: string
  name: string
  value: string
}
```

---

## 3. Корзина

### `GET /api/v1/cart`

Получение текущей корзины пользователя.

**Требования**: JWT токен (роль `user`)

#### Response Schema

```typescript
interface CartEntity {
  uuid: string
  user_uuid: string
  items: CartItemEntity[]
  total_price: number
  total_discount: number
  items_count: number
  created_at: string
  updated_at: string
}

interface CartItemEntity {
  uuid: string
  catalog_item: ShortCatalogItemEntity
  quantity: number
  price: number
  total_price: number
  shop_uuid: string
  created_at: string
}
```

#### Response Example

```json
{
  "uuid": "b50e8400-e29b-41d4-a716-446655440010",
  "user_uuid": "c50e8400-e29b-41d4-a716-446655440011",
  "items": [
    {
      "uuid": "d50e8400-e29b-41d4-a716-446655440012",
      "catalog_item": {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Букет из красных роз 'Вдохновение'",
        "slug": "buket-iz-krasnyh-roz-vdohnovenie",
        "price": 2500,
        "old_price": 3000,
        "discount_percent": 17,
        "preview_image": { /* ... */ },
        "is_available": true,
        "shop": { /* ... */ },
        "categories": [ /* ... */ ],
        "rating": 4.8,
        "reviews_count": 124,
        "is_new": false,
        "is_hit": true
      },
      "quantity": 2,
      "price": 2500,
      "total_price": 5000,
      "shop_uuid": "750e8400-e29b-41d4-a716-446655440002",
      "created_at": "2024-07-15T10:30:00Z"
    }
  ],
  "total_price": 5000,
  "total_discount": 1000,
  "items_count": 2,
  "created_at": "2024-07-15T10:30:00Z",
  "updated_at": "2024-07-15T10:35:00Z"
}
```

---

### `PATCH /api/v1/cart`

Обновление корзины (добавление, изменение количества, удаление товаров).

**Требования**: JWT токен (роль `user`)

#### Request Schema

```typescript
interface UpdateCartRequest {
  items: UpdateCartItemRequest[]
}

interface UpdateCartItemRequest {
  catalog_item_uuid: string
  shop_uuid: string
  quantity: number  // 0 = удалить из корзины
}
```

#### Request Example

```json
{
  "items": [
    {
      "catalog_item_uuid": "550e8400-e29b-41d4-a716-446655440000",
      "shop_uuid": "750e8400-e29b-41d4-a716-446655440002",
      "quantity": 3
    },
    {
      "catalog_item_uuid": "e50e8400-e29b-41d4-a716-446655440013",
      "shop_uuid": "750e8400-e29b-41d4-a716-446655440002",
      "quantity": 1
    }
  ]
}
```

#### Response Schema

Возвращает обновленную корзину (`CartEntity`)

#### Error Codes

| Код | Описание |
|-----|----------|
| 400 | Невалидные данные (несуществующий товар, недоступный товар) |
| 401 | Отсутствует или невалидный JWT токен |
| 403 | Недостаточно прав (анонимные пользователи не могут создавать корзину) |
| 404 | Корзина не найдена |

---

## 4. Создание заказа

### `POST /api/v1/orders`

Создание заказа из текущей корзины пользователя.

**Требования**:
- JWT токен (роль `user`)
- Корзина должна быть заполнена
- Все товары в корзине должны быть доступны

#### Query Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `platform` | string | Нет | Платформа заказа (default: "mobile") |

#### Request Body

**ВАЖНО**: Body должен быть пустым! Заказ создается автоматически из текущей корзины пользователя.

```json
{}
```

#### Response Schema

```typescript
interface OrderEntity {
  uuid: string
  order_number: string
  user: {
    uuid: string
    full_name: string
    phone: string
    email: string
  }
  items: OrderItemEntity[]
  delivery: DeliveryEntity
  payment: PaymentEntity
  status: OrderStatus
  total_price: number
  total_discount: number
  delivery_price: number
  final_price: number
  comment: string | null
  created_at: string
  updated_at: string
  estimated_delivery_time: string | null
}

interface OrderItemEntity {
  uuid: string
  catalog_item: ShortCatalogItemEntity
  quantity: number
  price: number
  total_price: number
  shop: {
    uuid: string
    name: string
    address: string
    phone: string
  }
}

interface DeliveryEntity {
  type: 'delivery' | 'pickup'
  address: string | null
  city: string
  coordinates: {
    latitude: number
    longitude: number
  } | null
  recipient_name: string
  recipient_phone: string
  delivery_date: string  // ISO 8601 date
  delivery_time_range: string | null  // например: "10:00-12:00"
  comment: string | null
}

interface PaymentEntity {
  method: PaymentMethod
  status: PaymentStatus
  paid_at: string | null
  payment_url: string | null
}

enum OrderStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

enum PaymentMethod {
  CASH = 'cash',
  CARD_ONLINE = 'card_online',
  CARD_COURIER = 'card_courier',
  SBP = 'sbp'
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}
```

#### Response Example

```json
{
  "uuid": "f50e8400-e29b-41d4-a716-446655440020",
  "order_number": "ORD-2024-07-15-00123",
  "user": {
    "uuid": "c50e8400-e29b-41d4-a716-446655440011",
    "full_name": "Иванов Иван Иванович",
    "phone": "+79991234567",
    "email": "ivan@example.com"
  },
  "items": [
    {
      "uuid": "1a0e8400-e29b-41d4-a716-446655440021",
      "catalog_item": {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Букет из красных роз 'Вдохновение'",
        "slug": "buket-iz-krasnyh-roz-vdohnovenie",
        "price": 2500,
        "old_price": 3000,
        "discount_percent": 17,
        "preview_image": { /* ... */ },
        "is_available": true,
        "shop": { /* ... */ },
        "categories": [ /* ... */ ],
        "rating": 4.8,
        "reviews_count": 124,
        "is_new": false,
        "is_hit": true
      },
      "quantity": 2,
      "price": 2500,
      "total_price": 5000,
      "shop": {
        "uuid": "750e8400-e29b-41d4-a716-446655440002",
        "name": "Цветочный Дом на Арбате",
        "address": "Москва, ул. Арбат, д. 10",
        "phone": "+74951234567"
      }
    }
  ],
  "delivery": {
    "type": "delivery",
    "address": "Москва, ул. Ленина, д. 5, кв. 10",
    "city": "Москва",
    "coordinates": {
      "latitude": 55.751244,
      "longitude": 37.618423
    },
    "recipient_name": "Петров Петр Петрович",
    "recipient_phone": "+79997654321",
    "delivery_date": "2024-07-16",
    "delivery_time_range": "14:00-16:00",
    "comment": "Позвонить за 30 минут"
  },
  "payment": {
    "method": "card_online",
    "status": "pending",
    "paid_at": null,
    "payment_url": "https://payment.cvetov24.ru/pay/f50e8400-e29b-41d4-a716-446655440020"
  },
  "status": "new",
  "total_price": 5000,
  "total_discount": 1000,
  "delivery_price": 300,
  "final_price": 4300,
  "comment": null,
  "created_at": "2024-07-15T10:45:00Z",
  "updated_at": "2024-07-15T10:45:00Z",
  "estimated_delivery_time": "2024-07-16T14:00:00Z"
}
```

#### Error Codes

| Код | Описание |
|-----|----------|
| 400 | Корзина пуста или товары недоступны |
| 401 | Отсутствует или невалидный JWT токен |
| 403 | Недостаточно прав (анонимные пользователи не могут создавать заказы) |
| 404 | Корзина не найдена |
| 409 | Конфликт (например, товар стал недоступен во время оформления) |
| 500 | Внутренняя ошибка сервера |

---

## 5. Города

### `GET /api/v1/cities`

Получение списка доступных городов с доставкой.

**Требования**: Публичный эндпоинт (JWT токен опционален)

#### Query Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `query` | string | Нет | Поиск по названию города (минимум 2 символа) |
| `page` | integer | Нет | Номер страницы (default: 1) |
| `page_size` | integer | Нет | Размер страницы (default: 50, max: 100) |

#### Response Schema

```typescript
interface CitiesResponse {
  page: number
  page_size: number
  total_count: number
  cities: CityEntity[]
}

interface CityEntity {
  uuid: string
  name: string
  slug: string
  region: string | null
  shops_count: number
  is_active: boolean
}
```

#### Response Example

```json
{
  "page": 1,
  "page_size": 50,
  "total_count": 245,
  "cities": [
    {
      "uuid": "850e8400-e29b-41d4-a716-446655440003",
      "name": "Москва",
      "slug": "moscow",
      "region": "Московская область",
      "shops_count": 87,
      "is_active": true
    },
    {
      "uuid": "2b0e8400-e29b-41d4-a716-446655440030",
      "name": "Санкт-Петербург",
      "slug": "saint-petersburg",
      "region": "Ленинградская область",
      "shops_count": 54,
      "is_active": true
    }
  ]
}
```

---

## 6. Пользователь

### `GET /api/v1/users/me`

Получение информации о текущем пользователе.

**Требования**: JWT токен (роль `user`)

#### Response Schema

```typescript
interface UserEntity {
  uuid: string
  full_name: string
  first_name: string
  last_name: string
  phone: string
  email: string
  role: 'user' | 'anonym' | 'promo'
  is_verified: boolean
  addresses: AddressEntity[]
  created_at: string
  updated_at: string
}

interface AddressEntity {
  uuid: string
  address: string
  city: string
  coordinates: {
    latitude: number
    longitude: number
  }
  is_default: boolean
  label: string | null  // например: "Дом", "Работа"
}
```

#### Response Example

```json
{
  "uuid": "c50e8400-e29b-41d4-a716-446655440011",
  "full_name": "Иванов Иван Иванович",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+79991234567",
  "email": "ivan@example.com",
  "role": "user",
  "is_verified": true,
  "addresses": [
    {
      "uuid": "3c0e8400-e29b-41d4-a716-446655440031",
      "address": "Москва, ул. Ленина, д. 5, кв. 10",
      "city": "Москва",
      "coordinates": {
        "latitude": 55.751244,
        "longitude": 37.618423
      },
      "is_default": true,
      "label": "Дом"
    }
  ],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-07-15T10:45:00Z"
}
```

---

## Flow: AI Shopping Assistant Integration

### Сценарий 1: Поиск и добавление в корзину

```typescript
// 1. Пользователь: "Хочу заказать розы в Москву"
// AI получает геолокацию ИЛИ спрашивает город

// 2. Поиск товаров
GET /api/v1/search?text=розы&slug_city=moscow&page=1&page_size=10
Authorization: Bearer <user_jwt_token>

// 3. AI показывает результаты, пользователь выбирает товар
// AI сохраняет выбор во временную корзину (локально в AI сервисе)

// 4. Когда пользователь готов оформить заказ:
// Синхронизируем временную корзину с backend
PATCH /api/v1/cart
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{
  "items": [
    {
      "catalog_item_uuid": "550e8400-e29b-41d4-a716-446655440000",
      "shop_uuid": "750e8400-e29b-41d4-a716-446655440002",
      "quantity": 2
    }
  ]
}
```

### Сценарий 2: Создание заказа

```typescript
// 1. Корзина заполнена (предыдущий шаг)

// 2. AI собирает информацию о доставке через диалог
// - Адрес доставки
// - Имя и телефон получателя
// - Дата и время доставки
// - Способ оплаты
// - Комментарий

// 3. Обновляем корзину финальными данными (если нужно)
PATCH /api/v1/cart
Authorization: Bearer <user_jwt_token>
// ...

// 4. Создаем заказ
POST /api/v1/orders?platform=ai_assistant
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{}  // Пустое body!

// 5. Получаем OrderEntity с payment_url
// Перенаправляем пользователя на оплату
```

### Сценарий 3: Анонимный пользователь

```typescript
// 1. Анонимный пользователь (JWT с role='anonym')
// Может искать товары:
GET /api/v1/search?text=тюльпаны&slug_city=moscow
Authorization: Bearer <anonym_jwt_token>
// ✅ Работает

// 2. Попытка добавить в корзину:
PATCH /api/v1/cart
Authorization: Bearer <anonym_jwt_token>
// ❌ 403 Forbidden

// AI должен предложить регистрацию/вход:
// "Чтобы оформить заказ, пожалуйста, войдите в аккаунт или зарегистрируйтесь"
```

---

## Важные замечания

### 1. Локация обязательна

Все поисковые запросы требуют указания локации одним из способов:
- `shop_uuid` - если известен конкретный магазин
- `latitude` + `longitude` - если доступна геолокация
- `slug_city` - если пользователь указал город

**Стратегия для AI**:
1. Запросить geolocation через браузер
2. Если недоступна - спросить у пользователя город через диалог
3. Использовать `GET /api/v1/cities?query=<город>` для поиска slug

### 2. Временная корзина

AI Shopping Assistant хранит временную корзину **локально** (в памяти/Redis AI сервиса), не синхронизируя с backend при каждом добавлении товара.

**Синхронизация с backend только перед созданием заказа:**
```typescript
// Перед POST /v1/orders
await syncCartWithBackend(tempCart, userJWT)
```

**Преимущества**:
- Меньше запросов к backend
- Быстрая работа AI
- Можно отменить/изменить без влияния на реальную корзину

### 3. JWT токен от frontend

AI API **НЕ создает** собственные JWT токены. Токен передается с frontend:

```typescript
// Frontend -> AI API
POST https://ai.cvetov24.ru/api/chat
Authorization: Bearer <user_jwt_from_frontend>
Content-Type: application/json

{
  "message": "Хочу заказать цветы",
  "session_id": "session-uuid"
}

// AI API -> Backend
GET https://site.demo.cvetov24.ru/api/v1/search?...
Authorization: Bearer <same_user_jwt_from_frontend>
```

### 4. Обработка ошибок

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired JWT token"
}
```
**AI действие**: Сообщить пользователю, что нужно перелогиниться

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Anonymous users cannot create orders"
}
```
**AI действие**: Предложить регистрацию/вход

#### 400 Bad Request
```json
{
  "error": "ValidationError",
  "message": "Search query must be at least 3 characters",
  "details": {
    "field": "text",
    "constraint": "minLength"
  }
}
```
**AI действие**: Переформулировать запрос

#### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Some items in cart are no longer available",
  "details": {
    "unavailable_items": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Букет роз"
      }
    ]
  }
}
```
**AI действие**: Сообщить пользователю и предложить альтернативы

---

## Rate Limits

| Эндпоинт | Лимит |
|----------|-------|
| GET /api/v1/search | 100 запросов/минуту на IP |
| POST /api/v1/orders | 10 заказов/час на пользователя |
| PATCH /api/v1/cart | 30 запросов/минуту на пользователя |

При превышении лимита:
```json
{
  "error": "RateLimitExceeded",
  "message": "Too many requests",
  "retry_after": 60
}
```

---

## Версионирование

Текущая версия API: **v1**

При breaking changes будет создана версия v2 с сохранением поддержки v1 минимум 6 месяцев.

---

## Поддержка

- **Документация**: https://docs.cvetov24.ru
- **Email**: dev@cvetov.ru
- **Slack**: #api-support
