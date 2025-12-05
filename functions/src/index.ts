import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Anthropic from '@anthropic-ai/sdk'
import cors from 'cors'
import { CITY_COORDINATES } from './data/city-coordinates'

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
  delivery_address?: string | null
  delivery_date?: string | null
  delivery_time?: string | null
  address_question_shown?: boolean
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
1. 👤 Кому предназначены цветы (маме, жене, девушке, дочке, коллеге и т.д.)
2. 🎁 Повод (день матери, день рождения, свадьба, просто так и т.д.)
3. 📍 Город доставки (ОБЯЗАТЕЛЬНО)

ВАЖНО: Предпочтения получателя (любимые цветы, что под запретом) и бюджет НЕ запрашивай активно.
Если клиент сам упомянет эти параметры в разговоре - сохрани их автоматически.

ТЕКУЩИЙ СТАТУС ПАРАМЕТРОВ:
- Кому: ${params.recipient || '❌ не указано'}
- Повод: ${params.occasion || '❌ не указано'}
- Город: ${params.city?.name || '❌ не указано'}
- Предпочтения: ${params.preferences || '➖ не указано (необязательно)'}
- Бюджет: ${params.price || '➖ не указано (необязательно)'}

ПОРЯДОК СБОРА:
1. Сначала уточни для кого (получатель)
2. Потом узнай повод
3. ПОСЛЕ повода спроси адрес доставки ТОЧНО ТАКИМ ТЕКСТОМ:
   "Теперь укажите, пожалуйста, адрес доставки, чтобы я мог показать доступные букеты. Если адрес не известен выберите город. Мы сами узнаем адрес у получателя"

   ВАЖНО: Вместе с этим текстом ОБЯЗАТЕЛЬНО добавь quick_replies с городами:
   ["Москва", "Казань", "Екатеринбург", "Санкт-Петербург", "Определить по геопозиции"]

ВАЖНО: Когда собраны КОМУ, ПОВОД и ГОРОД - сообщи: "Отлично! Все данные собраны. Сейчас подберу для вас букеты!"

ПРАВИЛА ОБЩЕНИЯ:
- Будь дружелюбным, вежливым и профессиональным
- Задавай один вопрос за раз
- НЕ предлагай конкретные товары - это будет позже в режиме поиска
- Помогай клиенту, если он не уверен в выборе

ПРИМЕРЫ ВОПРОСОВ:
- "Для кого будет букет?"
- "Какой повод для заказа цветов?"
- "Теперь укажите, пожалуйста, адрес доставки, чтобы я мог показать доступные букеты. Если адрес не известен выберите город. Мы сами узнаем адрес у получателя" (с кнопками городов)

