import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Anthropic from '@anthropic-ai/sdk'
import cors from 'cors'

// Initialize Firebase Admin
admin.initializeApp()

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// CORS для разрешения запросов с фронтенда
const corsHandler = cors({ origin: true })

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatParams {
  recipient: string | null
  occasion: string | null
  preferences?: string | null
  price?: string | null
  city: {
    name: string
    slug: string
  } | null
}

interface ChatRequest {
  messages: ChatMessage[]
  params: ChatParams
}

// System prompt для режима консультации
function getConsultationPrompt(params: ChatParams): string {
  return `Ты - дружелюбный AI-ассистент Цветов.ру. Твоя задача помочь клиенту подобрать цветы.

ВАЖНО: Сейчас ты работаешь в РЕЖИМЕ КОНСУЛЬТАЦИИ - собираешь информацию о заказе.

Тебе нужно собрать параметры В ТАКОМ ПОРЯДКЕ:
1. 🎁 Повод (день матери, день рождения, свадьба, просто так и т.д.)
2. 👤 Кому предназначены цветы (маме, жене, девушке, коллеге и т.д.)
3. 💐 Предпочтения получателя (ОПЦИОНАЛЬНО - любимые цветы, что под запретом)
4. 💰 Бюджет/Цена (ОПЦИОНАЛЬНО - до какой суммы, в каком диапазоне)
5. 📍 Город и адрес доставки

ТЕКУЩИЙ СТАТУС ПАРАМЕТРОВ:
- Повод: ${params.occasion || '❌ не указано'}
- Кому: ${params.recipient || '❌ не указано'}
- Предпочтения: ${params.preferences || '➖ не указано (необязательно)'}
- Бюджет: ${params.price || '➖ не указано (необязательно)'}
- Город: ${params.city?.name || '❌ не указано'}

ПОРЯДОК СБОРА:
1. Сначала узнай повод
2. Потом уточни для кого
3. ПОСЛЕ получателя спроси: "Возможно вы знаете что нравится получателю больше всего - например Розы, или что под запретом - например Лилии. Мы учтем это в поиске"
   - Если пользователь укажет предпочтения - запомни
   - Если пропустит (скажет "нет" или "не знаю") - это нормально, продолжай
4. Спроси про бюджет: "Какой у вас бюджет на букет? Можете указать примерную сумму или диапазон"
   - Если клиент упомянет цену - запомни
   - Если пропустит - это нормально, продолжай
5. В конце попроси указать город и адрес доставки

ВАЖНО: Когда собраны ПОВОД, КОМУ и ГОРОД (предпочтения и бюджет опциональны) - сообщи: "Отлично! Все данные собраны. Сейчас подберу для вас букеты!"

ПРАВИЛА ОБЩЕНИЯ:
- Будь дружелюбным, вежливым и профессиональным
- Задавай один вопрос за раз
- Если клиент упоминает параметр в своем сообщении - запомни его
- НЕ предлагай конкретные товары - это будет позже в режиме поиска
- Помогай клиенту, если он не уверен в выборе

ПРИМЕРЫ ВОПРОСОВ:
- "Какой повод для заказа цветов?"
- "Для кого будет букет?"
- "Возможно вы знаете что нравится получателю больше всего - например Розы, или что под запретом - например Лилии. Мы учтем это в поиске"
- "Отлично! Теперь укажите, пожалуйста, город и адрес доставки, чтобы я мог показать доступные букеты в вашем районе."

ВАЖНО: Когда запрашиваешь город - обязательно попроси указать И ГОРОД И АДРЕС доставки.
Это нужно для показа товаров, которые доступны именно в этой локации.

ИЗВЛЕЧЕНИЕ ПАРАМЕТРОВ:
После того как клиент отвечает, ВСЕГДА анализируй его ответ на наличие параметров.

Начинай общение приветливо и задавай вопросы для недостающих параметров.`
}

