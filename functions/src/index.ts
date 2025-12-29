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

interface FlowerPreference {
  flower: string
  color?: string
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

// Промпт для ответов на вопросы (когда параметры уже собраны)
function getQuestionPrompt(params: ChatParams): string {
  return `Ты - AI-ассистент Цветов.ру. Клиент выбирает букет.

КОНТЕКСТ ЗАКАЗА:
- Кому: ${params.recipient}
- Повод: ${params.occasion}
- Город: ${params.city?.name}
- Предпочтения: ${params.preferences || 'не указаны'}

ТВОЯ ЗАДАЧА:
Ответь на вопрос клиента КРАТКО (1-3 предложения).
НЕ предлагай конкретные товары — они покажутся автоматически.
Будь дружелюбным и профессиональным.

Если клиент просто написал "ок", "хорошо", "понял" или подобное — спроси чем ещё можешь помочь.

ПРИМЕРЫ:
- Вопрос "Сколько стоит доставка?" → "Стоимость доставки зависит от адреса и времени, обычно от 300 до 600 рублей. Точную стоимость вы увидите при оформлении заказа."
- Вопрос "Какие розы лучше?" → "Для подарка маме отлично подойдут кустовые или пионовидные розы — они особенно нежные и ароматные."`
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

  // Helper: проверка по границам слова (чтобы "др" не срабатывал на "подруге")
  // Используем пробелы/начало/конец строки вместо \b, т.к. \b не работает с кириллицей
  const matchesKeyword = (text: string, keyword: string): boolean => {
    // Для коротких keywords (2-3 символа) требуем точное совпадение слова
    if (keyword.length <= 3) {
      const regex = new RegExp(`(^|\\s)${keyword}($|\\s)`, 'i')
      return regex.test(text)
    }
    // Для длинных keywords используем includes
    return text.includes(keyword)
  }

  // 1. Поиск "кому"
  for (const recipient of RECIPIENTS) {
    if (recipient.keywords.some(kw => matchesKeyword(normalizedMessage, kw))) {
      result.recipient = recipient.label
      break
    }
  }

  // 2. Поиск "повод"
  for (const occasion of OCCASIONS) {
    if (occasion.keywords.some(kw => matchesKeyword(normalizedMessage, kw))) {
      result.occasion = occasion.label
      break
    }
  }

  // 3. Поиск города
  // Функция нормализации города - убирает падежные окончания
  const normalizeCityName = (text: string): string => {
    // Убираем типичные падежные окончания русских городов
    // казани → казань, москве → москва, самаре → самара
    return text
      .replace(/е$/i, 'а')      // москве → москва, самаре → самара
      .replace(/и$/i, 'ь')      // казани → казань
      .replace(/у$/i, 'а')      // москву → москва, самару → самара
      .replace(/ой$/i, 'а')     // москвой → москва
      .replace(/ью$/i, 'ь')     // казанью → казань
  }

  // Полная карта транслитерации русских названий в английские slug'и
  const cityTranslitMap: Record<string, string> = {
    'москва': 'moscow',
    'санкт-петербург': 'saint-petersburg',
    'новосибирск': 'novosibirsk',
    'екатеринбург': 'ekaterinburg',
    'казань': 'kazan',
    'нижний новгород': 'nizhny-novgorod',
    'челябинск': 'chelyabinsk',
    'самара': 'samara',
    'омск': 'omsk',
    'ростов-на-дону': 'rostov-on-don',
    'уфа': 'ufa',
    'красноярск': 'krasnoyarsk',
    'пермь': 'perm',
    'воронеж': 'voronezh',
    'волгоград': 'volgograd',
    'краснодар': 'krasnodar',
    'саратов': 'saratov',
    'тюмень': 'tyumen',
    'тольятти': 'tolyatti',
    'ижевск': 'izhevsk',
    'барнаул': 'barnaul',
    'ульяновск': 'ulyanovsk',
    'иркутск': 'irkutsk',
    'хабаровск': 'khabarovsk',
    'ярославль': 'yaroslavl',
    'владивосток': 'vladivostok',
    'махачкала': 'makhachkala',
    'томск': 'tomsk',
    'оренбург': 'orenburg',
    'кемерово': 'kemerovo',
    'новокузнецк': 'novokuznetsk',
    'рязань': 'ryazan',
    'астрахань': 'astrakhan',
    'набережные челны': 'naberezhnye-chelny',
    'пенза': 'penza',
    'липецк': 'lipetsk',
    'киров': 'kirov',
    'чебоксары': 'cheboksary',
    'тула': 'tula',
    'калининград': 'kaliningrad',
    'брянск': 'bryansk',
    'курск': 'kursk',
    'иваново': 'ivanovo',
    'магнитогорск': 'magnitogorsk',
    'тверь': 'tver',
    'ставрополь': 'stavropol',
    'белгород': 'belgorod',
    'сочи': 'sochi',
    'нижний тагил': 'nizhny-tagil',
    'владимир': 'vladimir',
    'архангельск': 'arkhangelsk',
    'калуга': 'kaluga',
    'смоленск': 'smolensk',
    'волжский': 'volzhsky',
    'мурманск': 'murmansk',
    'саранск': 'saransk',
    'вологда': 'vologda',
    'тамбов': 'tambov',
    'старый оскол': 'stary-oskol',
    'йошкар-ола': 'yoshkar-ola',
    'таганрог': 'taganrog',
    'комсомольск-на-амуре': 'komsomolsk-on-amur',
    'сыктывкар': 'syktyvkar',
    'нижневартовск': 'nizhnevartovsk',
    'якутск': 'yakutsk',
    'чита': 'chita',
    'орёл': 'oryol',
    'орел': 'oryol',
    'грозный': 'grozny',
    'улан-удэ': 'ulan-ude',
    'благовещенск': 'blagoveshchensk',
    'владикавказ': 'vladikavkaz',
    'сургут': 'surgut',
    'петрозаводск': 'petrozavodsk',
    'кострома': 'kostroma',
    'норильск': 'norilsk',
    'псков': 'pskov',
    'балашиха': 'balashikha',
    'химки': 'khimki',
    'красногорск': 'krasnogorsk',
    'ногинск': 'noginsk',
    'коломна': 'kolomna',
    'подольск': 'podolsk',
    'электросталь': 'elektrostal',
    'ивантеевка': 'ivanteyevka',
    'фрязино': 'fryazino',
    'сертолово': 'sertrolovo',
    'пятигорск': 'pyatigorsk',
    'абакан': 'abakan',
    'майкоп': 'majkop',
    'ялта': 'yalta',
    'севастополь': 'sevastopol',
    'южно-сахалинск': 'yuzhno-sakhalinsk',
    'находка': 'nakhodka',
    'ангарск': 'angarsk',
    'златоуст': 'zlatoust',
    'каменск-уральский': 'kamensk-uralsky',
    'энгельс': 'engels',
    'серпухов': 'serpukhov',
    'мытищи': 'mytishchi',
    'люберцы': 'lyubertsy',
    'королёв': 'korolev',
    'королев': 'korolev',
    'одинцово': 'odintsovo',
    'реутов': 'reutov',
    'щёлково': 'shchyolkovo',
    'щелково': 'shchyolkovo',
    // Средние и малые города (из CITY_COORDINATES)
    'нефтекамск': 'neftekamsk',
    'салават': 'salavat',
    'первоуральск': 'pervouralsk',
    'соликамск': 'solikamsk',
    'железногорск': 'zheleznogorsk',
    'тихорецк': 'tikhoretsk',
    'печора': 'pechora',
    'урай': 'uray',
    'орехово-зуево': 'orekhovo-zuevo',
    'балаково': 'balakovo',
    'ачинск': 'achinsk',
    'братск': 'bratsk',
    'миасс': 'miass',
    'уссурийск': 'ussuriysk',
    'северодвинск': 'severodvinsk',
    'петропавловск-камчатский': 'petropavlovsk-kamchatsky',
  }

  // Алиасы для коротких/разговорных названий
  const cityAliases: Record<string, string> = {
    'спб': 'санкт-петербург',
    'питер': 'санкт-петербург',
    'петербург': 'санкт-петербург',
    'мск': 'москва',
    'екб': 'екатеринбург',
    'нск': 'новосибирск',
    'ннов': 'нижний новгород',
    'нижний': 'нижний новгород',
    'ростов': 'ростов-на-дону',
    'челябы': 'челябинск',
    'новосиб': 'новосибирск',
    'владик': 'владивосток',
    'волгоград': 'волгоград',
  }

  // Функция поиска города в тексте
  const findCityInText = (text: string): { name: string; slug: string } | null => {
    const words = text.toLowerCase().split(/[\s,\.]+/)

    // 1. Проверяем алиасы (спб, мск и т.д.)
    for (const word of words) {
      if (cityAliases[word]) {
        const normalizedCity = cityAliases[word]
        const slug = cityTranslitMap[normalizedCity]
        if (slug) {
          // Находим оригинальное название города из CITIES
          const originalName = CITIES.find(c => c.toLowerCase() === normalizedCity) || normalizedCity
          return { name: originalName, slug }
        }
      }
    }

    // 2. Ищем полные названия городов
    for (const city of CITIES) {
      const cityLower = city.toLowerCase()

      // Проверяем точное совпадение
      if (text.toLowerCase().includes(cityLower)) {
        const slug = cityTranslitMap[cityLower]
        if (slug && CITY_COORDINATES[slug]) {
          return { name: city, slug }
        }
      }

      // Проверяем падежные формы
      for (const word of words) {
        const normalizedWord = normalizeCityName(word)
        if (normalizedWord === cityLower || word === cityLower) {
          const slug = cityTranslitMap[cityLower]
          if (slug && CITY_COORDINATES[slug]) {
            return { name: city, slug }
          }
        }
      }
    }

    return null
  }

  // Ищем город в сообщении
  const foundCity = findCityInText(message)
  if (foundCity) {
    result.city = foundCity
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

  // 6. Извлечение preferences (предпочтений по цветам)
  // Список популярных цветов для распознавания
  const flowers = [
    'роз', 'тюльпан', 'пион', 'хризантем', 'гвоздик', 'лили', 'орхиде',
    'ромашк', 'гербер', 'альстромери', 'ири', 'фрези', 'гиацинт',
    'нарцисс', 'подсолнух', 'эустом', 'гортензи', 'каллы'
  ]

  // Проверяем, упоминаются ли цветы в сообщении
  let hasFlowerMention = false
  for (const flower of flowers) {
    if (normalizedMessage.includes(flower)) {
      hasFlowerMention = true
      break
    }
  }

  // Если упоминаются цветы, сохраняем всё сообщение как preferences
  if (hasFlowerMention) {
    result.preferences = message
    console.log('Extracted preferences:', message)
  }

  return result
}

// Определяет есть ли в сообщении вопрос
function hasQuestion(message: string, extractedParams: Partial<ChatParams>): boolean {
  const msgLower = message.toLowerCase()

  // 1. Проверяем вопросительные слова — это всегда вопрос
  const questionWords = ['как', 'какой', 'какая', 'какие', 'какое', 'почему', 'зачем', 'сколько', 'когда', 'где', 'куда', 'откуда', 'кто', 'что', 'чем', 'можно ли', 'есть ли', 'будет ли']
  for (const qw of questionWords) {
    if (msgLower.startsWith(qw + ' ') || msgLower.includes(' ' + qw + ' ')) {
      console.log('hasQuestion: found question word:', qw)
      return true
    }
  }

  // 2. Вопросительный знак — это вопрос
  if (message.includes('?')) {
    console.log('hasQuestion: found question mark')
    return true
  }

  // 3. Если нет явных признаков вопроса — проверяем остаток текста
  let remainingText = msgLower

  // Убираем город
  if (extractedParams.city?.name) {
    remainingText = remainingText.replace(extractedParams.city.name.toLowerCase(), '')
  }

  // Убираем recipient keywords
  const recipientKeywords = ['маме', 'мама', 'жене', 'жена', 'девушке', 'подруге', 'коллеге', 'сестре', 'дочке', 'бабушке', 'мужу', 'муж', 'папе', 'папа', 'другу', 'друг']
  for (const kw of recipientKeywords) {
    remainingText = remainingText.replace(new RegExp(kw, 'gi'), '')
  }

  // Убираем occasion keywords
  const occasionKeywords = ['день рождения', 'др', 'юбилей', 'свадьба', '8 марта', 'новый год', 'день матери', 'день святого валентина', '14 февраля', 'просто так']
  for (const kw of occasionKeywords) {
    remainingText = remainingText.replace(new RegExp(kw, 'gi'), '')
  }

  // Убираем названия цветов (но НЕ весь preferences текст)
  const flowerNames = ['роза', 'розы', 'роз', 'тюльпан', 'тюльпаны', 'пион', 'пионы', 'хризантема', 'гвоздика', 'лилия', 'орхидея', 'ромашка']
  for (const flower of flowerNames) {
    remainingText = remainingText.replace(new RegExp(flower, 'gi'), '')
  }

  // Убираем служебные слова
  remainingText = remainingText.replace(/\b(в|на|для|букет|букеты|цветы|цветов|хочу|закажи|покажи|заказать|подобрать|подарить|лучше|лучший)\b/gi, '')

  // Очищаем пробелы и знаки препинания
  remainingText = remainingText.replace(/[.,!?\s]+/g, ' ').trim()

  console.log('hasQuestion: remaining text after cleanup:', remainingText)

  // Если осталось больше 3 символов — есть вопрос
  return remainingText.length > 3
}

// Определяет есть ли новые параметры в извлечённых данных
function hasNewParams(extractedParams: Partial<ChatParams>): boolean {
  return !!(
    extractedParams.city ||
    extractedParams.recipient ||
    extractedParams.occasion ||
    extractedParams.preferences ||
    extractedParams.price
  )
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

// Функция для вызова MCP API поиска товаров (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
async function searchProducts(params: {
  city: { name: string; slug: string } | null
  delivery_address?: string | null
  recipient?: string | null
  occasion?: string | null
  preferences?: string | null
  min_price?: number
  max_price?: number
}): Promise<any[]> {
  const startTime = Date.now()

  // 1. Определяем координаты для фильтрации по зоне доставки
  let coordinates: { lat: number; lon: number } | null = null

  if (params.delivery_address && params.city?.name) {
    console.log('Trying to geocode delivery address:', params.delivery_address)
    coordinates = await getAddressCoordinates(params.delivery_address, params.city.name)
    if (coordinates) {
      console.log('Using delivery address coordinates:', coordinates)
    } else {
      console.log('DaData failed, falling back to city center')
    }
  }

  if (!coordinates) {
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

  // 2. Получаем товары из ОПТИМИЗИРОВАННОГО API (с фильтрами на сервере)
  // Теперь API поддерживает lat/lon для геофильтрации!
  const catalogUrl = new URL('https://mcp.cvetov24.ru/api/v2/catalog_items_optimized')
  catalogUrl.searchParams.append('parent_category_slug', 'flowers')
  catalogUrl.searchParams.append('include_composition', 'true')
  catalogUrl.searchParams.append('lat', coordinates.lat.toString())
  catalogUrl.searchParams.append('lon', coordinates.lon.toString())
  catalogUrl.searchParams.append('page_size', '500')

  if (params.min_price !== undefined) {
    catalogUrl.searchParams.append('min_price', params.min_price.toString())
  }
  if (params.max_price !== undefined) {
    catalogUrl.searchParams.append('max_price', params.max_price.toString())
  }

  console.log('Fetching from optimized API:', catalogUrl.toString())

  const catalogResponse = await fetch(catalogUrl.toString())

  console.log(`API request completed in ${Date.now() - startTime}ms`)

  // Обрабатываем товары (API уже отфильтровал по координатам!)
  if (!catalogResponse.ok) {
    throw new Error(`Optimized API error: ${catalogResponse.status}`)
  }

  const catalogData = await catalogResponse.json()
  let products = catalogData.catalog_items || []

  console.log(`Got ${products.length} flowers from optimized API (geo-filtered)`)

  // Добавляем поле images
  products = products.map((product: any) => ({
    ...product,
    images: product.main_image ? [product.main_image] : [],
    detailUrl: `https://mcp.cvetov24.ru/api/v2/catalog_items/${product.guid}`
  }))

  // 5. Фильтрация по preferences (используем composition из ответа API)
  console.log(`Products before preferences filter: ${products.length}`)

  if (params.preferences && params.preferences.trim().length > 0) {
    console.log('Filtering by preferences:', params.preferences)

    const parsedPreferences = await parsePreferences(params.preferences)
    console.log('Parsed preferences:', parsedPreferences)

    if (parsedPreferences.liked.length > 0 || parsedPreferences.disliked.length > 0) {
      const productsBeforeFilter = [...products]

      // Composition уже включён в ответ API — не нужно делать доп. запросы!
      products = products.filter((product: any) => {
        return matchesPreferences(product.composition, parsedPreferences)
      })

      console.log(`After preferences filter: ${products.length} products`)

      // FALLBACK: поиск по названию
      if (products.length < 16) {
        console.log('Not enough products, adding fallback search by name...')

        const productsByName = productsBeforeFilter.filter((product: any) => {
          return matchesPreferencesByName(product.name, parsedPreferences)
        })

        const existingGuids = new Set(products.map((p: any) => p.guid))
        const additionalProducts = productsByName.filter(
          (p: any) => !existingGuids.has(p.guid)
        )

        products = [...products, ...additionalProducts]
        console.log(`Total after fallback: ${products.length} products`)
      }
    }
  }

  // 6. Возвращаем до 16 товаров
  const finalProducts = products.slice(0, 16)

  console.log(`Search completed in ${Date.now() - startTime}ms, returning ${finalProducts.length} products`)

  if (finalProducts.length > 0) {
    console.log('First product:', JSON.stringify({
      guid: finalProducts[0].guid,
      name: finalProducts[0].name,
      shop: finalProducts[0].shop_name,
      hasComposition: !!finalProducts[0].composition
    }))
  }

  return finalProducts
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

// Функция парсинга preferences (предпочтений по цветам) с помощью Claude API
async function parsePreferences(preferences: string): Promise<{
  liked: FlowerPreference[]
  disliked: FlowerPreference[]
}> {
  try {
    const prompt = `Ты - специалист по извлечению предпочтений клиентов цветочного магазина.

Задача: Из текста пользователя извлечь:
1. Названия ЦВЕТОВ (розы, тюльпаны, лилии)
2. ЦВЕТА цветов (белая, красная, персиковая) - ТОЛЬКО если явно упомянуты!

ВАЖНО: Цвет НЕ обязателен!
- "Розы" = любит розы, цвет не важен (показать ВСЕ розы)
- "Белые розы" = любит розы, ИМЕННО белые

Известные цветы: розы, тюльпаны, пионы, хризантемы, гвоздики, лилии, орхидеи, ромашки, герберы, альстромерии, ирисы, фрезии, гиацинты, нарциссы, подсолнухи, эустомы, гортензии, каллы

Известные цвета: белая, красная, розовая, персиковая, желтая, оранжевая, голубая, сиреневая, бордовая, пурпурная, бежевая, кремовая, лиловая

ПРИМЕРЫ:

Текст: "люблю розы"
Ответ: {"liked": [{"flower": "роза"}], "disliked": []}

Текст: "белые розы"
Ответ: {"liked": [{"flower": "роза", "color": "белая"}], "disliked": []}

Текст: "красные и белые розы"
Ответ: {"liked": [{"flower": "роза", "color": "красная"}, {"flower": "роза", "color": "белая"}], "disliked": []}

Текст: "розы, но без гвоздик"
Ответ: {"liked": [{"flower": "роза"}], "disliked": [{"flower": "гвоздика"}]}

Текст: "без красных гвоздик, белые розы"
Ответ: {"liked": [{"flower": "роза", "color": "белая"}], "disliked": [{"flower": "гвоздика", "color": "красная"}]}

Текст: "просто красивый букет"
Ответ: {"liked": [], "disliked": []}

ВАЖНО:
- Возвращай ТОЛЬКО JSON без комментариев
- Используй базовые формы (роза, лилия, тюльпан)
- Если цвет НЕ упомянут = НЕ добавляй поле "color"
- Вопросы о цветах = liked (хочет узнать = интересуется)
- Отрицания (без, не люблю, исключить) = disliked

Текст пользователя: "${preferences}"

JSON ответ:`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    })

    // Извлекаем текст из ответа
    let responseText = ''
    for (const block of message.content) {
      if (block.type === 'text') {
        responseText = block.text
        break
      }
    }

    console.log('Claude API response:', responseText)

    // Парсим JSON из ответа - используем ЖАДНЫЙ квантификатор для вложенных объектов
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('Claude response parsing failed - no JSON found:', responseText)
      return { liked: [], disliked: [] }
    }

    console.log('Extracted JSON string:', jsonMatch[0])

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Failed JSON string:', jsonMatch[0])
      return { liked: [], disliked: [] }
    }

    // Валидация с поддержкой обратной совместимости
    const validateFlowerPreference = (item: any): FlowerPreference | null => {
      if (typeof item === 'string') {
        // Обратная совместимость: старый формат ["розы"]
        return { flower: item }
      }
      if (item && typeof item.flower === 'string') {
        return {
          flower: item.flower,
          color: item.color || undefined
        }
      }
      return null
    }

    return {
      liked: Array.isArray(parsed.liked)
        ? parsed.liked.map(validateFlowerPreference).filter(Boolean) as FlowerPreference[]
        : [],
      disliked: Array.isArray(parsed.disliked)
        ? parsed.disliked.map(validateFlowerPreference).filter(Boolean) as FlowerPreference[]
        : []
    }
  } catch (error) {
    console.error('Error in parsePreferences with Claude:', error)
    // Graceful fallback - возвращаем пустой результат
    return { liked: [], disliked: [] }
  }
}

// Известные названия цветов (в разных формах)
const KNOWN_FLOWERS = [
  'роза', 'розы', 'роз',
  'тюльпан', 'тюльпаны',
  'пион', 'пионы',
  'хризантема', 'хризантемы',
  'гвоздика', 'гвоздики',
  'лилия', 'лилии',
  'орхидея', 'орхидеи',
  'ромашка', 'ромашки',
  'гербера', 'герберы',
  'альстромерия', 'альстромерии',
  'ирис', 'ирисы',
  'фрезия', 'фрезии',
  'гиацинт', 'гиацинты',
  'нарцисс', 'нарциссы',
  'подсолнух', 'подсолнухи',
  'эустома', 'эустомы',
  'гортензия', 'гортензии',
  'калла', 'каллы',
  'ранункулюс', 'ранункулюсы',
  'антуриум', 'антуриумы',
  'диантус',
  'эвкалипт',
  'гипсофила'
]

// Helper: извлечь название цветка из "роза белая" или "французская роза"
function extractFlowerName(text: string): string {
  const textLower = text.toLowerCase()

  // Ищем известное название цветка в тексте
  for (const flower of KNOWN_FLOWERS) {
    if (textLower.includes(flower)) {
      return flower
    }
  }

  // Fallback: первое слово (старое поведение)
  const match = text.match(/^(\S+)/)
  return match ? match[1].toLowerCase() : ''
}

// Helper: извлечь цвет из "роза белая"
function extractFlowerColor(text: string): string {
  const parts = text.split(/\s+/)
  return parts.length > 1 ? parts.slice(1).join(' ') : ''
}

// Helper: нормализация цветка
function normalizeFlower(word: string): string {
  return word
    .replace(/ы$/, '')   // розы → роз
    .replace(/и$/, '')   // лилии → лили
    .replace(/а$/, '')   // роза → роз
    .replace(/я$/, '')   // гортензия → гортензи
}

// Helper: нормализация цвета
function normalizeColor(word: string): string {
  return word
    .replace(/ё/g, 'е')  // ё → е
    .replace(/ый$/, '')  // красный → красн
    .replace(/ая$/, '')  // белая → бел
    .replace(/ой$/, '')  // голубой → голуб
    .replace(/ий$/, '')  // сиреневый → сирене
    .toLowerCase()
}

// Функция проверки товара по preferences
function matchesPreferences(
  composition: any[] | null | undefined,
  preferences: { liked: FlowerPreference[], disliked: FlowerPreference[] }
): boolean {
  if (!composition || composition.length === 0) {
    return false
  }

  // Парсим composition в структурированный формат
  const compositionItems = composition
    .map(item => {
      const name = (item.composition_item?.name || '').toLowerCase()
      return {
        flower: extractFlowerName(name),
        color: extractFlowerColor(name),
        fullName: name
      }
    })
    .filter(item => item.flower.length > 0)

  console.log('Composition items:', compositionItems)
  console.log('Checking preferences:', preferences)

  // ПРАВИЛО 1: Проверка НЕЖЕЛАЕМЫХ (жесткое правило)
  for (const disliked of preferences.disliked) {
    const hasDisliked = compositionItems.some(item => {
      // Проверяем совпадение по названию цветка
      const flowerMatches = normalizeFlower(item.flower).includes(normalizeFlower(disliked.flower))

      if (!flowerMatches) return false

      // Если цвет НЕ указан в disliked → исключить весь цветок
      if (!disliked.color) {
        return true
      }

      // Если цвет указан → исключить только этот цвет
      if (!item.color) return false

      return normalizeColor(item.color).includes(normalizeColor(disliked.color))
    })

    if (hasDisliked) {
      console.log(`Product excluded: contains disliked flower ${disliked.flower}${disliked.color ? ' ' + disliked.color : ''}`)
      return false
    }
  }

  // ПРАВИЛО 2: Проверка ЖЕЛАЕМЫХ (гибкое правило)
  if (preferences.liked.length > 0) {
    const hasLikedFlower = preferences.liked.some(liked => {
      return compositionItems.some(item => {
        // Проверяем совпадение по названию цветка
        const flowerMatches = normalizeFlower(item.flower).includes(normalizeFlower(liked.flower))

        if (!flowerMatches) return false

        // Если цвет НЕ указан в liked → подходит любой цвет
        if (!liked.color) {
          return true
        }

        // Если цвет указан → проверяем точное совпадение
        if (!item.color) return false

        return normalizeColor(item.color).includes(normalizeColor(liked.color))
      })
    })

    if (!hasLikedFlower) {
      console.log('Product excluded: does not contain liked flowers')
      return false
    }
  }

  return true
}

// Функция проверки товара по preferences (поиск по названию)
function matchesPreferencesByName(
  productName: string,
  preferences: { liked: FlowerPreference[], disliked: FlowerPreference[] }
): boolean {
  if (!productName || productName.trim().length === 0) {
    return false
  }

  const nameLower = productName.toLowerCase()

  // ПРАВИЛО 1: Проверка НЕЖЕЛАЕМЫХ (жесткое правило)
  for (const disliked of preferences.disliked) {
    const flowerNormalized = normalizeFlower(disliked.flower)

    // Проверяем, есть ли цветок в названии
    const hasFlower = nameLower.includes(disliked.flower.toLowerCase()) ||
                      nameLower.includes(flowerNormalized)

    if (!hasFlower) continue

    // Если цвет НЕ указан → исключить весь цветок
    if (!disliked.color) {
      console.log(`Product excluded by name: contains disliked flower ${disliked.flower}`)
      return false
    }

    // Если цвет указан → исключить только если есть и цветок, и цвет
    const colorNormalized = normalizeColor(disliked.color)
    const hasColor = nameLower.includes(disliked.color.toLowerCase()) ||
                     nameLower.includes(colorNormalized)

    if (hasColor) {
      console.log(`Product excluded by name: contains disliked ${disliked.flower} ${disliked.color}`)
      return false
    }
  }

  // ПРАВИЛО 2: Проверка ЖЕЛАЕМЫХ (гибкое правило)
  if (preferences.liked.length > 0) {
    const hasLikedFlower = preferences.liked.some(liked => {
      const flowerNormalized = normalizeFlower(liked.flower)

      // Проверяем, есть ли цветок в названии
      // Исключаем ложные срабатывания: "розовый" не должен считаться "розой"
      let hasFlower = nameLower.includes(liked.flower.toLowerCase()) ||
                      nameLower.includes(flowerNormalized)

      // Проверка на ложное срабатывание "розов" (розовый/розовая/розовых)
      if (hasFlower && flowerNormalized === 'роз' && nameLower.includes('розов')) {
        // Проверяем есть ли настоящая роза, а не только "розовый"
        hasFlower = /роз[аыеу]|роз\b/i.test(nameLower)
      }

      if (!hasFlower) return false

      // Если цвет НЕ указан → подходит любой цвет
      if (!liked.color) {
        return true
      }

      // Если цвет указан → проверяем наличие цвета в названии
      const colorNormalized = normalizeColor(liked.color)
      const hasColor = nameLower.includes(liked.color.toLowerCase()) ||
                       nameLower.includes(colorNormalized)

      return hasColor
    })

    if (!hasLikedFlower) {
      return false
    }
  }

  return true
}

// Генерация сообщения об отсутствии товаров
function generateNoProductsMessage(preferences?: string): string {
  // Если есть preferences, то проблема скорее всего в них
  if (preferences && preferences.trim().length > 0) {
    return 'К сожалению, не нашел букетов с такими характеристиками. Попробуйте изменить цвет или цветок, или уберите фильтр.'
  }

  // Если нет preferences, проблема в городе/поводе
  return 'К сожалению, не нашел подходящих букетов в вашем городе. Попробуйте выбрать другой город или повод.'
}

// Генерация персонализированного текста для списка товаров
function generateProductListMessage(count: number, preferences?: string): string {
  const countWord = count === 1 ? 'букет' : count < 5 ? 'букета' : 'букетов'

  // Если нет preferences, возвращаем стандартное сообщение с подсказкой
  if (!preferences || preferences.trim().length === 0) {
    return `Отлично! Я подобрал ${count} ${countWord} для вас. Выберите понравившийся или напишите цвет или цветок для более точной фильтрации.`
  }

  // Парсим preferences для формирования персонализированного текста
  const prefsLower = preferences.toLowerCase()

  // Определяем упомянутые цвета
  const colors: string[] = []
  const colorMap: { [key: string]: string } = {
    'бел': 'белые',
    'красн': 'красные',
    'розов': 'розовые',
    'персиков': 'персиковые',
    'желт': 'желтые',
    'оранжев': 'оранжевые',
    'голуб': 'голубые',
    'сирен': 'сиреневые',
    'бордов': 'бордовые',
    'пурпурн': 'пурпурные',
    'беж': 'бежевые',
    'кремов': 'кремовые',
    'лилов': 'лиловые',
    'фиолетов': 'фиолетовые',
  }

  for (const [key, value] of Object.entries(colorMap)) {
    if (prefsLower.includes(key)) {
      colors.push(value)
    }
  }

  // Определяем упомянутые цветы (творительный падеж для "с розами")
  const flowers: string[] = []
  const flowerMap: { [key: string]: string } = {
    'роз': 'розами',
    'тюльпан': 'тюльпанами',
    'пион': 'пионами',
    'хризантем': 'хризантемами',
    'гвозд': 'гвоздиками',
    'лили': 'лилиями',
    'орхиде': 'орхидеями',
    'ромашк': 'ромашками',
    'гербер': 'герберами',
    'альстромер': 'альстромериями',
    'ирис': 'ирисами',
    'фрез': 'фрезиями',
    'гиацинт': 'гиацинтами',
    'нарцисс': 'нарциссами',
    'подсолнух': 'подсолнухами',
    'эустом': 'эустомами',
    'гортензи': 'гортензиями',
    'калл': 'каллами',
    'анемон': 'анемонами',
    'астр': 'астрами',
    'георгин': 'георгинами',
    'дельфиниум': 'дельфиниумами',
    'левкой': 'левкоями',
    'маргаритк': 'маргаритками',
    'матиол': 'матиолами',
    'незабудк': 'незабудками',
    'одуванчик': 'одуванчиками',
    'петуни': 'петуниями',
    'ранункул': 'ранункулюсами',
    'сирен': 'сиренью',
    'статиц': 'статицей',
    'фиалк': 'фиалками',
    'цикламен': 'цикламенами',
    'мак': 'маками',
    'васильк': 'васильками',
    'вероник': 'верониками',
    'лаванд': 'лавандой',
    'протей': 'протеями',
    'бруни': 'брунией',
    'амарант': 'амарантами',
    'целози': 'целозией',
    'скабиоз': 'скабиозами',
    'эхинац': 'эхинацеями',
    'рудбеки': 'рудбекиями',
    'краспеди': 'краспедией',
    'антуриум': 'антуриумами',
    'гладиолус': 'гладиолусами',
    'агапантус': 'агапантусами',
    'суккулент': 'суккулентами',
    'веточк': 'веточками',
    'зелен': 'зеленью',
    'трав': 'травами',
  }

  for (const [key, value] of Object.entries(flowerMap)) {
    if (prefsLower.includes(key)) {
      flowers.push(value)
    }
  }

  // Формируем сообщение на основе найденных предпочтений
  if (colors.length > 0 && flowers.length > 0) {
    // Есть и цвет, и цветок
    const colorStr = colors.slice(0, 2).join(' и ')
    const flowerStr = flowers.slice(0, 2).join(' и ')
    return `Отлично! Я подобрал ${count} ${countWord} с ${colorStr} ${flowerStr}. Выберите понравившийся!`
  } else if (flowers.length > 0) {
    // Только цветок
    const flowerStr = flowers.slice(0, 2).join(' и ')
    return `Отлично! Я подобрал ${count} ${countWord} с ${flowerStr}. Выберите понравившийся!`
  } else if (colors.length > 0) {
    // Только цвет
    const colorStr = colors.slice(0, 2).join(' и ')
    return `Отлично! Я подобрал ${count} ${colorStr} ${countWord}. Выберите понравившийся!`
  }

  // Fallback - стандартное сообщение
  return `Отлично! Я подобрал ${count} ${countWord} для вас. Выберите понравившийся!`
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

        // ЕСЛИ ВСЕ ПАРАМЕТРЫ СОБРАНЫ - определяем что делать
        if (readyForSearch) {
          const hasQ = hasQuestion(userMessageText, extractedParams)
          const hasParams = hasNewParams(extractedParams)

          console.log('Search mode - hasQuestion:', hasQ, 'hasNewParams:', hasParams)

          try {
            if (!hasQ && !hasParams) {
              // Нет вопроса и нет параметров → спрашиваем что нужно
              console.log('No question and no params - asking what user needs')
              const questionPrompt = getQuestionPrompt(params)
              const claudeResponse = await anthropic.messages.create({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 512,
                messages: anthropicMessages,
                system: questionPrompt,
              })
              assistantMessage = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''
              // products остаётся undefined — товары НЕ показываем

            } else if (hasQ && !hasParams) {
              // Есть вопрос, но нет параметров → только ответ, без товаров
              console.log('Question without params - answering without products')
              const questionPrompt = getQuestionPrompt(params)
              const claudeResponse = await anthropic.messages.create({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 512,
                messages: anthropicMessages,
                system: questionPrompt,
              })
              assistantMessage = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''
              // products остаётся undefined

            } else if (!hasQ && hasParams) {
              // Нет вопроса, есть параметры → только товары
              console.log('Params without question - showing products only')
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
                ? generateProductListMessage(products.length, params.preferences || undefined)
                : generateNoProductsMessage(params.preferences || undefined)

            } else {
              // hasQ && hasParams → ответ + товары
              console.log('Question with params - answering and showing products')
              const questionPrompt = getQuestionPrompt(params)
              const claudeResponse = await anthropic.messages.create({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 512,
                messages: anthropicMessages,
                system: questionPrompt,
              })
              assistantMessage = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''

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
            }
          } catch (error) {
            console.error('Error in search mode:', error)
            assistantMessage = 'Извините, произошла ошибка. Попробуйте еще раз.'
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

// Export Telegram user functions
export { saveTelegramUser, getTelegramStats, sendBroadcast } from './telegram-user'

// Export Telegram bot webhook
export { telegramWebhook } from './telegram-bot'