Начинай общение приветливо и задавай вопросы для недостающих параметров.`
}

// Эта функция больше не используется - режим поиска работает напрямую без Claude
// function getSearchPrompt() удалена

// Список городов из MCP API (полный список)
const CITIES = [
  'Абакан', 'Альметьевск', 'Ангарск', 'Армавир', 'Артем', 'Архангельск', 'Астана', 'Астрахань', 'Ачинск',
  'Балашиха', 'Барнаул', 'Батайск', 'Белгород', 'Белоозёрский', 'Белореченск', 'Бердск', 'Благовещенск',
  'Борисоглебск', 'Брянск', 'Бузулук', 'Великие Луки', 'Великий Новгород', 'Владивосток', 'Владикавказ',
  'Владимир', 'Волгоград', 'Волжский', 'Вологда', 'Воркута', 'Воронеж', 'Всеволожск', 'Геленджик',
  'Горно-Алтайск', 'Грозный', 'Димитровград', 'Долгопрудный', 'Домодедово', 'Евпатория', 'Екатеринбург',
  'Елабуга', 'Ессентуки', 'Железногорск', 'Зарайск', 'Звенигород', 'Зеленоград', 'Иваново', 'Ивантеевка',
  'Ижевск', 'Иркутск', 'Йошкар-Ола', 'Казань', 'Калининград', 'Калуга', 'Каменск-Уральский', 'Камышин',
  'Кемерово', 'Кингисепп', 'Кинешма', 'Киров', 'Кириши', 'Клин', 'Ковров', 'Коломна', 'Комсомольск-на-Амуре',
  'Королев', 'Костанай', 'Котово', 'Красногорск', 'Краснодар', 'Красноярск', 'Кстово', 'Курган', 'Курск',
  'Липецк', 'Лосино-Петровский', 'Люберцы', 'Магадан', 'Магнитогорск', 'Майкоп', 'Малоярославец',
  'Минеральные Воды', 'Михайловск', 'Москва', 'Мурманск', 'Мытищи', 'Набережные Челны', 'Нальчик',
  'Находка', 'Нефтекамск', 'Нефтеюганск', 'Нижневартовск', 'Нижнекамск', 'Нижний Новгород', 'Нижний Тагил',
  'Никифорово', 'Новокузнецк', 'Новороссийск', 'Новосибирск', 'Новотроицк', 'Новочебоксарск', 'Новочеркасск',
  'Ногинск', 'Норильск', 'Одинцово', 'Омск', 'Оренбург', 'Орехово-Зуево', 'Орск', 'Орёл', 'Павловский Посад',
  'Пенза', 'Первоуральск', 'Пермь', 'Петрозаводск', 'Печора', 'Подольск', 'Прохладный', 'Псков', 'Пугачёв',
  'Пушкино', 'Пыть-Ях', 'Пятигорск', 'Реутов', 'Рославль', 'Ростов-на-Дону', 'Рязань', 'Салават', 'Самара',
  'Санкт-Петербург', 'Саранск', 'Саратов', 'Севастополь', 'Сергиев Посад', 'Серпухов', 'Сертолово',
  'Симферополь', 'Смоленск', 'Соликамск', 'Сосновый Бор', 'Сочи', 'Ставрополь', 'Старый Оскол', 'Стерлитамак',
  'Сургут', 'Сыктывкар', 'Таганрог', 'Тамбов', 'Тверь', 'Тихорецк', 'Тольятти', 'Томск', 'Тосно', 'Тула',
  'Тюмень', 'Улан-Удэ', 'Ульяновск', 'Урай', 'Уфа', 'Фрязино', 'Хабаровск', 'Химки', 'Чебоксары', 'Челябинск',
  'Череповец', 'Черноголовка', 'Черногорск', 'Чишмы', 'Шахты', 'Щелково', 'Электросталь', 'Южно-Сахалинск',
  'Яблоновский', 'Ялта', 'Янаул', 'Ярославль'
]

// Справочник получателей с keywords из ТЗ
const RECIPIENTS = [
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
]

// Справочник поводов с keywords из ТЗ
const OCCASIONS = [
  { value: 'birthday', label: 'День рождения', keywords: ['день рождения', 'др', 'днюха', 'именины', 'совершеннолетие'] },
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
]

/**
 * Форматирует дату в ISO формат YYYY-MM-DD
 */
function formatISO(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Валидирует дату доставки
 * - Не в прошлом (не вчера и раньше)
 * - Не более 20 дней вперед
 */
function validateDeliveryDate(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const today = new Date()

    // Сбрасываем время до 00:00:00 для корректного сравнения
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    // Проверка 1: Не в прошлом (должна быть >= сегодня)
    if (date < today) {
      console.log('Validation failed: date is in the past')
      return false
    }

    // Проверка 2: Не более 20 дней вперед
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 20)
    if (date > maxDate) {
      console.log('Validation failed: date is more than 20 days ahead')
      return false
    }

    return true
  } catch (error) {
    console.error('Date validation error:', error)
    return false
  }
}

/**
 * Парсит дату из сообщения пользователя
 * Поддерживает относительные и абсолютные форматы
 * С ВАЛИДАЦИЕЙ: не в прошлом и максимум 20 дней вперед
 */
function parseDeliveryDate(message: string): string | null {
  const normalized = message.toLowerCase().replace(/ё/g, 'е')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Относительные даты
  if (/\b(завтра|зафтра)\b/.test(normalized)) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = formatISO(tomorrow)
    return validateDeliveryDate(dateStr) ? dateStr : null
  }

  if (/\b(послезавтра|посозавтра)\b/.test(normalized)) {
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 2)
    const dateStr = formatISO(dayAfter)
    return validateDeliveryDate(dateStr) ? dateStr : null
  }

  const inDaysMatch = normalized.match(/через\s+(\d+)\s+(дн[яей]|день|дня)/)
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1])
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)
    const dateStr = formatISO(futureDate)
    return validateDeliveryDate(dateStr) ? dateStr : null
  }

  // Абсолютные даты: "5 декабря", "05.12.2025"
  const monthMap: Record<string, number> = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
  }

  const verbalMatch = normalized.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/)
  if (verbalMatch) {
    const day = parseInt(verbalMatch[1])
    const month = monthMap[verbalMatch[2]]
    let date = new Date(today.getFullYear(), month, day)

    // Если дата в прошлом - берем следующий год
    if (date < today) {
      date.setFullYear(date.getFullYear() + 1)
    }

    const dateStr = formatISO(date)
    return validateDeliveryDate(dateStr) ? dateStr : null
  }

  const dottedMatch = normalized.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/)
  if (dottedMatch) {
    const day = parseInt(dottedMatch[1])
    const month = parseInt(dottedMatch[2]) - 1
    const year = dottedMatch[3] ? parseInt(dottedMatch[3]) : today.getFullYear()
    const date = new Date(year, month, day)

    const dateStr = formatISO(date)
    return validateDeliveryDate(dateStr) ? dateStr : null
  }

  return null
}

// Функция извлечения параметров из сообщения пользователя (по ТЗ)
function extractParams(message: string): Partial<ChatParams> {
  const normalizedMessage = message.toLowerCase()
  const result: Partial<ChatParams> = {}

  // 1. Поиск "кому"
  for (const recipient of RECIPIENTS) {
    if (recipient.keywords.some(kw => normalizedMessage.includes(kw))) {
      result.recipient = recipient.label
      break
    }
  }

  // 2. Поиск "повод"
  for (const occasion of OCCASIONS) {
    if (occasion.keywords.some(kw => normalizedMessage.includes(kw))) {
      result.occasion = occasion.label
      break
    }
  }

  // 3. Поиск города - ищем по названию и находим slug из CITY_COORDINATES
  for (const city of CITIES) {
    const cityPattern = new RegExp(city, 'i')
    if (cityPattern.test(message)) {
      // Ищем slug в CITY_COORDINATES по всем возможным вариантам
      let foundSlug: string | null = null
      const cityLower = city.toLowerCase()

      // Проверяем разные варианты slug
      const possibleSlugs = [
        cityLower.replace(/\s+/g, '-'),           // "санкт-петербург"
        cityLower.replace(/\s+/g, ''),             // "санктпетербург"
        cityLower.replace(/ё/g, 'е').replace(/\s+/g, '-'),  // замена ё на е
      ]

      // Добавляем транслитерацию для популярных городов
      const translitMap: Record<string, string> = {
        'казань': 'kazan',
        'москва': 'moscow',
        'санкт-петербург': 'saint-petersburg',
        'екатеринбург': 'ekaterinburg',
      }

      if (translitMap[cityLower.replace(/\s+/g, '-')]) {
        foundSlug = translitMap[cityLower.replace(/\s+/g, '-')]
      } else {
        // Ищем в CITY_COORDINATES
        for (const slug of Object.keys(CITY_COORDINATES)) {
          if (possibleSlugs.some(ps => slug === ps || slug.includes(ps) || ps.includes(slug))) {
            foundSlug = slug
            break
          }
        }
      }

      if (foundSlug) {
        result.city = {
          name: city,
          slug: foundSlug
        }
        break
      }
    }
  }

  // 4. Извлечение адреса доставки (если найден город)
  if (result.city) {
    // Удаляем название города из сообщения и проверяем остаток
    const messageWithoutCity = message.replace(new RegExp(result.city.name, 'i'), '').trim()

    // Если осталось что-то значимое (более 3 символов) - это вероятно адрес
    if (messageWithoutCity.length > 3) {
      // Очищаем от лишних слов-связок
      const cleanedAddress = messageWithoutCity
        .replace(/^(в|на|по|адрес|улица|ул\.?|проспект|пр\.?|переулок|пер\.?)\s*/i, '')
        .trim()

      if (cleanedAddress.length > 0) {
        result.delivery_address = cleanedAddress
      }
    }
  }

  // 5. Извлечение даты доставки
  const deliveryDate = parseDeliveryDate(message)
  if (deliveryDate) {
    result.delivery_date = deliveryDate
    console.log('Extracted delivery date:', deliveryDate)
  }

  return result
}

// SEARCH_TOOLS больше не используется - режим поиска работает напрямую без Claude tools

// Константы DaData API
const DADATA_API_KEY = 'ed8067ee35a793500819b2799d5fcf2222cc5030'
const DADATA_SECRET_KEY = 'f456b262a061f7db46a69735cc7141a78cea157d'

/**
 * Получение координат адреса через DaData API
 * @param address - Адрес доставки для геокодирования
 * @param cityName - Название города для более точного поиска
 * @returns Координаты {lat, lon} или null если не удалось определить
 */
async function getAddressCoordinates(
  address: string,
  cityName?: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    // Формируем полный адрес с городом если он указан
    const fullAddress = cityName ? `${cityName}, ${address}` : address

    console.log('DaData: Geocoding address:', fullAddress)

    const response = await fetch('https://dadata.ru/api/v2/clean/address', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DADATA_API_KEY}`,
        'X-Secret': DADATA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([fullAddress])
    })

    if (!response.ok) {
      console.error('DaData API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data[0]?.geo_lat && data[0]?.geo_lon) {
      const coordinates = {
        lat: parseFloat(data[0].geo_lat),
        lon: parseFloat(data[0].geo_lon)
      }
      console.log('DaData: Successfully geocoded to', coordinates)
      return coordinates
    }

    console.log('DaData: No coordinates in response')
    return null
  } catch (error) {
    console.error('DaData: Error geocoding address:', error)
    return null
  }
}

