# AI Shopping Assistant - Цветов.ру

Модульная архитектура AI-ассистента для подбора цветов и подарков с голосовыми возможностями, чатом и интеграцией с MCP API.

## 🎯 Основные возможности

- ✅ **Двухрежимная система**: Consultation (сбор параметров) → Search (подбор товаров)
- ✅ **Модульная архитектура**: Разделение на переиспользуемые компоненты
- ✅ **Zustand state management**: Централизованное управление состоянием
- ✅ **Голосовой ввод/вывод**: Web Speech API интеграция
- ✅ **Корзина и оформление заказа**: Полный e-commerce flow
- ✅ **MCP API ready**: Готово к подключению реального backend
- ✅ **Responsive design**: Работает на desktop и mobile
- ✅ **TypeScript**: Полная типизация

## 📁 Структура проекта

```
/
├── components/chat/              # Модульные компоненты чата
│   ├── chat-interface.tsx        # 🔴 Главный компонент
│   ├── message-bubble.tsx        # Пузырь сообщения
│   ├── chat-input.tsx            # Поле ввода
│   ├── params-progress.tsx       # Индикатор параметров
│   ├── quick-replies.tsx         # Быстрые ответы
│   ├── product-card.tsx          # Карточка товара
│   ├── product-grid.tsx          # Сетка товаров
│   ├── shopping-cart.tsx         # Корзина
│   ├── checkout-modal.tsx        # Модальное окно заказа
│   ├── typing-indicator.tsx      # Индикатор "печатает..."
│   └── index.ts                  # Экспорты
│
├── lib/
│   ├── store/
│   │   └── chat-store.ts         # 🔴 Zustand store
│   ├── api/
│   │   └── mcp-integration.md    # Инструкции MCP API
│   ├── hooks/
│   │   ├── use-speech-recognition.ts  # Голосовой ввод
│   │   ├── use-speech-synthesis.ts    # Голосовой вывод
│   │   └── index.ts
│   └── utils/
│       ├── message-handler.ts    # Обработка сообщений
│       └── quick-replies-generator.ts # Генерация ответов
│
├── types/
│   └── index.ts                  # TypeScript типы
│
├── App.tsx                       # Точка входа
├── ARCHITECTURE.md               # Документация архитектуры
├── QUICKSTART.md                 # Быстрый старт
└── README.md                     # Этот файл
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
# или
yarn install
```

### 2. Запуск

```bash
npm run dev
```

Откройте http://localhost:3000

### 3. Тестирование flow

1. Нажмите **"Начать разговор"**
2. Введите получателя: "Маме"
3. Выберите повод: "День рождения"
4. Введите город: "Москва"
5. Выберите "Букет цветов" → показываются товары
6. Нажмите "Выбрать" на товаре → добавлен в корзину
7. Нажмите "Оформить заказ" → откроется форма
8. Заполните форму и подтвердите

## 🏗️ Архитектура

### Компонентная иерархия

```
ChatInterface
  ├── ParamsProgress              # Прогресс сбора параметров
  ├── Messages Container          
  │   └── MessageBubble           # Каждое сообщение
  │       ├── ProductGrid         # Сетка товаров (если есть)
  │       │   └── ProductCard     # Карточка товара
  │       └── QuickReplies        # Быстрые ответы (если есть)
  ├── TypingIndicator             # "Печатает..." (при загрузке)
  ├── ShoppingCart                # Корзина (над вводом)
  ├── ChatInput                   # Поле ввода (внизу)
  └── CheckoutModal               # Модальное окно (опционально)
```

### State Management (Zustand)

```typescript
const {
  session,      // Текущая сессия (mode, params, messages)
  cart,         // Корзина товаров
  isLoading,    // Состояние загрузки
  
  // Методы
  addMessage,
  updateParam,
  switchMode,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getTotalPrice,
} = useChatStore();
```

### Режимы работы

#### 1. CONSULTATION (консультация)

Сбор 3 обязательных параметров:
- **recipient** (Кому): "маме", "девушке", "коллеге"
- **occasion** (Повод): "день рождения", "8 марта"
- **city** (Город): { name: "Москва", slug: "moscow" }

**Переход в SEARCH**: Когда все 3 параметра собраны

#### 2. SEARCH (поиск товаров)

- Поиск товаров через MCP API
- Отображение ProductGrid
- Добавление в корзину
- Оформление заказа

## 🔌 Интеграция с MCP API

### Текущее состояние

✅ Используются **моковые данные**
⏳ MCP API интеграция готова к подключению

### Как подключить

См. подробную инструкцию: `/lib/api/mcp-integration.md`

Краткий пример:

