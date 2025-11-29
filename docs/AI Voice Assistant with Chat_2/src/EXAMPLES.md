# Примеры использования компонентов

## 1. Использование Zustand Store

### Базовое использование

```tsx
import { useChatStore } from '@/lib/store/chat-store';

function MyComponent() {
  const { session, cart, addMessage, addToCart } = useChatStore();
  
  return (
    <div>
      <p>Режим: {session.mode}</p>
      <p>Сообщений: {session.messages.length}</p>
      <p>Товаров в корзине: {cart.length}</p>
    </div>
  );
}
```

### Добавление сообщения

```tsx
const { addMessage } = useChatStore();

// Простое сообщение
addMessage('Привет!', 'user');

// С быстрыми ответами
addMessage('Выберите повод:', 'assistant', {
  quickReplies: ['День рождения', '8 Марта']
});

// С товарами
addMessage('Вот товары:', 'assistant', {
  products: [
    {
      id: '1',
      name: 'Букет роз',
      price: { final_price: 2990 },
      main_image: 'https://...',
      shop_public_uuid: 'shop-1',
      parent_category_slug: 'bouquets',
    }
  ]
});
```

### Обновление параметров

```tsx
const { updateParam } = useChatStore();

// Обновить получателя
updateParam('recipient', 'Маме');

// Обновить город
updateParam('city', { name: 'Москва', slug: 'moscow' });

// Обновить бюджет
updateParam('price', 'До 5000₽');
```

### Работа с корзиной

```tsx
const { 
  cart, 
  addToCart, 
  removeFromCart, 
  updateCartQuantity,
  getTotalPrice 
} = useChatStore();

// Добавить товар
addToCart(product);

// Удалить товар
removeFromCart('product-id');

// Изменить количество
updateCartQuantity('product-id', 3);

// Получить итоговую сумму
const total = getTotalPrice(); // 8970
```

## 2. Использование компонентов

### MessageBubble

```tsx
import { MessageBubble } from '@/components/chat';

<MessageBubble message={message}>
  {/* Дополнительный контент */}
  <ProductGrid products={products} />
  <QuickReplies replies={['Да', 'Нет']} />
</MessageBubble>
```

### ProductCard

```tsx
import { ProductCard } from '@/components/chat';

<ProductCard
  product={{
    id: '1',
    name: 'Букет "Розовая нежность"',
    price: { 
      final_price: 2890,
      original_price: 3200,
      discount: 10 
    },
    main_image: 'https://...',
    images: ['https://...', 'https://...'],
    shop_public_uuid: 'shop-1',
    parent_category_slug: 'bouquets',
  }}
  onSelect={(product) => {
    console.log('Выбран товар:', product);
    addToCart(product);
  }}
/>
```

### ProductGrid

```tsx
import { ProductGrid } from '@/components/chat';

<ProductGrid
  products={products}
  onSelectProduct={(product) => addToCart(product)}
  initialVisible={4} // Показывать по 4 товара
/>
```

### QuickReplies

```tsx
import { QuickReplies } from '@/components/chat';

<QuickReplies
  replies={['Маме', 'Девушке', 'Подруге']}
  onSelect={(reply) => {
    console.log('Выбран:', reply);
    handleSendMessage(reply);
  }}
/>
```

### ParamsProgress

```tsx
import { ParamsProgress } from '@/components/chat';

<ParamsProgress
  params={{
    recipient: 'Маме',
    occasion: 'День рождения',
    city: { name: 'Москва', slug: 'moscow' },
    price: null,
    preferences: null,
  }}
/>
```

### ShoppingCart

```tsx
import { ShoppingCart } from '@/components/chat';

<ShoppingCart
  cart={cart}
  onUpdateQuantity={(id, delta) => {
    const item = cart.find(i => i.id === id);
    updateCartQuantity(id, item.quantity + delta);
  }}
  onRemoveItem={(id) => removeFromCart(id)}
  onCheckout={() => setCheckoutOpen(true)}
  getTotalPrice={getTotalPrice}
/>
```