// Функция для вызова MCP API поиска товаров
async function searchProducts(params: {
  city: { name: string; slug: string } | null
  delivery_address?: string | null
  recipient?: string | null
  occasion?: string | null
  preferences?: string | null
  min_price?: number
  max_price?: number
}): Promise<any[]> {
  // 1. Определяем координаты для фильтрации
  let coordinates: { lat: number; lon: number } | null = null

  if (params.delivery_address && params.city?.name) {
    // Приоритет 1: Точный адрес доставки → DaData API
    console.log('Trying to geocode delivery address:', params.delivery_address)
    coordinates = await getAddressCoordinates(params.delivery_address, params.city.name)

    if (coordinates) {
      console.log('Using delivery address coordinates:', coordinates)
    } else {
      console.log('DaData failed, falling back to city center')
    }
  }

  if (!coordinates) {
    // Приоритет 2: Координаты центра города (fallback)
    const citySlug = params.city?.slug
    if (citySlug) {
      coordinates = CITY_COORDINATES[citySlug]

      if (coordinates) {
        console.log('Using city center coordinates for', citySlug, ':', coordinates)
      } else {
        throw new Error(`No coordinates found for city: ${citySlug}`)
      }
    } else {
      throw new Error('No city specified')
    }
  }

  // 2. Получаем товары с фильтрацией по координатам
  const url = new URL('https://mcp.cvetov24.ru/api/v2/catalog_items')
  url.searchParams.append('lat', coordinates.lat.toString())
  url.searchParams.append('lon', coordinates.lon.toString())
  url.searchParams.append('page', '0')
  url.searchParams.append('page_size', '50')

  console.log('Fetching products with coordinates:', url.toString())

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`MCP API error: ${response.status}`)
  }

  const data = await response.json()
  let products = data.catalog_items || []

  console.log(`Fetched ${products.length} products for coordinates`)

  // 3. Получаем магазины в зоне доставки для добавления названий
  const shopsUrl = new URL('https://mcp.cvetov24.ru/api/v1/shops/get_delivery_shops')
  shopsUrl.searchParams.append('lat', coordinates.lat.toString())
  shopsUrl.searchParams.append('lon', coordinates.lon.toString())

  const shopsResponse = await fetch(shopsUrl.toString())

  if (shopsResponse.ok) {
    const shopsData = await shopsResponse.json()
    const shops = Array.isArray(shopsData) ? shopsData : (shopsData.shops || [])

    // Создаем мапу shop_guid → shop_name
    const shopNamesMap = new Map(shops.map((s: any) => [s.guid, s.name]))

    console.log(`Found ${shops.length} shops in delivery zone`)

    // Добавляем shop_name к товарам
    products = products.map((p: any) => ({
      ...p,
      shop_name: shopNamesMap.get(p.shop_public_uuid) || 'Неизвестный магазин'
    }))
  } else {
    console.warn('Failed to fetch shop names, using fallback')
    products = products.map((p: any) => ({
      ...p,
      shop_name: 'Магазин цветов'
    }))
  }

  // 4. Дополнительная фильтрация по цене (если указана)
  if (params.min_price !== undefined) {
    products = products.filter((p: any) => p.price.final_price >= params.min_price!)
    console.log(`After min_price filter: ${products.length} products`)
  }

  if (params.max_price !== undefined) {
    products = products.filter((p: any) => p.price.final_price <= params.max_price!)
    console.log(`After max_price filter: ${products.length} products`)
  }

  // 5. Возвращаем до 12 товаров
  return products.slice(0, 12)
}

