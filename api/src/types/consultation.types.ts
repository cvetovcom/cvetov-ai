/**
 * Consultation Mode Types
 * Types for flower consultation based on recipient and occasion
 */

// Recipients types
export type RecipientType =
  | 'wife'        // жена
  | 'mother'      // мама
  | 'daughter'    // дочь
  | 'girlfriend'  // девушка
  | 'colleague'   // коллега
  | 'teacher'     // учитель
  | 'friend'      // подруга
  | 'grandmother' // бабушка
  | 'sister'      // сестра
  | 'boss'        // начальница
  | 'client'      // клиент

// Occasions types
export type OccasionType =
  | 'mothers_day'     // день матери
  | 'birthday'        // день рождения
  | 'anniversary'     // юбилей/годовщина
  | 'march_8'         // 8 марта
  | 'february_14'     // 14 февраля (День влюблённых)
  | 'wedding'         // свадьба
  | 'graduation'      // выпускной
  | 'apology'         // извинения
  | 'no_reason'       // без повода
  | 'new_year'        // новый год
  | 'september_1'     // 1 сентября
  | 'recovery'        // выздоровление
  | 'promotion'       // повышение
  | 'first_date'      // первое свидание
  | 'birth'           // рождение ребёнка

// Recommendation structure
export interface FlowerRecommendation {
  recipientType: RecipientType
  occasionType: OccasionType
  recommendations: {
    flowerTypes: string[]      // Recommended flower types
    colors: string[]           // Recommended colors
    styles: string[]           // Bouquet styles
    searchQueries: string[]    // Pre-built search queries for API
    budgetRange: {
      min: number
      max: number
    }
    description: string        // Personalized advice
    avoidFlowers?: string[]   // Flowers to avoid for this combination
    symbolism?: string        // What this combination symbolizes
  }
}

// Consultation context
export interface ConsultationContext {
  recipient?: RecipientType
  recipientRaw?: string       // Original user input for recipient
  occasion?: OccasionType
  occasionRaw?: string        // Original user input for occasion
  budget?: {
    min: number
    max: number
  }
  preferences?: {
    favoriteFlowers?: string[]
    favoriteColors?: string[]
    allergies?: string[]
  }
  deliveryDate?: string
  specialRequests?: string
  isConsultationMode: boolean // True when no city is set
}

// Labels for display
export const RECIPIENT_LABELS: Record<RecipientType, string> = {
  wife: 'Жене',
  mother: 'Маме',
  daughter: 'Дочери',
  girlfriend: 'Девушке',
  colleague: 'Коллеге',
  teacher: 'Учителю',
  friend: 'Подруге',
  grandmother: 'Бабушке',
  sister: 'Сестре',
  boss: 'Начальнице',
  client: 'Клиенту'
}

export const OCCASION_LABELS: Record<OccasionType, string> = {
  mothers_day: 'День матери',
  birthday: 'День рождения',
  anniversary: 'Годовщина',
  march_8: '8 Марта',
  february_14: '14 февраля',
  wedding: 'Свадьба',
  graduation: 'Выпускной',
  apology: 'Извинения',
  no_reason: 'Без повода',
  new_year: 'Новый год',
  september_1: '1 сентября',
  recovery: 'Выздоровление',
  promotion: 'Повышение',
  first_date: 'Первое свидание',
  birth: 'Рождение ребёнка'
}