### CheckoutModal

```tsx
import { CheckoutModal } from '@/components/chat';

{isCheckoutOpen && (
  <CheckoutModal
    cart={cart}
    onClose={() => setCheckoutOpen(false)}
    onSubmit={async (orderData) => {
      // Отправить заказ
      await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      // Очистить корзину
      clearCart();
      setCheckoutOpen(false);
    }}
    getTotalPrice={getTotalPrice}
  />
)}
```

### ChatInput

```tsx
import { ChatInput } from '@/components/chat';

<ChatInput
  onSend={(message) => handleSendMessage(message)}
  disabled={isLoading}
  isListening={isListening}
  isSpeaking={isSpeaking}
  onVoiceInput={() => toggleListening()}
/>
```

### TypingIndicator

```tsx
import { TypingIndicator } from '@/components/chat';

{isLoading && <TypingIndicator />}
```

## 3. Использование хуков

### useSpeechRecognition

```tsx
import { useSpeechRecognition } from '@/lib/hooks';

function VoiceComponent() {
  const { isListening, toggleListening, isSupported } = useSpeechRecognition({
    onResult: (transcript) => {
      console.log('Распознано:', transcript);
      handleSendMessage(transcript);
    },
    onError: (error) => {
      console.error('Ошибка:', error);
    },
    continuous: false,
    lang: 'ru-RU',
  });

  if (!isSupported) {
    return <p>Ваш браузер не поддерживает голосовой ввод</p>;
  }

  return (
    <button onClick={toggleListening}>
      {isListening ? 'Остановить' : 'Начать запись'}
    </button>
  );
}
```

### useSpeechSynthesis

```tsx
import { useSpeechSynthesis } from '@/lib/hooks';

function TextToSpeechComponent() {
  const { isSpeaking, speak, stop, isSupported } = useSpeechSynthesis({
    lang: 'ru-RU',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });

  return (
    <div>
      <button onClick={() => speak('Здравствуйте! Как дела?')}>
        Озвучить
      </button>
      {isSpeaking && <button onClick={stop}>Остановить</button>}
    </div>
  );
}
```

## 4. Использование утилит

### handleUserMessage

```tsx
import { handleUserMessage } from '@/lib/utils/message-handler';

const response = handleUserMessage(
  'Маме',                    // Сообщение пользователя
  session.params,            // Текущие параметры
  session.mode               // Текущий режим
);

console.log(response);
// {
//   text: 'Отлично! Теперь подскажите...',
//   quickReplies: ['День рождения', 'Юбилей'],
//   updatedParam: { key: 'recipient', value: 'Маме' }
// }
```

### generateQuickReplies

```tsx
import { generateQuickReplies } from '@/lib/utils/quick-replies-generator';

const replies = generateQuickReplies({
  recipient: 'Маме',
  occasion: null,
  city: null,
  price: null,
  preferences: null,
});

console.log(replies);
// ['День рождения', 'Юбилей', '8 Марта', 'Просто так']
```

### areRequiredParamsCollected

```tsx
import { areRequiredParamsCollected } from '@/lib/utils/quick-replies-generator';

const isReady = areRequiredParamsCollected(session.params);

if (isReady) {
  switchMode('search');
}
```

### formatParamsSummary

```tsx
import { formatParamsSummary } from '@/lib/utils/quick-replies-generator';

const summary = formatParamsSummary({
  recipient: 'Маме',
  occasion: 'День рождения',
  city: { name: 'Москва', slug: 'moscow' },
  price: 'До 5000₽',
  preferences: 'Розы',
});

console.log(summary);
// ✓ Кому: Маме
// ✓ Повод: День рождения
// ✓ Город: Москва
// ✓ Бюджет: До 5000₽
// ✓ Предпочтения: Розы
```

### extractPriceRange

