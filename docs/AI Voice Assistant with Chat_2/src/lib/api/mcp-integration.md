# Интеграция с MCP API

## Что нужно сделать для подключения реального MCP API

### 1. Создать MCP Client

Создайте файл `/lib/api/mcp-client.ts`:

```typescript
import type { MCPProduct, MCPCity, MCPShop, MCPSearchFilters } from '@/types';

const MCP_API_BASE = 'https://mcp.cvetov24.ru/api';

class MCPClient {
  async getCities(): Promise<MCPCity[]> {
    const response = await fetch(`${MCP_API_BASE}/v1/cities`);
    return response.json();
  }

  async findCityByName(name: string): Promise<MCPCity | null> {
    const cities = await this.getCities();
    return cities.find(city => 
      city.name.toLowerCase().includes(name.toLowerCase())
    ) || null;
  }

  async getShops(citySlug: string): Promise<MCPShop[]> {
    const response = await fetch(`${MCP_API_BASE}/v1/shops?city=${citySlug}`);
    return response.json();
  }

  async searchProducts(filters: MCPSearchFilters): Promise<MCPProduct[]> {
    const { city_slug, preferences, min_price, max_price, page = 0, page_size = 20 } = filters;

    // Если есть текстовый поиск
    if (preferences) {
      const params = new URLSearchParams({
        text: preferences,
        slug_city: city_slug || '',
        page: page.toString(),
        page_size: page_size.toString(),
      });
      const response = await fetch(`${MCP_API_BASE}/v1/search?${params}`);
      return response.json();
    }

    // Иначе получаем все товары и фильтруем на клиенте
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: page_size.toString(),
    });
    const response = await fetch(`${MCP_API_BASE}/v2/catalog_items?${params}`);
    const products: MCPProduct[] = await response.json();

    // Фильтруем по городу (через магазины)
    let filtered = products;
    if (city_slug) {
      const shops = await this.getShops(city_slug);
      const shopUuids = new Set(shops.map(s => s.guid));
      filtered = filtered.filter(p => shopUuids.has(p.shop_public_uuid));
    }

    // Фильтруем по цене
    if (min_price) {
      filtered = filtered.filter(p => p.price.final_price >= min_price);
    }
    if (max_price) {
      filtered = filtered.filter(p => p.price.final_price <= max_price);
    }

    return filtered;
  }
}

export const mcpClient = new MCPClient();
```

### 2. Интегрировать в ChatInterface

В файле `/components/chat/chat-interface.tsx` замените моковые данные на реальные:

```typescript
// Импортируйте клиент
import { mcpClient } from '@/lib/api/mcp-client';

// В handleSendMessage, замените моковые данные:
if (lowerMessage.includes('цветы') || lowerMessage.includes('букет') || lowerMessage.includes('показать')) {
  aiResponse = 'Вот что я подобрал для вас:';
  
  // Реальный запрос к MCP API
  try {
    const products = await mcpClient.searchProducts({
      city_slug: session.params.city?.slug,
      preferences: session.params.preferences || undefined,
      min_price: undefined, // TODO: извлечь из params.price
      max_price: undefined, // TODO: извлечь из params.price
      page: 0,
      page_size: 8,
    });
    
    addMessage(aiResponse, 'assistant', { products });
  } catch (error) {
    console.error('Error fetching products:', error);
    addMessage('Извините, произошла ошибка при загрузке товаров. Попробуйте позже.', 'assistant');
  }
  
  return;
}
```

### 3. Автоматический поиск при сборе параметров

Добавьте автоматический поиск когда собраны все 3 параметра:

```typescript
} else if (!params.city) {
  // Сохраняем город
  const cityName = content;
  
  // Найти город в MCP API
  const cityObj = await mcpClient.findCityByName(cityName);
  
  if (!cityObj) {
    addMessage('К сожалению, доставка в этот город пока недоступна. Попробуйте другой город.', 'assistant', {
      quickReplies: ['Москва', 'Санкт-Петербург', 'Казань']
    });
    return;
  }
  
  updateParam('city', cityObj);
  
  // Автоматически загружаем товары
  const products = await mcpClient.searchProducts({
    city_slug: cityObj.slug,
    page: 0,
    page_size: 8,
  });
  
  aiResponse = `Спасибо! Я собрал всю информацию:\n\n✓ Кому: ${params.recipient}\n✓ Повод: ${params.occasion}\n✓ Город: ${cityObj.name}\n\nВот что я подобрал для вас:`;
  
  addMessage(aiResponse, 'assistant', { products });
  
  // Переключаем режим на search
  setTimeout(() => switchMode('search'), 100);
}
```

### 4. Интеграция с Claude API

Для обработки естественного языка добавьте Claude API:

```typescript
// /lib/api/claude-client.ts
export async function processWithClaude(userMessage: string, context: any) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Контекст: ${JSON.stringify(context)}\nСообщение пользователя: ${userMessage}\n\nИзвлеки параметры и предложи ответ.`
      }]
    })
  });
  
  return response.json();
}
```

### 5. Обработка заказов

Добавьте endpoint для создания заказа в `handleSubmitOrder`:

```typescript
const handleSubmitOrder = async (orderData: OrderData) => {
  try {
    const response = await fetch(`${MCP_API_BASE}/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) throw new Error('Order failed');
    
    const order = await response.json();
    
    addMessage(
      `Спасибо за заказ №${order.id}! Ваш заказ принят и будет доставлен в указанное время. Мы отправили SMS с подтверждением.`,
      'assistant'
    );
    
    setCheckoutOpen(false);
    // Очищаем корзину
    clearCart();
  } catch (error) {
    console.error('Order error:', error);
    addMessage('Произошла ошибка при оформлении заказа. Попробуйте ещё раз.', 'assistant');
  }
};
```

## Переменные окружения

Создайте `.env.local`:

```
NEXT_PUBLIC_MCP_API_BASE=https://mcp.cvetov24.ru/api
NEXT_PUBLIC_CLAUDE_API_KEY=your_claude_api_key
```

## Следующие шаги

1. ✅ Создать MCP Client
2. ✅ Интегрировать поиск товаров
3. ✅ Автоматический поиск при сборе параметров
4. ⏳ Добавить Claude API для NLP
5. ⏳ Добавить endpoint для заказов
6. ⏳ Добавить Web Speech API для голоса
7. ⏳ Добавить обработку ошибок
8. ⏳ Добавить loading states
