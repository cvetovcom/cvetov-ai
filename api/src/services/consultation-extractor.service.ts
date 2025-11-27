/**
 * Consultation Extractor Service
 * Extracts recipient and occasion information from user messages
 */

import type { RecipientType, OccasionType, ConsultationContext } from '../types/consultation.types.js'
import { FLOWER_RECOMMENDATIONS } from '../data/flower-recommendations.js'

export class ConsultationExtractor {
  /**
   * Recipient patterns for Russian language
   */
  private static readonly RECIPIENT_PATTERNS: Array<{
    pattern: RegExp
    type: RecipientType
  }> = [
    { pattern: /\b(жене|супруге)\b/i, type: 'wife' },
    { pattern: /\b(маме|матери|мамочке|мамуле)\b/i, type: 'mother' },
    { pattern: /\b(дочери|дочке|доченьке)\b/i, type: 'daughter' },
    { pattern: /\b(девушке|подруге по жизни|любимой)\b/i, type: 'girlfriend' },
    { pattern: /\b(коллеге|сотруднице)\b/i, type: 'colleague' },
    { pattern: /\b(учителю|учительнице|преподавателю)\b/i, type: 'teacher' },
    { pattern: /\b(подруге|подружке)\b/i, type: 'friend' },
    { pattern: /\b(бабушке|бабуле)\b/i, type: 'grandmother' },
    { pattern: /\b(сестре|сестренке)\b/i, type: 'sister' },
    { pattern: /\b(начальнице|начальнику|руководителю|боссу|шефу)\b/i, type: 'boss' },
    { pattern: /\b(клиенту|заказчику)\b/i, type: 'client' }
  ]

  /**
   * Occasion patterns for Russian language
   */
  private static readonly OCCASION_PATTERNS: Array<{
    pattern: RegExp
    type: OccasionType
  }> = [
    { pattern: /\b(день матери|день мамы)\b/i, type: 'mothers_day' },
    { pattern: /\b(день рождения|днюха|др|днем рождения|с днем рождения)\b/i, type: 'birthday' },
    { pattern: /\b(юбилей|годовщина|лет вместе|годовщину)\b/i, type: 'anniversary' },
    { pattern: /\b(8 марта|восьмое марта|международный женский день)\b/i, type: 'march_8' },
    { pattern: /\b(14 февраля|день святого валентина|день влюбленных|день всех влюбленных)\b/i, type: 'february_14' },
    { pattern: /\b(свадьба|свадьбу|на свадьбу|бракосочетание)\b/i, type: 'wedding' },
    { pattern: /\b(выпускной|окончание|выпуск|защита диплома)\b/i, type: 'graduation' },
    { pattern: /\b(извинения|извиниться|прощения|простить|помириться)\b/i, type: 'apology' },
    { pattern: /\b(без повода|просто так|без причины)\b/i, type: 'no_reason' },
    { pattern: /\b(новый год|новогодние|к новому году)\b/i, type: 'new_year' },
    { pattern: /\b(1 сентября|первое сентября|день знаний)\b/i, type: 'september_1' },
    { pattern: /\b(выздоровление|выздоровления|болеет|болела|поправиться|выписка)\b/i, type: 'recovery' },
    { pattern: /\b(повышение|повысили|карьера|новая должность)\b/i, type: 'promotion' },
    { pattern: /\b(первое свидание|первая встреча|познакомились)\b/i, type: 'first_date' },
    { pattern: /\b(рождение|родился|родилась|новорожденный|с новорожденным|малыш)\b/i, type: 'birth' }
  ]

  /**
   * Budget patterns
   */
  private static readonly BUDGET_PATTERNS = [
    { pattern: /до\s*(\d+)\s*(руб|рублей|р|₽)/i, type: 'max' },
    { pattern: /от\s*(\d+)\s*до\s*(\d+)\s*(руб|рублей|р|₽)/i, type: 'range' },
    { pattern: /от\s*(\d+)\s*(руб|рублей|р|₽)/i, type: 'min' },
    { pattern: /(\d+)\s*(руб|рублей|р|₽)/i, type: 'exact' },
    { pattern: /бюджет\s*(\d+)/i, type: 'exact' },
    { pattern: /(недорого|дешево|эконом|бюджетный)/i, type: 'budget' },
    { pattern: /(премиум|люкс|дорогой|vip|элитный)/i, type: 'premium' }
  ]

  /**
   * Extract consultation context from user message
   */
  static extractContext(message: string): Partial<ConsultationContext> {
    const context: Partial<ConsultationContext> = {
      isConsultationMode: true
    }

    // Extract recipient
    const recipient = this.extractRecipient(message)
    if (recipient) {
      context.recipient = recipient.type
      context.recipientRaw = recipient.raw
    }

    // Extract occasion
    const occasion = this.extractOccasion(message)
    if (occasion) {
      context.occasion = occasion.type
      context.occasionRaw = occasion.raw
    }

    // Extract budget
    const budget = this.extractBudget(message)
    if (budget) {
      context.budget = budget
    }

    // Extract preferences
    const preferences = this.extractPreferences(message)
    if (preferences) {
      context.preferences = preferences
    }

    // Extract special requests
    const specialRequests = this.extractSpecialRequests(message)
    if (specialRequests) {
      context.specialRequests = specialRequests
    }

    return context
  }