```tsx
import { extractPriceRange } from '@/lib/utils/message-handler';

const range1 = extractPriceRange('До 5000');
// { max: 5000 }

const range2 = extractPriceRange('3000-5000');
// { min: 3000, max: 5000 }

const range3 = extractPriceRange('Премиум');
// { min: 5000 }
```

## 5. Создание собственных компонентов

### Кастомная карточка товара

```tsx
import { MCPProduct } from '@/types';
import { useChatStore } from '@/lib/store/chat-store';

export function MyProductCard({ product }: { product: MCPProduct }) {
  const { addToCart } = useChatStore();

  return (
    <div className="border rounded-lg p-4">
      <img src={product.main_image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price.final_price}₽</p>
      <button onClick={() => addToCart(product)}>
        В корзину
      </button>
    </div>
  );
}
```

### Кастомный индикатор загрузки

```tsx
import { useChatStore } from '@/lib/store/chat-store';

export function MyLoadingIndicator() {
  const { isLoading } = useChatStore();

  if (!isLoading) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
      <p>Загрузка...</p>
    </div>
  );
}
```

## 6. Интеграция с MCP API

### Простой пример

```tsx
// /lib/api/mcp-client.ts
export async function searchProducts(filters: MCPSearchFilters) {
  const params = new URLSearchParams({
    city_slug: filters.city_slug || '',
    page: filters.page?.toString() || '0',
    page_size: filters.page_size?.toString() || '20',
  });

  const response = await fetch(
    `https://mcp.cvetov24.ru/api/v2/catalog_items?${params}`
  );

  return response.json();
}

// В компоненте:
import { searchProducts } from '@/lib/api/mcp-client';

const products = await searchProducts({
  city_slug: session.params.city?.slug,
  page: 0,
  page_size: 8,
});

addMessage('Вот товары:', 'assistant', { products });
```

## 7. Полный flow

```tsx
import { ChatInterface } from '@/components/chat';
import { useChatStore } from '@/lib/store/chat-store';

export default function App() {
  const { 
    session, 
    addMessage, 
    updateParam, 
    switchMode 
  } = useChatStore();

  // 1. Пользователь начинает разговор
  addMessage('Привет!', 'user');
  
  // 2. Ассистент отвечает
  addMessage('Для кого подарок?', 'assistant', {
    quickReplies: ['Маме', 'Девушке']
  });
  
  // 3. Пользователь выбирает
  updateParam('recipient', 'Маме');
  
  // 4. Следующий вопрос
  addMessage('Отлично! По какому поводу?', 'assistant', {
    quickReplies: ['День рождения', '8 Марта']
  });
  
  // 5. Пользователь выбирает
  updateParam('occasion', 'День рождения');
  
  // 6. Последний вопрос
  addMessage('В каком городе?', 'assistant', {
    quickReplies: ['Москва', 'Санкт-Петербург']
  });
  
  // 7. Пользователь выбирает
  updateParam('city', { name: 'Москва', slug: 'moscow' });
  
  // 8. Переключаем режим
  switchMode('search');
  
  // 9. Загружаем товары
  const products = await loadProducts();
  addMessage('Вот товары:', 'assistant', { products });

  return <ChatInterface />;
}
```

## 8. Тестирование

### Тест компонента

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickReplies } from '@/components/chat';

test('QuickReplies вызывает onSelect', () => {
  const onSelect = jest.fn();
  
  render(
    <QuickReplies 
      replies={['Маме', 'Девушке']} 
      onSelect={onSelect} 
    />
  );
  
  fireEvent.click(screen.getByText('Маме'));
  
  expect(onSelect).toHaveBeenCalledWith('Маме');
});
```

### Тест store

```tsx
import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '@/lib/store/chat-store';

test('addMessage добавляет сообщение', () => {
  const { result } = renderHook(() => useChatStore());
  
  act(() => {
    result.current.addMessage('Привет', 'user');
  });
  
  expect(result.current.session.messages).toHaveLength(1);
  expect(result.current.session.messages[0].content).toBe('Привет');
});
```

Эти примеры покрывают все основные сценарии использования компонентов и утилит проекта.
