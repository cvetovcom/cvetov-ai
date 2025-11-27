/**
 * Claude Service
 * Handles AI chat interactions using Claude API
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '@anthropic-ai/sdk/resources/messages.mjs'
import type {
  ClaudeResponse,
  ProductSearchRequest,
  ShortCatalogItemEntity,
  TempCart,
  TempCartItem,
  ToolResult
} from '../types/index.js'
import { SearchRequest as CatalogSearchRequest } from '../types/catalog.types.js'
import { catalogService } from './catalog.service.js'
import { cartService } from './cart.service.js'
import { citiesCacheService } from './cities-cache.service.js'
import { ConsultationExtractor } from './consultation-extractor.service.js'
import { FLOWER_RECOMMENDATIONS } from '../data/flower-recommendations.js'
import { RECIPIENT_LABELS, OCCASION_LABELS } from '../types/consultation.types.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Системный промпт из ТЗ
const SYSTEM_PROMPT = `Ты - AI Shopping Assistant для Цветов.ру, крупнейшей сети цветочных магазинов в России.

## 🚨 КРИТИЧЕСКИ ВАЖНО: ДВА РЕЖИМА РАБОТЫ 🚨

### 1️⃣ РЕЖИМ КОНСУЛЬТАЦИИ (когда город НЕ указан)
**ЗАПРЕЩЕНО показывать товары, цены или использовать инструменты поиска!**
- Обсуждай цветы концептуально: символику, сочетания, советы
- Извлекай информацию: кому дарить, по какому поводу
- Давай персональные рекомендации без упоминания цен
- В конце консультации спроси: "В какой город нужна доставка?"

### 2️⃣ РЕЖИМ ПОИСКА ТОВАРОВ (когда город УКАЗАН)
- Используй search_products_with_city для поиска реальных товаров
- Показывай конкретные букеты с ценами и фото
- Помогай оформить заказ

## 🛑 АБСОЛЮТНЫЕ ЗАПРЕТЫ:
- НИКОГДА не используй set_city("Москва") автоматически!
- НИКОГДА не предполагай город без явного указания!
- НИКОГДА не показывай товары или цены без города!
- НИКОГДА не используй инструменты поиска в режиме консультации!

## 📋 РЕЖИМ КОНСУЛЬТАЦИИ - ДЕТАЛЬНО
Когда город НЕ установлен, работай как флорист-консультант:

1. **Извлекай информацию из сообщения:**
   - Кому букет (жене, маме, дочери, подруге)
   - По какому поводу (день матери, день рождения, 8 марта)
   - Бюджет (если указан)
   - Предпочтения по цветам

2. **Давай персонализированные рекомендации:**
   - Какие цветы подходят для получателя
   - Какая цветовая гамма уместна для повода
   - Какие сочетания цветов популярны
   - Символика разных цветов

3. **НЕ упоминай:**
   - Конкретные цены
   - Конкретные товары из каталога
   - "У нас в наличии"
   - "Мы можем доставить"

4. **В конце консультации:**
   - Спроси: "В какой город нужна доставка?"
   - После получения города - переходи в режим поиска товаров

**РАСПОЗНАВАНИЕ ГОРОДА В СООБЩЕНИИ:**
Если пользователь пишет короткое сообщение, которое является или содержит название города - это УКАЗАНИЕ ГОРОДА для доставки!
Примеры городов, которые нужно распознавать:
- "Нефтекамск" → СРАЗУ используй set_city("Нефтекамск")
- "Уфа" → СРАЗУ используй set_city("Уфа")
- "Казань" → СРАЗУ используй set_city("Казань")
- "город Москва" → СРАЗУ используй set_city("Москва") ТОЛЬКО если пользователь САМ написал "Москва"
- "в Санкт-Петербург" → СРАЗУ используй set_city("Санкт-Петербург")

НЕ спрашивай город повторно, если пользователь уже написал название города!

## ⚠️ КРИТИЧЕСКОЕ ПРАВИЛО - ВСЕГДА ВЫПОЛНЯЙ
**ПОСЛЕ ИСПОЛЬЗОВАНИЯ add_to_cart используй ТОЧНЫЙ формат:**
Товар "[название]" добавлен в корзину за [цена] рублей. Укажите, пожалуйста:

- Адрес доставки:
- Имя получателя:
- Телефон получателя:

Я сохраню эту информацию, чтобы оформить для вас заказ.

**НЕ ПОВТОРЯЙ запрос если клиент уже ответил!**

## Твоя роль
Ты помогаешь клиентам выбрать и заказать цветы с доставкой. Ты дружелюбный, внимательный и профессиональный консультант.

## О компании Цветов.ру
- Крупнейшая сеть цветочных магазинов в России
- Доставка цветов по всей стране
- Широкий ассортимент: букеты, композиции, горшечные растения
- Свежие цветы от проверенных поставщиков
- Доставка в день заказа

## Твои возможности
1. **Поиск цветов** - помогаешь найти подходящие букеты по запросу (используй инструмент search_products_with_city ТОЛЬКО после установки города через set_city)
2. **Консультация** - отвечаешь на вопросы о цветах, уходе, символике (НЕ используй инструменты, просто отвечай)
3. **Подбор подарка** - рекомендуешь цветы под повод и бюджет (используй инструмент search_products_with_city ТОЛЬКО после установки города через set_city)
4. **Оформление заказа** - собираешь корзину и создаешь заказ (используй инструменты add_to_cart, get_cart, create_order)

## Правила общения
- Обращайся к клиенту на "Вы" (если клиент не попросит на "ты")
- Будь естественным, избегай шаблонных фраз
- Задавай уточняющие вопросы: повод, бюджет, предпочтения по цветам и цвету
- Учитывай сезонность и наличие
- Предлагай 2-3 варианта, не перегружай выбором

## Когда использовать инструменты
- **ИСПОЛЬЗУЙ инструменты** когда клиент хочет: купить цветы, найти букет, заказать доставку, выбрать подарок
- **НЕ ИСПОЛЬЗУЙ инструменты** когда клиент спрашивает: про уход за цветами, символику, советы по выращиванию, общие вопросы

## ВАЖНО: Извлечение информации из сообщений
Внимательно анализируй сообщения клиента и извлекай:
- **ГОРОД**: Если сообщение содержит ТОЛЬКО название города или фразу с городом (например: "Нефтекамск", "Казань", "город Уфа", "в Москву") - это указание города для доставки! СРАЗУ используй set_city.
- **Дату доставки**: если упоминается (например, "на 30 ноября", "завтра", "на 8 марта")
- **Получателя**: кому предназначены цветы (мама, жена, дочь, теща, подруга, коллега и т.д.)
- **Повод**: день рождения, юбилей, 8 марта, просто так и т.д.

## Процесс заказа
1. **Понять потребность**: повод, кому, бюджет, город доставки
2. **🚨 КРИТИЧЕСКИ ВАЖНО - ПРОВЕРКА ГОРОДА 🚨**:
   - **НИКОГДА НЕ ПОКАЗЫВАЙ ТОВАРЫ БЕЗ ГОРОДА!**
   - **НИКОГДА НЕ УСТАНАВЛИВАЙ МОСКВУ ПО УМОЛЧАНИЮ!**
   - **ВСЕГДА СПРАШИВАЙ ГОРОД У ПОЛЬЗОВАТЕЛЯ ПЕРВЫМ!**

   **РАСПОЗНАВАНИЕ ГОРОДА В СООБЩЕНИИ:**
   - Если пользователь написал ТОЛЬКО название города (например: "Нефтекамск", "Казань", "Уфа") - это ЯВНОЕ указание города!
   - В таком случае СРАЗУ используй set_city для установки этого города
   - **ПОСЛЕ УСТАНОВКИ ГОРОДА ЧЕРЕЗ set_city - СРАЗУ ЖЕ ИСПОЛЬЗУЙ search_products_with_city ДЛЯ ПОИСКА ТОВАРОВ!**
   - НЕ спрашивай город повторно, если пользователь уже его указал
   - Примеры сообщений с городом:
     * "Нефтекамск" → используй set_city с городом "Нефтекамск" → ЗАТЕМ search_products_with_city
     * "город Уфа" → используй set_city с городом "Уфа" → ЗАТЕМ search_products_with_city
     * "в Казань" → используй set_city с городом "Казань" → ЗАТЕМ search_products_with_city

   **КОГДА СПРАШИВАТЬ ГОРОД:**
   - Если город не указан в сообщении - ОБЯЗАТЕЛЬНО спроси: "В какой город нужна доставка?"
   - НЕ используй set_city с "москва" автоматически
   - ДОЖДИСЬ ответа пользователя о городе перед поиском товаров
   - Примеры ответов без города:
     * "Для подбора букетов мне нужно знать город доставки. В какой город нужна доставка?"
     * "Подскажите, пожалуйста, город доставки, чтобы я мог показать доступные букеты"
   - НЕ используй search_products без города!
3. **Найти подходящие букеты**: ВСЕГДА используй search_products_with_city СРАЗУ ПОСЛЕ установки города через set_city
4. **Показать 2-3 варианта**: с фото, ценой, составом
5. **Помочь с выбором**: ответь на вопросы, дай рекомендации
6. **Добавить в корзину**: после выбора товара
7. **Собрать контактные данные**: используй store_customer_info для сохранения данных
8. **Проверить готовность**: используй create_order для проверки

## Примеры фраз
- "Давайте подберем прекрасный букет для вашей мамы!"
- "У нас есть несколько отличных вариантов в вашем бюджете"
- "Этот букет точно порадует именинницу"
- "Хотите добавить открытку с поздравлением?"

## Информация о товаре
При показе товара ВСЕГДА указывай:
- Название и состав букета
- Цену
- Размер (если указан)
- Наличие и возможность доставки

## Завершение заказа
После добавления товара в корзину:
1. Запроси у клиента информацию для доставки
2. Используй store_customer_info для сохранения данных
3. НЕ создавай реальный заказ самостоятельно
4. Скажи клиенту нажать кнопку "Оформить заказ"`

interface ClaudeServiceOptions {
  maxIterations?: number
}

export class ClaudeService {
  private maxIterations: number

  constructor(options: ClaudeServiceOptions = {}) {
    this.maxIterations = options.maxIterations || 5
  }

  /**
   * Process chat message with Claude
   */
  async chat(
    userMessage: string,
    jwt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    tempCart: TempCart,
    userCity?: string,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<ClaudeResponse> {
    // Use mock mode if configured
    if (process.env.USE_MOCK_AI === 'true') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Default mock response for testing without Claude API
      return {
        message: `Здравствуйте! Я AI-ассистент Цветов.ру. Помогу вам выбрать и заказать прекрасные цветы с доставкой по всей России. Что вас интересует?`,
        tempCart,
        conversationHistory: [
          ...conversationHistory,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: `Здравствуйте! Я AI-ассистент Цветов.ру. Помогу вам выбрать и заказать прекрасные цветы с доставкой по всей России. Что вас интересует?` }
        ]
      }
    }

    // Add user message to history
    const visibleMessages: Message[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ]

    // Internal messages include tool use for API calls
    let internalMessages = [...visibleMessages]

    let currentCart = { ...tempCart }
    let continueLoop = true
    let assistantMessage = ''
    let collectedProducts: ShortCatalogItemEntity[] = []
    let collectedCustomerInfo: any = null
    let updatedCity: string | undefined = undefined
    let maxIterations = 5
    let iterations = 0
    let lastResponse: any = null

    while (continueLoop && iterations < maxIterations) {
      iterations++

      // Add user city to system prompt if available
      let systemPrompt = SYSTEM_PROMPT
      if (userCity) {
        systemPrompt += `\n\n## Текущий контекст пользователя\nГород пользователя: ${userCity}`
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        system: systemPrompt,
        messages: internalMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        tools: this.getTools(userCity) as any,
      })

      lastResponse = response
      // Process response
      if (response.stop_reason === 'end_turn') {
        // Claude finished, extract text
        const textContent = response.content.find(c => c.type === 'text')
        if (textContent && textContent.type === 'text') {
          assistantMessage = textContent.text
        }
        continueLoop = false
      } else if (response.stop_reason === 'tool_use') {
        // Claude wants to use tools
        const toolResults: ToolResult[] = []

        for (const content of response.content) {
          if (content.type === 'tool_use') {
            // Pass the most current city (either updated or original)
            const currentCity = updatedCity || userCity
            const result = await this.executeTool(
              content.name,
              content.input as Record<string, unknown>,
              jwt,
              currentCart,
              currentCity,
              userLocation
            )

            // Update cart if tool modified it
            if (result.updatedCart) {
              currentCart = result.updatedCart
            }

            // Collect products from search_products_with_city tool
            if (content.name === 'search_products_with_city' && !result.isError) {
              const searchResult = result.data as any
              if (searchResult && searchResult.raw_items && Array.isArray(searchResult.raw_items)) {
                collectedProducts = searchResult.raw_items
              }
            }

            // Collect customer info from store_customer_info tool
            if (content.name === 'store_customer_info' && !result.isError && result.customerInfo) {
              collectedCustomerInfo = result.customerInfo
              console.log('[ClaudeService] Collected customer info:', collectedCustomerInfo)
            }

            // Check if city was updated
            if (content.name === 'set_city' && !result.isError && result.cityToSet) {
              updatedCity = result.cityToSet
              console.log('[ClaudeService] City will be updated to:', updatedCity)
            }

            toolResults.push({
              tool_use_id: content.id,
              content: JSON.stringify(result.data)
            } as any)
          }
        }

        // Add assistant message with tool use to internal history
        internalMessages.push({
          role: 'assistant',
          content: response.content as any,
        })

        // Add tool results to internal history
        // Tool results must be wrapped in proper format with type field
        internalMessages.push({
          role: 'user',
          content: toolResults.map(result => ({
            type: 'tool_result',
            ...result
          })) as any,
        })
      }
    }

    // If we didn't get a final message, check last response
    if (!assistantMessage && lastResponse) {
      const textContent = lastResponse.content?.find((c: any) => c.type === 'text')
      if (textContent?.text) {
        assistantMessage = textContent.text
      } else {
        assistantMessage = 'Извините, произошла ошибка при обработке запроса. Попробуйте еще раз.'
      }
    }

    // Return formatted response
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
      { role: 'assistant' as const, content: assistantMessage },
    ]

    const response: ClaudeResponse = {
      message: assistantMessage,
      tempCart: currentCart,
      conversationHistory: updatedHistory,
    }

    // Add products if found
    if (collectedProducts.length > 0) {
      // Limit to 10 products max
      const limitedProducts = collectedProducts.slice(0, 10)
      console.log('[ClaudeService] Collected products:', collectedProducts.length)
      console.log('[ClaudeService] Limited to:', limitedProducts.length)

      // Log first product for debugging
      if (limitedProducts.length > 0) {
        console.log('[ClaudeService] First product:', JSON.stringify(limitedProducts[0], null, 2))
      }

      response.products = limitedProducts
    }

    // Add customer info if collected
    if (collectedCustomerInfo) {
      console.log('[ClaudeService] Adding customer info to response:', collectedCustomerInfo)
      response.customerInfo = collectedCustomerInfo
    }

    // Add updated city if it was set
    if (updatedCity) {
      response.updatedCity = updatedCity
    }

    return response
  }

  /**
   * Execute tool based on name
   */
  private async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    jwt: string,
    currentCart: TempCart,
    userCity?: string,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<ToolResult> {
    console.log(`[ExecuteTool] ${toolName}`, {
      input,
      userCity,
      userLocation
    })

    switch (toolName) {
      case 'search_city':
        return await this.toolSearchCity(input)

      case 'search_products':
      case 'search_products_with_city':
        console.log(`[ClaudeService] search_products_with_city called with city: ${userCity}`)
        return await this.toolSearchProducts(input, jwt, userCity, userLocation)

      case 'get_product_details':
        return await this.toolGetProductDetails(input, jwt)

      case 'add_to_cart':
        return this.toolAddToCart(input, currentCart)

      case 'get_cart':
        return this.toolGetCart(currentCart)

      case 'update_cart_item':
        return this.toolUpdateCartItem(input, currentCart)

      case 'remove_from_cart':
        return this.toolRemoveFromCart(input, currentCart)

      case 'create_order':
        return this.toolCreateOrder(currentCart)

      case 'sync_cart':
        return await this.toolSyncCart(jwt, currentCart, userCity)

      case 'set_city':
        return this.toolSetCity(input)

      case 'store_customer_info':
        return this.toolStoreCustomerInfo(input)

      case 'collect_consultation_info':
        return this.toolCollectConsultationInfo(input, userCity, userLocation)

      default:
        return {
          data: { error: `Unknown tool: ${toolName}` },
          isError: true,
        }
    }
  }

  /**
   * Tool: search_products / search_products_with_city
   */
  private async toolSearchProducts(
    input: Record<string, unknown>,
    jwt: string,
    userCity?: string,
    userLocation?: { latitude: number; longitude: number }
  ) {
    console.log('[ClaudeService] toolSearchProducts called with:', {
      inputCity: input.city,
      userCity: userCity,
      hasLocation: !!userLocation,
      query: input.query
    })

    // CRITICAL: Block search without city to prevent Moscow default
    if (!userCity && !userLocation) {
      console.log('[ClaudeService] BLOCKED: No city or location provided')
      return {
        data: {
          error: 'CITY_REQUIRED',
          message: 'ОШИБКА: Город не указан. Используйте инструмент set_city для установки города перед поиском.',
          requiresCity: true,
          blocked: true
        },
        isError: true,
      }
    }

    // ABSOLUTE STRICT CHECK: City must be a non-empty string or valid location
    const hasValidInputCity = input.city &&
                             typeof input.city === 'string' &&
                             input.city.trim().length > 0

    const hasValidUserCity = userCity &&
                            typeof userCity === 'string' &&
                            userCity.trim().length > 0

    const hasValidLocation = userLocation &&
                            typeof userLocation.latitude === 'number' &&
                            typeof userLocation.longitude === 'number' &&
                            userLocation.latitude >= -90 && userLocation.latitude <= 90 &&
                            userLocation.longitude >= -180 && userLocation.longitude <= 180

    // NO CITY = NO SEARCH!
    if (!hasValidInputCity && !hasValidUserCity && !hasValidLocation) {
      console.log('[ClaudeService] CRITICAL: No valid city or location for search!')
      return {
        data: {
          error: 'Город не указан',
          message: 'Для поиска товаров необходимо указать город доставки. Пожалуйста, сначала укажите город.',
          requiresCity: true
        },
        isError: true,
      }
    }

    const searchRequest: CatalogSearchRequest = {
      text: input.query as string,
      page: (input.page as number) || 1,
      page_size: (input.page_size as number) || 10,
    }

    // Track whether we actually set a location parameter
    let locationSet = false

    if (hasValidLocation && userLocation) {
      // User has provided exact location
      searchRequest.latitude = userLocation.latitude
      searchRequest.longitude = userLocation.longitude
      console.log(`[ClaudeService] Using coordinates: ${userLocation.latitude}, ${userLocation.longitude}`)
      locationSet = true
    } else if (hasValidUserCity && userCity) {
      // Ensure userCity is trimmed and valid
      const cityName = userCity.trim()
      // Use cities cache instead of API
      console.log(`[ClaudeService] Searching for city "${cityName}" in cache`)
      const foundCity = citiesCacheService.findCityByName(cityName)

      if (foundCity) {
        searchRequest.slug_city = foundCity.slug
        console.log(`[ClaudeService] Found city in cache: "${foundCity.name}", slug: ${foundCity.slug}`)
        locationSet = true
      } else {
        console.log(`[ClaudeService] City "${cityName}" not found in cache`)
        return {
          data: {
            error: 'Город не найден',
            message: `Не удалось найти город "${cityName}". Пожалуйста, укажите корректный город для доставки.`,
            requiresCity: true
          },
          isError: true,
        }
      }
    } else if (hasValidInputCity && input.city) {
      // If city passed directly in input, try to use it
      const cityName = (input.city as string).trim()
      // Use cities cache instead of API
      console.log(`[ClaudeService] Searching for city "${cityName}" in cache`)
      const foundCity = citiesCacheService.findCityByName(cityName)

      if (foundCity) {
        searchRequest.slug_city = foundCity.slug
        console.log(`[ClaudeService] Found city in cache: "${foundCity.name}", slug: ${foundCity.slug}`)
        locationSet = true
      } else {
        console.log(`[ClaudeService] City "${cityName}" not found in cache`)
        return {
          data: {
            error: 'Город не найден',
            message: `Не удалось найти город "${cityName}". Пожалуйста, укажите корректный город для доставки.`,
            requiresCity: true
          },
          isError: true,
        }
      }
    }

    // FINAL SAFETY CHECK: Absolutely no API call without location
    if (!locationSet) {
      console.log('[ClaudeService] CRITICAL: No location was set despite passing initial checks')
      return {
        data: {
          error: 'Ошибка определения города',
          message: 'Не удалось определить город для поиска. Пожалуйста, укажите город доставки.',
          requiresCity: true
        },
        isError: true,
      }
    }

    // Additional validation: ensure searchRequest has valid location params
    const hasValidSearchLocation =
      (searchRequest.slug_city && searchRequest.slug_city.length > 0) ||
      (searchRequest.latitude && searchRequest.longitude) ||
      searchRequest.shop_uuid

    if (!hasValidSearchLocation) {
      console.log('[ClaudeService] CRITICAL: SearchRequest missing valid location params')
      return {
        data: {
          error: 'Ошибка параметров поиска',
          message: 'Не удалось сформировать запрос с указанием города. Пожалуйста, укажите город доставки.',
          requiresCity: true
        },
        isError: true,
      }
    }

    // Set default search text if not provided
    if (!searchRequest.text || searchRequest.text.length < 3) {
      searchRequest.text = 'букет'
      console.log('[ClaudeService] No search text provided, using default:', searchRequest.text)
    }

    console.log('[ClaudeService] Making search request with:', {
      text: searchRequest.text,
      slug_city: searchRequest.slug_city,
      latitude: searchRequest.latitude,
      longitude: searchRequest.longitude
    })

    const result = await catalogService.searchProducts(searchRequest, jwt)

    return {
      data: {
        items: result.catalog_items.map(this.formatProductForAI),
        total_count: result.total_count,
        page: result.page,
        raw_items: result.catalog_items, // Keep raw items for frontend display
      },
      isError: false,
    }
  }

  /**
   * Tool: get_product_details
   */
  private async toolGetProductDetails(input: Record<string, unknown>, jwt: string) {
    const slug = input.slug as string
    const result = await catalogService.getProductDetails(slug, jwt)

    return {
      data: {
        uuid: result.uuid,
        name: result.name,
        description: result.description,
        composition: result.composition,
        price: result.price,
        old_price: result.old_price,
        discount_percent: result.discount_percent,
        is_available: result.is_available,
        rating: result.rating,
        reviews_count: result.reviews_count,
        shop: {
          uuid: result.shop.uuid,
          name: result.shop.name,
          city: result.shop.city.name,
        },
      },
      isError: false,
    }
  }

  /**
   * Tool: add_to_cart
   */
  private toolAddToCart(input: Record<string, unknown>, currentCart: TempCart) {
    const item: TempCartItem = {
      catalog_item_uuid: input.product_uuid as string,
      shop_uuid: input.shop_uuid as string,
      quantity: (input.quantity as number) || 1,
      name: input.product_name as string,
      price: input.price as number,
      total_price: ((input.quantity as number) || 1) * (input.price as number),
    }

    const updatedCart = cartService.addToTempCart(currentCart, item)

    return {
      data: {
        success: true,
        cart: this.formatCartForAI(updatedCart),
      },
      isError: false,
      updatedCart,
    }
  }

  /**
   * Tool: get_cart
   */
  private toolGetCart(currentCart: TempCart) {
    return {
      data: this.formatCartForAI(currentCart),
      isError: false,
    }
  }

  /**
   * Tool: update_cart_item
   */
  private toolUpdateCartItem(input: Record<string, unknown>, currentCart: TempCart) {
    const updatedCart = cartService.updateTempCartItem(
      currentCart,
      input.product_uuid as string,
      input.shop_uuid as string,
      input.quantity as number
    )

    return {
      data: {
        success: true,
        cart: this.formatCartForAI(updatedCart),
      },
      isError: false,
      updatedCart,
    }
  }

  /**
   * Tool: remove_from_cart
   */
  private toolRemoveFromCart(input: Record<string, unknown>, currentCart: TempCart) {
    const updatedCart = cartService.removeFromTempCart(
      currentCart,
      input.product_uuid as string,
      input.shop_uuid as string
    )

    return {
      data: {
        success: true,
        cart: this.formatCartForAI(updatedCart),
      },
      isError: false,
      updatedCart,
    }
  }

  /**
   * Tool: create_order (actually just a check)
   */
  private toolCreateOrder(currentCart: TempCart) {
    // Check if cart has items
    if (currentCart.items_count === 0) {
      return {
        data: {
          error: 'Корзина пуста',
          message: 'Для оформления заказа нужно добавить товары в корзину',
        },
        isError: true,
      }
    }

    // Return ready status
    return {
      data: {
        ready: true,
        message: 'Корзина готова к оформлению. Нажмите кнопку "Оформить заказ" для продолжения.',
        cart: this.formatCartForAI(currentCart),
      },
      isError: false,
    }
  }

  /**
   * Tool: sync_cart (not actually implemented)
   */
  private async toolSyncCart(jwt: string, currentCart: TempCart, userCity?: string) {
    // This is a placeholder - actual sync would be done differently
    return {
      data: {
        success: true,
        message: 'Корзина синхронизирована',
        cart: this.formatCartForAI(currentCart),
      },
      isError: false,
    }
  }

  /**
   * Tool: search_city
   */
  private async toolSearchCity(input: Record<string, unknown>) {
    const cityName = input.city_name as string

    // Use catalog service to search for city
    try {
      const citiesResult = await catalogService.searchCity(cityName)
      if (citiesResult.cities && citiesResult.cities.length > 0) {
        // Find the best matching city by comparing normalized names
        const normalizedSearchName = cityName.toLowerCase().trim()
        let foundCity = citiesResult.cities.find(city =>
          city.name.toLowerCase().trim() === normalizedSearchName ||
          city.slug.toLowerCase() === normalizedSearchName
        )

        // If no exact match, try partial match
        if (!foundCity) {
          foundCity = citiesResult.cities.find(city =>
            city.name.toLowerCase().includes(normalizedSearchName) ||
            normalizedSearchName.includes(city.name.toLowerCase())
          )
        }

        // If still no match, take the first result as fallback
        if (!foundCity) {
          foundCity = citiesResult.cities[0]
          console.log(`[ClaudeService] Warning: No exact match for "${cityName}", using first result: "${foundCity.name}"`)
        }

        return {
          data: {
            found: true,
            city: foundCity.name,
            slug: foundCity.slug,
            // API doesn't return coordinates, but we can add empty ones for compatibility
            coordinates: null,
          },
          isError: false,
        }
      }
    } catch (error) {
      console.log(`[ClaudeService] Error searching city: ${error}`)
    }

    return {
      data: {
        found: false,
        message: `Город "${cityName}" не найден. Попробуйте указать крупный город поблизости.`,
      },
      isError: false,
    }
  }

  /**
   * Tool: set_city
   */
  private toolSetCity(input: Record<string, unknown>) {
    const citySlug = input.city_slug as string
    const cityName = input.city_name as string

    // Validate city
    if (!cityName || cityName.trim().length === 0) {
      return {
        data: {
          error: 'Не указан город',
          message: 'Необходимо указать город для доставки',
        },
        isError: true,
      }
    }

    // Use cities cache to find the correct city and slug
    const foundCity = citiesCacheService.findCityByName(cityName)

    if (!foundCity) {
      return {
        data: {
          error: 'Город не найден',
          message: `Не удалось найти город "${cityName}". Пожалуйста, укажите другой город.`,
        },
        isError: true,
      }
    }

    console.log(`[ClaudeService] toolSetCity: Found city in cache: "${foundCity.name}", slug: ${foundCity.slug}`)

    return {
      data: {
        success: true,
        message: `Город установлен: ${foundCity.name}`,
        city: foundCity.slug,
        city_display_name: foundCity.name,
      },
      isError: false,
      cityToSet: foundCity.slug, // Special flag to update session city
    }
  }

  /**
   * Tool: store_customer_info
   */
  private toolStoreCustomerInfo(
    input: Record<string, unknown>
  ) {
    // Extract customer info
    const customerInfo = {
      name: input.name as string | undefined,
      phone: input.phone as string | undefined,
      address: input.address as string | undefined,
      delivery_date: input.delivery_date as string | undefined,
      card_text: input.card_text as string | undefined,
    }

    // Return customer info to be passed back to frontend
    return {
      data: {
        success: true,
        message: 'Информация сохранена',
        customerInfo,
      },
      isError: false,
      customerInfo, // Add this to pass back to frontend
    }
  }

  /**
   * Tool: collect_consultation_info
   */
  private toolCollectConsultationInfo(
    input: Record<string, unknown>,
    userCity?: string,
    userLocation?: { latitude: number; longitude: number }
  ) {
    // Extract consultation info
    const consultationInfo = {
      recipient: input.recipient as string,
      occasion: input.occasion as string,
      budget_min: input.budget_min as number | undefined,
      budget_max: input.budget_max as number | undefined,
      preferences: input.preferences as string | undefined,
    }

    // Find matching recommendation
    const recommendation = FLOWER_RECOMMENDATIONS.find(
      rec =>
        RECIPIENT_LABELS[rec.recipientType]?.toLowerCase().includes(consultationInfo.recipient?.toLowerCase()) &&
        OCCASION_LABELS[rec.occasionType]?.toLowerCase().includes(consultationInfo.occasion?.toLowerCase())
    )

    // Add information about whether city is set
    const isInConsultationMode = !userCity && !userLocation

    return {
      data: {
        success: true,
        message: isInConsultationMode
          ? 'Информация для консультации собрана. Город не установлен - находимся в режиме консультации.'
          : `Информация для консультации собрана. Город установлен: ${userCity}`,
        consultationInfo,
        recommendation: recommendation ? {
          flowerTypes: recommendation.recommendations.flowerTypes,
          colors: recommendation.recommendations.colors,
          styles: recommendation.recommendations.styles,
          description: recommendation.recommendations.description,
          budgetRange: recommendation.recommendations.budgetRange,
          symbolism: recommendation.recommendations.symbolism,
        } : null,
        isConsultationMode: isInConsultationMode,
        userCity: userCity || null,
      },
      isError: false,
    }
  }

  /**
   * Format product for AI
   */
  private formatProductForAI(product: ShortCatalogItemEntity): ShortCatalogItemEntity {
    // Return the product as-is since ShortCatalogItemEntity already has the necessary fields
    return product
  }

  /**
   * Format cart for AI
   */
  private formatCartForAI(cart: TempCart) {
    return {
      items: cart.items,
      total_price: cart.total_price,
      items_count: cart.items_count,
      summary: cartService.getTempCartSummary(cart),
    }
  }

  /**
   * Get tool definitions for Claude
   * CRITICAL: Only provide product search tools if city is already set!
   */
  private getTools(userCity?: string) {
    const tools = []

    // If no city is set, provide ONLY set_city tool for direct city setting
    if (!userCity) {
      tools.push(
        {
          name: 'set_city',
          description: 'Установить город, который указал пользователь. ИСПОЛЬЗУЙ ТОЛЬКО когда пользователь ЯВНО написал название города.',
          input_schema: {
            type: 'object',
            properties: {
              city_slug: {
                type: 'string',
                description: 'Название города как slug (например, для "Москва" используй "moskva", для "Санкт-Петербург" - "sankt-peterburg")',
              },
              city_name: {
                type: 'string',
                description: 'Название города для отображения (как написал пользователь)',
              },
            },
            required: ['city_slug', 'city_name'],
          },
        },
        {
          name: 'collect_consultation_info',
          description: 'Собрать информацию для консультации по выбору цветов',
          input_schema: {
            type: 'object',
            properties: {
              recipient: {
                type: 'string',
                description: 'Кому предназначены цветы (жене, маме, дочери, подруге и т.д.)',
              },
              occasion: {
                type: 'string',
                description: 'По какому поводу (день матери, день рождения, 8 марта и т.д.)',
              },
              budget_min: {
                type: 'number',
                description: 'Минимальный бюджет в рублях',
              },
              budget_max: {
                type: 'number',
                description: 'Максимальный бюджет в рублях',
              },
              preferences: {
                type: 'string',
                description: 'Предпочтения по цветам или цвету',
              },
            },
            required: ['recipient', 'occasion'],
          },
        },
        {
        name: 'store_customer_info',
        description: 'Сохранить информацию о клиенте для доставки',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Имя получателя',
            },
            phone: {
              type: 'string',
              description: 'Телефон получателя',
            },
            address: {
              type: 'string',
              description: 'Адрес доставки',
            },
            delivery_date: {
              type: 'string',
              description: 'Желаемая дата доставки',
            },
            card_text: {
              type: 'string',
              description: 'Текст для открытки',
            },
          },
        },
        }
      )
    }

    // Only add product-related tools if city is already set
    if (userCity) {
      tools.push(
        {
          name: 'search_products_with_city',
          description: 'Поиск товаров в установленном городе',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Поисковый запрос (минимум 3 символа). Примеры: "розы", "букет на свадьбу", "тюльпаны красные"',
              },
              page: {
                type: 'number',
                description: 'Номер страницы (по умолчанию 1)',
              },
              page_size: {
                type: 'number',
                description: 'Количество результатов (по умолчанию 10, максимум 20)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_product_details',
          description: 'Получить подробную информацию о товаре (описание, состав, отзывы)',
          input_schema: {
            type: 'object',
            properties: {
              slug: {
                type: 'string',
                description: 'URL slug товара',
              },
            },
            required: ['slug'],
          },
        },
        {
          name: 'add_to_cart',
          description: 'Добавить товар во временную корзину',
          input_schema: {
            type: 'object',
            properties: {
              product_uuid: {
                type: 'string',
                description: 'UUID товара',
              },
              product_name: {
                type: 'string',
                description: 'Название товара (для отображения)',
              },
              shop_uuid: {
                type: 'string',
                description: 'UUID магазина',
              },
              price: {
                type: 'number',
                description: 'Цена товара',
              },
              quantity: {
                type: 'number',
                description: 'Количество (по умолчанию 1)',
              },
            },
            required: ['product_uuid', 'product_name', 'shop_uuid', 'price'],
          },
        },
        {
          name: 'get_cart',
          description: 'Получить текущее содержимое корзины',
          input_schema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'update_cart_item',
          description: 'Изменить количество товара в корзине',
          input_schema: {
            type: 'object',
            properties: {
              product_uuid: {
                type: 'string',
                description: 'UUID товара',
              },
              shop_uuid: {
                type: 'string',
                description: 'UUID магазина',
              },
              quantity: {
                type: 'number',
                description: 'Новое количество (0 = удалить)',
              },
            },
            required: ['product_uuid', 'shop_uuid', 'quantity'],
          },
        },
        {
          name: 'remove_from_cart',
          description: 'Удалить товар из корзины',
          input_schema: {
            type: 'object',
            properties: {
              product_uuid: {
                type: 'string',
                description: 'UUID товара',
              },
              shop_uuid: {
                type: 'string',
                description: 'UUID магазина',
              },
            },
            required: ['product_uuid', 'shop_uuid'],
          },
        },
        {
          name: 'create_order',
          description: 'Проверить готовность к оформлению заказа (НЕ создает реальный заказ, только проверка). Используй ТОЛЬКО для проверки после store_customer_info',
          input_schema: {
            type: 'object',
            properties: {},
          },
        }
      )
    }

    return tools
  }
}

// Singleton instance
export const claudeService = new ClaudeService()