```typescript
// 1. Создать MCP Client
import { mcpClient } from '@/lib/api/mcp-client';

// 2. Заменить моковые данные
const products = await mcpClient.searchProducts({
  city_slug: session.params.city?.slug,
  preferences: session.params.preferences,
  page: 0,
  page_size: 8,
});

addMessage('Вот что я подобрал:', 'assistant', { products });
```

## 🎤 Голосовые возможности

### Speech Recognition (ввод)

```typescript
import { useSpeechRecognition } from '@/lib/hooks';

const { isListening, toggleListening } = useSpeechRecognition({
  onResult: (transcript) => {
    handleSendMessage(transcript);
  },
});
```

### Speech Synthesis (вывод)

```typescript
import { useSpeechSynthesis } from '@/lib/hooks';

const { isSpeaking, speak } = useSpeechSynthesis();

speak('Здравствуйте! Какой букет подбираем?');
```

## 🛒 E-commerce Flow

### 1. Добавление в корзину

```typescript
const handleSelectProduct = (product: MCPProduct) => {
  addToCart(product);
};
```

### 2. Корзина

Автоматически отображается, когда `cart.length > 0`

### 3. Оформление заказа

```typescript
const handleSubmitOrder = async (orderData: OrderData) => {
  // Отправить на backend
  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  
  // Очистить корзину
  clearCart();
};
```

## 📝 TypeScript Types

### Основные типы

```typescript
// Сообщение
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  products?: MCPProduct[];
}

// Товар (MCP API)
interface MCPProduct {
  id: string;
  name: string;
  price: {
    final_price: number;
    original_price?: number;
    discount?: number;
  };
  main_image: string;
  images?: string[];
  shop_public_uuid: string;
  parent_category_slug: string;
}

// Корзина
interface CartItem extends MCPProduct {
  quantity: number;
}

// Заказ
interface OrderData {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  payment_method: 'card' | 'cash';
}
```

## 🎨 Стили

Все стили сохранены из оригинального `ResponsiveAIAssistant.tsx`:

- ✅ Цветовая схема (серый + градиенты)
- ✅ Закругления (rounded-2xl, rounded-full)
- ✅ Аватары (User/AI)
- ✅ Карточки товаров с каруселью
- ✅ Модальное окно
- ✅ Responsive layout

## 🔧 Утилиты

### Message Handler

Обрабатывает сообщения пользователя:

```typescript
import { handleUserMessage } from '@/lib/utils/message-handler';

const response = handleUserMessage(
  userMessage,
  currentParams,
  currentMode
);

// response содержит:
// - text: string
// - quickReplies?: string[]
// - shouldFetchProducts?: boolean
// - updatedParam?: { key, value }
```

### Quick Replies Generator

Генерирует быстрые ответы:

```typescript
import { generateQuickReplies } from '@/lib/utils/quick-replies-generator';

const replies = generateQuickReplies(session.params);
```

## 📚 Документация

- **Архитектура**: `/ARCHITECTURE.md` - Подробная архитектура
- **Быстрый старт**: `/QUICKSTART.md` - Краткое руководство
- **MCP API**: `/lib/api/mcp-integration.md` - Интеграция с API

## 🔄 Миграция с ResponsiveAIAssistant

Старый компонент сохранён в `/components/ResponsiveAIAssistant.tsx`

Для возврата к старой версии:

```tsx
// App.tsx
import { ResponsiveAIAssistant } from "./components/ResponsiveAIAssistant";

export default function App() {
  return <ResponsiveAIAssistant />;
}
```

## ✅ TODO

- [ ] Интегрировать реальный MCP Client
- [ ] Добавить Claude API для NLP
- [ ] Добавить обработку ошибок
- [ ] Добавить loading states для всех async операций
- [ ] Добавить тесты (Jest/React Testing Library)
- [ ] Добавить аналитику
- [ ] Оптимизировать производительность

## 🤝 Отличия от оригинала

| Характеристика | ResponsiveAIAssistant | ChatInterface (новая) |
|----------------|----------------------|----------------------|
| Размер кода | 1120 строк в одном файле | ~200 строк на компонент |
| State | useState (локальный) | Zustand (глобальный) |
| Данные | Моковые (встроенные) | MCP API ready |
| Режимы | Неявные (через if/else) | Explicit (consultation/search) |
| Расширяемость | Сложно | Легко (модули) |
| Тестируемость | Низкая | Высокая |
| Стили | ✅ Полностью сохранены | ✅ Идентичны |

## 📄 Лицензия

См. оригинальный проект

## 🙋 Вопросы?

Все компоненты имеют TypeScript типы. Используйте autocomplete в IDE для изучения API.