// Извлечение минимальной цены из строки
function extractMinPrice(priceStr: string): number | undefined {
  // Ищем "от X" или просто число
  const fromMatch = priceStr.match(/от\s*(\d+)/i)
  if (fromMatch) return parseInt(fromMatch[1])

  // Ищем диапазон "X-Y" или "X до Y"
  const rangeMatch = priceStr.match(/(\d+)\s*[-\u2013до]\s*(\d+)/i)
  if (rangeMatch) return parseInt(rangeMatch[1])

  // Ищем просто число
  const numMatch = priceStr.match(/(\d+)/)
  if (numMatch) return parseInt(numMatch[1])

  return undefined
}

// Извлечение максимальной цены из строки
function extractMaxPrice(priceStr: string): number | undefined {
  // Ищем "до X"
  const toMatch = priceStr.match(/до\s*(\d+)/i)
  if (toMatch) return parseInt(toMatch[1])

  // Ищем диапазон "X-Y" или "X до Y"
  const rangeMatch = priceStr.match(/(\d+)\s*[-\u2013до]\s*(\d+)/i)
  if (rangeMatch) return parseInt(rangeMatch[2])

  return undefined
}

// Проверка готовности к переходу в режим поиска
function isReadyForSearch(params: ChatParams): boolean {
  return !!(params.recipient && params.occasion && params.city)
}