  /**
   * Extract recipient from message
   */
  private static extractRecipient(message: string): { type: RecipientType; raw: string } | null {
    for (const { pattern, type } of this.RECIPIENT_PATTERNS) {
      const match = message.match(pattern)
      if (match) {
        return { type, raw: match[0] }
      }
    }
    return null
  }

  /**
   * Extract occasion from message
   */
  private static extractOccasion(message: string): { type: OccasionType; raw: string } | null {
    for (const { pattern, type } of this.OCCASION_PATTERNS) {
      const match = message.match(pattern)
      if (match) {
        return { type, raw: match[0] }
      }
    }
    return null
  }

  /**
   * Extract budget from message
   */
  private static extractBudget(message: string): { min: number; max: number } | null {
    // Range: от X до Y
    const rangeMatch = message.match(/от\s*(\d+)\s*до\s*(\d+)/i)
    if (rangeMatch) {
      return {
        min: parseInt(rangeMatch[1]),
        max: parseInt(rangeMatch[2])
      }
    }

    // Max: до X
    const maxMatch = message.match(/до\s*(\d+)\s*(руб|рублей|р|₽)/i)
    if (maxMatch) {
      return {
        min: 0,
        max: parseInt(maxMatch[1])
      }
    }

    // Min: от X
    const minMatch = message.match(/от\s*(\d+)\s*(руб|рублей|р|₽)/i)
    if (minMatch) {
      return {
        min: parseInt(minMatch[1]),
        max: parseInt(minMatch[1]) * 3 // Assume max is 3x min
      }
    }

    // Exact amount
    const exactMatch = message.match(/(\d+)\s*(руб|рублей|р|₽)/i)
    if (exactMatch) {
      const amount = parseInt(exactMatch[1])
      return {
        min: amount * 0.8,
        max: amount * 1.2
      }
    }

    // Budget keywords
    if (/недорого|дешево|эконом|бюджетный/i.test(message)) {
      return { min: 1000, max: 3000 }
    }

    if (/премиум|люкс|дорогой|vip|элитный/i.test(message)) {
      return { min: 7000, max: 20000 }
    }

    return null
  }

  /**
   * Extract preferences from message
   */
  private static extractPreferences(message: string): ConsultationContext['preferences'] | null {
    const preferences: ConsultationContext['preferences'] = {}

    // Extract favorite flowers
    const flowerTypes = [
      'розы', 'тюльпаны', 'пионы', 'лилии', 'хризантемы', 'гортензии',
      'орхидеи', 'герберы', 'ирисы', 'альстромерии', 'эустомы', 'ранункулюсы'
    ]
    const favoriteFlowers: string[] = []
    for (const flower of flowerTypes) {
      if (new RegExp(`\\b${flower}\\b`, 'i').test(message)) {
        favoriteFlowers.push(flower)
      }
    }
    if (favoriteFlowers.length > 0) {
      preferences.favoriteFlowers = favoriteFlowers
    }

    // Extract favorite colors
    const colors = [
      'красный', 'розовый', 'белый', 'желтый', 'оранжевый', 'фиолетовый',
      'синий', 'голубой', 'персиковый', 'бордовый', 'сиреневый', 'кремовый'
    ]
    const favoriteColors: string[] = []
    for (const color of colors) {
      if (new RegExp(`\\b${color}\\b`, 'i').test(message)) {
        favoriteColors.push(color)
      }
    }
    if (favoriteColors.length > 0) {
      preferences.favoriteColors = favoriteColors
    }

    // Extract allergies
    if (/аллергия|не переносит|нельзя/i.test(message)) {
      const allergyMatch = message.match(/аллергия на (\w+)|не переносит (\w+)|нельзя (\w+)/i)
      if (allergyMatch) {
        preferences.allergies = [allergyMatch[1] || allergyMatch[2] || allergyMatch[3]]
      }
    }

    return Object.keys(preferences).length > 0 ? preferences : null
  }

  /**
   * Extract special requests
   */
  private static extractSpecialRequests(message: string): string | null {
    const specialKeywords = [
      /с\s*запиской/i,
      /с\s*открыткой/i,
      /доставка\s*(утром|вечером|днем|ночью)/i,
      /сюрприз/i,
      /тайно/i,
      /анонимно/i
    ]

    for (const pattern of specialKeywords) {
      const match = message.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return null
  }

  /**
   * Get recommendations based on recipient and occasion
   */
  static getRecommendations(recipient?: RecipientType, occasion?: OccasionType) {
    if (!recipient || !occasion) {
      return null
    }

    return FLOWER_RECOMMENDATIONS.find(
      rec => rec.recipientType === recipient && rec.occasionType === occasion
    )
  }

  /**
   * Generate consultation questions based on missing information
   */
  static generateQuestions(context: Partial<ConsultationContext>): string[] {
    const questions: string[] = []

    if (!context.recipient) {
      questions.push('Для кого вы хотите выбрать букет? (жене, маме, дочери, подруге и т.д.)')
    }

    if (!context.occasion) {
      questions.push('По какому поводу планируете дарить цветы? (день рождения, 8 марта, без повода и т.д.)')
    }

    if (!context.budget) {
      questions.push('Какой у вас примерный бюджет на букет?')
    }

    return questions
  }

  /**
   * Check if we have enough information to provide recommendations
   */
  static hasEnoughInfo(context: Partial<ConsultationContext>): boolean {
    return !!(context.recipient && context.occasion)
  }
}