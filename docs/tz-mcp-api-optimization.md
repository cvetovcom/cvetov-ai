# ТЗ: Оптимизация MCP API для AI-ассистента

**Дата:** 24.12.2024
**Приоритет:** Высокий
**Заказчик:** AI-ассистент Цветов.ру (ai.cvetov.com)

---

## Описание проблемы

AI-ассистент использует MCP API (`mcp.cvetov24.ru`) для поиска и отображения товаров клиентам. Текущая реализация работает медленно — **5-15 секунд на поиск**, что негативно влияет на UX.

### Причины медленной работы

1. **Отсутствие фильтра по категории** — API возвращает все товары (цветы, подарки, сладости), хотя AI-ассистенту нужны только цветы
2. **Отдельный запрос для каждого товара** — для получения состава букета (`composition`) требуется отдельный запрос на каждый товар

### Текущий flow

```
1. GET /api/v2/catalog_items?lat=...&lon=...&page=0  → 100 товаров
2. GET /api/v2/catalog_items?lat=...&lon=...&page=1  → 100 товаров
3. GET /api/v2/catalog_items?lat=...&lon=...&page=2  → 100 товаров
   ... (пока не получим все товары)

4. Фильтруем на стороне клиента: parent_category_slug === 'flowers'
   Результат: ~150 товаров из 400

5. Для каждого товара запрашиваем состав:
   GET /api/v2/catalog_items/{guid1}
   GET /api/v2/catalog_items/{guid2}
   GET /api/v2/catalog_items/{guid3}
   ... (150 параллельных запросов!)

6. Фильтруем по составу и возвращаем 16 товаров
```

**Итого:** 3-5 запросов на пагинацию + 100-200 запросов на состав = **~150 HTTP запросов**

---

## Требуемые доработки

### 1. Фильтр по категории (КРИТИЧНО)

**Endpoint:** `GET /api/v2/catalog_items`

**Новый параметр:** `parent_category_slug` (string, optional)

**Пример запроса:**
```
GET /api/v2/catalog_items?lat=55.75&lon=37.62&parent_category_slug=flowers&page=0&page_size=100
```

**Ожидаемое поведение:** Возвращать только товары с указанной категорией

**Эффект:** Уменьшение объёма данных в 2-3 раза, меньше страниц пагинации

---

### 2. Включение composition в ответ каталога (КРИТИЧНО)

**Endpoint:** `GET /api/v2/catalog_items`

**Новый параметр:** `include_composition` (boolean, optional, default: false)

**Пример запроса:**
```
GET /api/v2/catalog_items?lat=55.75&lon=37.62&include_composition=true
```

**Текущий ответ:**
```json
{
  "catalog_items": [
    {
      "guid": "abc-123",
      "name": "Букет \"Нежность\"",
      "price": { "final_price": 3500, "original_price": 4000 },
      "main_image": "https://...",
      "parent_category_slug": "flowers",
      "shop_public_uuid": "shop-456"
    }
  ]
}
```

**Требуемый ответ (с include_composition=true):**
```json
{
  "catalog_items": [
    {
      "guid": "abc-123",
      "name": "Букет \"Нежность\"",
      "price": { "final_price": 3500, "original_price": 4000 },
      "main_image": "https://...",
      "parent_category_slug": "flowers",
      "shop_public_uuid": "shop-456",
      "composition": [
        { "composition_item": { "name": "Роза красная", "quantity": 11 } },
        { "composition_item": { "name": "Эвкалипт", "quantity": 3 } },
        { "composition_item": { "name": "Гипсофила", "quantity": 2 } }
      ]
    }
  ]
}
```

**Эффект:** Устранение 100-200 дополнительных запросов, ускорение в 5-10 раз

---

### 3. Фильтр по цене (ЖЕЛАТЕЛЬНО)

**Endpoint:** `GET /api/v2/catalog_items`

**Новые параметры:**
- `min_price` (number, optional) — минимальная цена
- `max_price` (number, optional) — максимальная цена

**Пример запроса:**
```
GET /api/v2/catalog_items?lat=55.75&lon=37.62&min_price=2000&max_price=5000
```

**Эффект:** Уменьшение объёма данных, меньше фильтрации на клиенте

---

### 4. Альтернатива: Bulk-endpoint для composition (если п.2 сложно реализовать)

**Новый endpoint:** `POST /api/v2/catalog_items/bulk_compositions`

**Запрос:**
```json
POST /api/v2/catalog_items/bulk_compositions
Content-Type: application/json

{
  "guids": [
    "abc-123",
    "def-456",
    "ghi-789"
  ]
}
```

**Ответ:**
```json
{
  "compositions": {
    "abc-123": [
      { "composition_item": { "name": "Роза красная", "quantity": 11 } }
    ],
    "def-456": [
      { "composition_item": { "name": "Тюльпан жёлтый", "quantity": 15 } }
    ],
    "ghi-789": null
  }
}
```

**Эффект:** 1 запрос вместо 100-200

---

## Сводная таблица

| № | Доработка | Приоритет | Сложность | Эффект |
|---|-----------|-----------|-----------|--------|
| 1 | `parent_category_slug` фильтр | Критический | Низкая | -60% трафика |
| 2 | `include_composition=true` | Критический | Средняя | -90% запросов |
| 3 | `min_price` / `max_price` | Желательно | Низкая | -30% трафика |
| 4 | Bulk compositions endpoint | Альтернатива | Средняя | -90% запросов |

---

## Метрики

### Текущие показатели
- Среднее количество товаров в городе: 300-500
- Из них категория "flowers": 100-200
- Количество запросов на поиск: ~150
- Время поиска: 5-15 секунд

### Целевые показатели после оптимизации
- Количество запросов на поиск: 1-3
- Время поиска: < 2 секунд

---

## Обратная совместимость

Все новые параметры опциональны. Текущее поведение API без новых параметров должно сохраниться для обратной совместимости.

---

## Контакты

По вопросам реализации обращаться к команде AI-ассистента.