// Cloud Function для чата (updated with extractParams from TZ)
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

        // Извлекаем параметры из ПОСЛЕДНЕГО сообщения пользователя (по ТЗ)
        const lastUserMessage = anthropicMessages[anthropicMessages.length - 1]
        const userMessageText = lastUserMessage.role === 'user' ? lastUserMessage.content : ''
        const extractedParams = extractParams(userMessageText)

        console.log('Extracted params from user message:', JSON.stringify(extractedParams, null, 2))

        // ОБНОВЛЯЕМ params извлечёнными значениями
        if (extractedParams.recipient) params.recipient = extractedParams.recipient
        if (extractedParams.occasion) params.occasion = extractedParams.occasion
        if (extractedParams.city) params.city = extractedParams.city
        if (extractedParams.preferences) params.preferences = extractedParams.preferences
        if (extractedParams.price) params.price = extractedParams.price
        if (extractedParams.delivery_address) params.delivery_address = extractedParams.delivery_address
        if (extractedParams.delivery_date) params.delivery_date = extractedParams.delivery_date

        console.log('Updated params:', JSON.stringify(params, null, 2))

        // Определяем режим работы
        const readyForSearch = isReadyForSearch(params)

        console.log('Mode:', readyForSearch ? 'SEARCH' : 'CONSULTATION')

        let assistantMessage = ''
        let products: any[] | undefined = undefined

        // ЕСЛИ ВСЕ ПАРАМЕТРЫ СОБРАНЫ - СРАЗУ ПОКАЗЫВАЕМ ТОВАРЫ БЕЗ ВЫЗОВА CLAUDE
        if (readyForSearch) {
          console.log('All params collected, searching products directly...')

          try {
            // Вызываем поиск товаров напрямую
            products = await searchProducts({
              city: params.city,
              delivery_address: params.delivery_address,
              recipient: params.recipient,
              occasion: params.occasion,
              preferences: params.preferences,
              min_price: params.price ? extractMinPrice(params.price) : undefined,
              max_price: params.price ? extractMaxPrice(params.price) : undefined,
            })

            console.log(`Found ${products.length} products`)

            assistantMessage = products.length > 0
              ? `Отлично! Я подобрал ${products.length} ${products.length === 1 ? 'букет' : products.length < 5 ? 'букета' : 'букетов'} для вас. Выберите понравившийся!`
              : 'К сожалению, не нашел подходящих букетов в вашем городе. Попробуйте выбрать другой город или повод.'
          } catch (error) {
            console.error('Error searching products:', error)
            assistantMessage = 'Извините, произошла ошибка при поиске товаров. Попробуйте еще раз.'
          }
        } else {
          // РЕЖИМ КОНСУЛЬТАЦИИ - вызываем Claude для сбора параметров
          const systemPrompt = getConsultationPrompt(params)

          const message = await anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            messages: anthropicMessages,
            system: systemPrompt,
          })

          console.log('Claude response:', JSON.stringify(message, null, 2))

          for (const block of message.content) {
            if (block.type === 'text') {
              assistantMessage = block.text
            }
          }
        }

        // Проверяем что ответ не пустой
        if (!assistantMessage || assistantMessage.trim().length === 0) {
          response.status(500).json({
            error: 'Empty response from AI',
            message: 'AI returned empty response',
          })
          return
        }

        // Извлекаем quick_replies из сообщения (если есть массив вида ["btn1", "btn2"])
        let quickReplies: string[] | undefined = undefined
        const quickRepliesMatch = assistantMessage.match(/\[[\s\S]*?\]/g)

        if (quickRepliesMatch) {
          try {
            // Берем последнее совпадение (на случай если их несколько)
            const lastMatch = quickRepliesMatch[quickRepliesMatch.length - 1]
            console.log('Attempting to parse quick_replies:', lastMatch)
            const parsed = JSON.parse(lastMatch)
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
              quickReplies = parsed
              // Убираем массив из текста сообщения
              assistantMessage = assistantMessage.replace(lastMatch, '').trim()
              console.log('Successfully parsed quick_replies:', quickReplies)
            }
          } catch (e) {
            console.error('Failed to parse quick_replies:', e)
          }
        }

        // Отправляем ответ
        response.status(200).json({
          message: assistantMessage,
          extractedParams,
          ...(products && { products }),
          ...(quickReplies && { quickReplies }),
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