// Функция для извлечения параметров из ответа Claude
function extractParams(
  text: string,
  currentParams: ChatParams
): Partial<ChatParams> {
  const updates: Partial<ChatParams> = {}
  const lowerText = text.toLowerCase()

  // Извлечение получателя
  if (!currentParams.recipient) {
    const recipientPatterns = [
      { pattern: /мам[еи]/gi, value: 'Маме' },
      { pattern: /жен[еы]/gi, value: 'Жене' },
      { pattern: /девушк[еи]/gi, value: 'Девушке' },
      { pattern: /подруг[еи]/gi, value: 'Подруге' },
      { pattern: /коллег[еи]/gi, value: 'Коллеге' },
      { pattern: /сестр[еы]/gi, value: 'Сестре' },
      { pattern: /бабушк[еи]/gi, value: 'Бабушке' },
    ]

    for (const { pattern, value } of recipientPatterns) {
      if (pattern.test(lowerText)) {
        updates.recipient = value
        break
      }
    }
  }

  // Извлечение повода
  if (!currentParams.occasion) {
    const occasionPatterns = [
      { pattern: /день матер/gi, value: 'День матери' },
      { pattern: /день рожд|др[^а-я]/gi, value: 'День рождения' },
      { pattern: /свадьб/gi, value: 'Свадьба' },
      { pattern: /просто так/gi, value: 'Просто так' },
    ]

    for (const { pattern, value } of occasionPatterns) {
      if (pattern.test(lowerText)) {
        updates.occasion = value
        break
      }
    }
  }

  // Извлечение предпочтений
  if (!currentParams.preferences) {
    // Проверяем ключевые слова для определения предпочтений
    const preferenceKeywords = [
      'люб', 'нрав', 'обожа', 'предпочита',
      'не люб', 'не нрав', 'запрет', 'аллерг'
    ]

    if (preferenceKeywords.some(kw => lowerText.includes(kw))) {
      // Сохраняем весь текст как есть
      updates.preferences = text
    } else {
      // Также проверяем упоминания цветов
      const flowerKeywords = [
        'роз', 'тюльпан', 'лили', 'пион', 'хризантем',
        'орхиде', 'гвозди', 'ирис', 'астр'
      ]

      if (flowerKeywords.some(kw => lowerText.includes(kw))) {
        updates.preferences = text
      }
    }
  }

  // Извлечение цены/бюджета
  if (!currentParams.price) {
    // Ключевые слова для определения цены
    const priceKeywords = [
      'бюджет', 'цен', 'стоимост', 'руб', 'рубл',
      'тысяч', 'до ', 'от ', 'около', 'примерно',
      'не дороже', 'максимум', 'в районе'
    ]

    // Проверяем наличие ключевых слов
    if (priceKeywords.some(kw => lowerText.includes(kw))) {
      // Извлекаем числа из текста
      const numbers = text.match(/\d+\s*(?:000|тыс|тысяч|руб|рубл)?/gi)

      if (numbers && numbers.length > 0) {
        // Сохраняем весь текст с упоминанием цены
        updates.price = text
      }
    }

    // Также проверяем просто числа с "руб" или цифры > 1000
    const priceMatch = text.match(/(\d{4,})\s*(?:руб|₽)?/i)
    if (priceMatch && !currentParams.price) {
      updates.price = text
    }
  }

  // Извлечение города
  if (!currentParams.city) {
    const cityPatterns = [
      { pattern: /москв/gi, name: 'Москва', slug: 'moscow' },
      { pattern: /санкт-петербург|питер|спб/gi, name: 'Санкт-Петербург', slug: 'saint-petersburg' },
      { pattern: /казан/gi, name: 'Казань', slug: 'kazan' },
      { pattern: /нижн[ий]* новгород/gi, name: 'Нижний Новгород', slug: 'nizhny-novgorod' },
      { pattern: /екатеринбург/gi, name: 'Екатеринбург', slug: 'yekaterinburg' },
      { pattern: /новосибирск/gi, name: 'Новосибирск', slug: 'novosibirsk' },
    ]

    for (const { pattern, name, slug } of cityPatterns) {
      if (pattern.test(lowerText)) {
        updates.city = { name, slug }
        break
      }
    }
  }

  return updates
}

// Cloud Function для чата
export const chat = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
    secrets: ['ANTHROPIC_API_KEY'],
  })
  .https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
      try {
        if (request.method !== 'POST') {
          response.status(405).json({ error: 'Method not allowed' })
          return
        }

        const { messages, params } = request.body as ChatRequest

        // Логируем входящие данные для отладки
        console.log('Received messages:', JSON.stringify(messages, null, 2))
        console.log('Received params:', JSON.stringify(params, null, 2))

        if (!messages || !Array.isArray(messages)) {
          response.status(400).json({ error: 'Invalid messages format' })
          return
        }

        // Конвертируем сообщения в формат Anthropic
        // Фильтруем пустые и убираем начальные сообщения ассистента (приветствие)
        let anthropicMessages = messages
          .filter((msg) => msg.content && msg.content.trim().length > 0)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))

        // API Claude требует чтобы первое сообщение было от пользователя
        // Убираем начальные сообщения от ассистента
        while (anthropicMessages.length > 0 && anthropicMessages[0].role === 'assistant') {
          anthropicMessages = anthropicMessages.slice(1)
        }

        console.log('Filtered messages count:', anthropicMessages.length)

        // Если после фильтрации нет сообщений - ошибка
        if (anthropicMessages.length === 0) {
          response.status(400).json({
            error: 'No valid messages',
            message: 'No user messages found'
          })
          return
        }

        // Получаем ответ от Claude
        const message = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          messages: anthropicMessages,
          system: getConsultationPrompt(params),
        })

        // Извлекаем текст ответа
        const assistantMessage =
          message.content[0]?.type === 'text' ? message.content[0].text : ''

        // Проверяем что ответ не пустой
        if (!assistantMessage || assistantMessage.trim().length === 0) {
          response.status(500).json({
            error: 'Empty response from AI',
            message: 'AI returned empty response',
          })
          return
        }

        // Извлекаем параметры из ответа пользователя
        const lastUserMessage = messages[messages.length - 1]
        const extractedParams =
          lastUserMessage?.role === 'user'
            ? extractParams(lastUserMessage.content, params)
            : {}

        // Отправляем ответ
        response.status(200).json({
          message: assistantMessage,
          extractedParams,
        })
      } catch (error) {
        console.error('Error in chat function:', error)
        response.status(500).json({
          error: 'Internal server error',
          message:
            error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })
  })
