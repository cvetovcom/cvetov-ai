/**
 * Flower Recommendations Database
 * Predefined recommendations based on recipient and occasion combinations
 */

import type { FlowerRecommendation } from '../types/consultation.types.js'

export const FLOWER_RECOMMENDATIONS: FlowerRecommendation[] = [
  // ========== WIFE (ЖЕНА) COMBINATIONS ==========
  {
    recipientType: 'wife',
    occasionType: 'anniversary',
    recommendations: {
      flowerTypes: ['розы', 'пионы', 'орхидеи', 'каллы'],
      colors: ['красный', 'бордовый', 'розовый', 'белый'],
      styles: ['классический букет', 'композиция в коробке', 'букет-комплимент', 'каскадный букет'],
      searchQueries: ['розы красные премиум', 'букет годовщина', 'пионы в коробке', 'орхидеи белые'],
      budgetRange: { min: 4000, max: 15000 },
      description: 'Для годовщины с любимой женой идеально подойдут классические красные розы — символ страсти и любви, или нежные пионы — олицетворение счастья в браке. Орхидеи подчеркнут изысканность момента.',
      symbolism: 'Красные розы — страсть, пионы — счастливый брак, орхидеи — восхищение'
    }
  },
  {
    recipientType: 'wife',
    occasionType: 'mothers_day',
    recommendations: {
      flowerTypes: ['тюльпаны', 'розы', 'лилии', 'гортензии', 'ранункулюсы'],
      colors: ['розовый', 'персиковый', 'белый', 'сиреневый', 'кремовый'],
      styles: ['нежный букет', 'корзина цветов', 'композиция', 'букет в шляпной коробке'],
      searchQueries: ['букет день матери', 'тюльпаны нежные', 'гортензии букет', 'розы персиковые'],
      budgetRange: { min: 3000, max: 8000 },
      description: 'Жене на День матери подойдут нежные и элегантные букеты в пастельных тонах. Тюльпаны символизируют материнскую любовь, а гортензии — благодарность за заботу о семье.',
      symbolism: 'Тюльпаны — материнская нежность, гортензии — благодарность'
    }
  },
  {
    recipientType: 'wife',
    occasionType: 'birthday',
    recommendations: {
      flowerTypes: ['розы', 'пионы', 'эустома', 'фрезии'],
      colors: ['любимый цвет', 'микс', 'яркие оттенки'],
      styles: ['авторский букет', 'композиция с декором', 'букет-сюрприз'],
      searchQueries: ['букет день рождения премиум', 'авторский букет', 'розы микс'],
      budgetRange: { min: 3500, max: 10000 },
      description: 'На день рождения жены выберите букет в её любимых цветах или яркую композицию-сюрприз. Добавьте личную открытку с тёплыми словами.',
    }
  },
  {
    recipientType: 'wife',
    occasionType: 'apology',
    recommendations: {
      flowerTypes: ['белые розы', 'лилии', 'орхидеи', 'пионы'],
      colors: ['белый', 'кремовый', 'светло-розовый'],
      styles: ['элегантный букет', '101 роза', 'композиция в коробке'],
      searchQueries: ['белые розы', 'букет извинения', '101 роза белая', 'орхидеи в коробке'],
      budgetRange: { min: 4000, max: 20000 },
      description: 'Для искренних извинений подойдут белые розы — символ чистоты намерений. Количество важно: чем серьёзнее ситуация, тем больше должен быть букет.',
      symbolism: 'Белые розы — искренность, чистота намерений'
    }
  },

  // ========== MOTHER (МАМА) COMBINATIONS ==========
  {
    recipientType: 'mother',
    occasionType: 'mothers_day',
    recommendations: {
      flowerTypes: ['тюльпаны', 'розы', 'хризантемы', 'герберы', 'нарциссы'],
      colors: ['розовый', 'белый', 'жёлтый', 'персиковый', 'лавандовый'],
      styles: ['классический букет', 'корзина', 'композиция в вазе'],
      searchQueries: ['букет маме', 'тюльпаны день матери', 'корзина цветов маме', 'хризантемы букет'],
      budgetRange: { min: 2500, max: 7000 },
      description: 'Маме на её праздник лучше всего подарить нежные тюльпаны или классические розы светлых оттенков. Корзина цветов станет практичным и красивым подарком.',
      symbolism: 'Розовые тюльпаны — материнская любовь, хризантемы — долголетие'
    }
  },
  {
    recipientType: 'mother',
    occasionType: 'birthday',
    recommendations: {
      flowerTypes: ['розы', 'лилии', 'герберы', 'альстромерии'],
      colors: ['любимый цвет мамы', 'пастельные', 'яркие'],
      styles: ['праздничный букет', 'композиция с фруктами', 'корзина'],
      searchQueries: ['букет маме день рождения', 'розы для мамы', 'праздничная композиция'],
      budgetRange: { min: 3000, max: 8000 },
      description: 'На день рождения мамы выберите её любимые цветы или яркий праздничный букет. Герберы подарят радость, а розы выразят любовь и уважение.',
    }
  },
  {
    recipientType: 'mother',
    occasionType: 'march_8',
    recommendations: {
      flowerTypes: ['тюльпаны', 'мимоза', 'нарциссы', 'гиацинты'],
      colors: ['жёлтый', 'розовый', 'белый', 'фиолетовый'],
      styles: ['весенний букет', 'корзинка', 'композиция'],
      searchQueries: ['тюльпаны 8 марта', 'весенний букет', 'мимоза букет'],
      budgetRange: { min: 2000, max: 5000 },
      description: 'На 8 марта традиционно дарят весенние цветы — тюльпаны, мимозу, нарциссы. Это символы пробуждения природы и женской красоты.',
      symbolism: 'Тюльпаны — весна и обновление, мимоза — нежность'
    }
  },

  // ========== DAUGHTER (ДОЧЬ) COMBINATIONS ==========
  {
    recipientType: 'daughter',
    occasionType: 'birthday',
    recommendations: {
      flowerTypes: ['розы', 'пионы', 'ромашки', 'эустома', 'гипсофила'],
      colors: ['розовый', 'белый', 'персиковый', 'лавандовый'],
      styles: ['нежный букет', 'композиция с игрушкой', 'букет в коробке'],
      searchQueries: ['букет дочке', 'нежные розы', 'букет с мишкой', 'розовые пионы'],
      budgetRange: { min: 2000, max: 5000 },
      description: 'Дочери на день рождения подойдут нежные букеты в розовых тонах. Можно добавить милую игрушку или воздушные шары.',
      symbolism: 'Розовые розы — юность и нежность'
    }
  },
  {
    recipientType: 'daughter',
    occasionType: 'graduation',
    recommendations: {
      flowerTypes: ['розы', 'герберы', 'ирисы', 'лилии'],
      colors: ['яркие', 'микс', 'радужные'],
      styles: ['яркий букет', 'композиция с лентами', 'каскадный букет'],
      searchQueries: ['букет на выпускной', 'яркие герберы', 'букет выпускнице'],
      budgetRange: { min: 2500, max: 6000 },
      description: 'На выпускной дочери подарите яркий, запоминающийся букет. Герберы символизируют успех, а ирисы — мудрость.',
      symbolism: 'Герберы — радость и успех, ирисы — мудрость и знания'
    }
  },

  // ========== GIRLFRIEND (ДЕВУШКА) COMBINATIONS ==========
  {
    recipientType: 'girlfriend',
    occasionType: 'first_date',
    recommendations: {
      flowerTypes: ['розы', 'тюльпаны', 'пионы', 'фрезии'],
      colors: ['розовый', 'белый', 'персиковый'],
      styles: ['элегантный букет', 'моно-букет', 'букет-комплимент'],
      searchQueries: ['букет на свидание', 'нежные розы', '7 роз', '9 тюльпанов'],
      budgetRange: { min: 1500, max: 3500 },
      description: 'На первое свидание выберите нежный, не слишком большой букет. 7-9 роз или тюльпанов будут идеальным выбором.',
      symbolism: 'Розовые розы — симпатия, белые — восхищение',
      avoidFlowers: ['красные розы'] // Слишком рано для страстных признаний
    }
  },
  {
    recipientType: 'girlfriend',
    occasionType: 'february_14',
    recommendations: {
      flowerTypes: ['красные розы', 'тюльпаны', 'орхидеи'],
      colors: ['красный', 'розовый', 'белый'],
      styles: ['сердце из роз', 'композиция в коробке', 'классический букет'],
      searchQueries: ['розы валентин', 'сердце из роз', 'букет 14 февраля'],
      budgetRange: { min: 3000, max: 10000 },
      description: 'На День влюблённых традиционно дарят красные розы. Композиция в форме сердца или в красивой коробке подчеркнёт романтичность момента.',
      symbolism: 'Красные розы — страстная любовь'
    }
  },
  {
    recipientType: 'girlfriend',
    occasionType: 'apology',
    recommendations: {
      flowerTypes: ['белые розы', 'лилии', 'орхидеи'],
      colors: ['белый', 'кремовый', 'светло-розовый'],
      styles: ['элегантный букет', 'композиция в коробке', '51 роза'],
      searchQueries: ['белые розы', 'букет извинения', '51 роза'],
      budgetRange: { min: 3000, max: 15000 },
      description: 'Для извинений перед девушкой выберите белые розы или лилии. Размер букета должен соответствовать серьёзности ситуации.',
      symbolism: 'Белые цветы — искренность намерений'
    }
  },

  // ========== COLLEAGUE (КОЛЛЕГА) COMBINATIONS ==========
  {
    recipientType: 'colleague',
    occasionType: 'birthday',
    recommendations: {
      flowerTypes: ['герберы', 'альстромерии', 'ирисы', 'тюльпаны', 'хризантемы'],
      colors: ['жёлтый', 'оранжевый', 'фиолетовый', 'микс'],
      styles: ['яркий букет', 'букет в крафте', 'композиция'],
      searchQueries: ['букет коллеге', 'герберы яркие', 'букет день рождения офис'],
      budgetRange: { min: 1500, max: 3500 },
      description: 'Коллеге подойдёт яркий, но сдержанный букет без романтического подтекста. Герберы и альстромерии — отличный выбор для деловых отношений.',
      avoidFlowers: ['красные розы', 'пионы'] // Слишком личные для коллеги
    }
  },
  {
    recipientType: 'colleague',
    occasionType: 'march_8',
    recommendations: {
      flowerTypes: ['тюльпаны', 'герберы', 'ирисы', 'нарциссы'],
      colors: ['жёлтый', 'оранжевый', 'белый', 'микс'],
      styles: ['весенний букет', 'букет в крафте', 'мини-букет'],
      searchQueries: ['букет коллеге 8 марта', 'тюльпаны офис', 'корпоративный букет'],
      budgetRange: { min: 1000, max: 2500 },
      description: 'На 8 марта коллегам дарят небольшие весенние букеты. Тюльпаны или герберы в ярких цветах создадут праздничное настроение в офисе.',
    }
  },
  {
    recipientType: 'colleague',
    occasionType: 'promotion',
    recommendations: {
      flowerTypes: ['орхидеи', 'лилии', 'розы', 'антуриумы'],
      colors: ['белый', 'жёлтый', 'оранжевый'],
      styles: ['стильная композиция', 'букет в вазе', 'экзотический букет'],
      searchQueries: ['букет на повышение', 'орхидеи белые', 'деловой букет'],
      budgetRange: { min: 2500, max: 5000 },
      description: 'На повышение коллеге подойдут стильные цветы — орхидеи или лилии. Они символизируют успех и процветание.',
      symbolism: 'Орхидеи — успех, жёлтые цветы — карьерный рост'
    }
  },

  // ========== TEACHER (УЧИТЕЛЬ) COMBINATIONS ==========
  {
    recipientType: 'teacher',
    occasionType: 'september_1',
    recommendations: {
      flowerTypes: ['георгины', 'астры', 'гладиолусы', 'розы', 'хризантемы'],
      colors: ['яркие', 'осенние', 'жёлтый', 'оранжевый', 'бордовый'],
      styles: ['осенний букет', 'классический букет', 'композиция'],
      searchQueries: ['букет учителю', 'букет 1 сентября', 'осенние цветы'],
      budgetRange: { min: 1500, max: 3000 },
      description: 'На 1 сентября учителю традиционно дарят осенние цветы — георгины, астры, гладиолусы. Яркие цвета создадут праздничное настроение.',
      symbolism: 'Осенние цветы — начало учебного года'
    }
  },
  {
    recipientType: 'teacher',
    occasionType: 'graduation',
    recommendations: {
      flowerTypes: ['розы', 'лилии', 'герберы', 'орхидеи'],
      colors: ['красный', 'розовый', 'белый'],
      styles: ['торжественный букет', 'корзина', 'композиция'],
      searchQueries: ['букет учителю выпускной', 'розы учителю', 'благодарность букет'],
      budgetRange: { min: 2500, max: 5000 },
      description: 'На выпускной учителю дарят торжественные букеты в знак благодарности. Розы и лилии выразят уважение и признательность.',
      symbolism: 'Розы — уважение и благодарность'
    }
  },

  // ========== GRANDMOTHER (БАБУШКА) COMBINATIONS ==========
  {
    recipientType: 'grandmother',
    occasionType: 'birthday',
    recommendations: {
      flowerTypes: ['розы', 'хризантемы', 'георгины', 'пионы'],
      colors: ['розовый', 'персиковый', 'белый', 'жёлтый'],
      styles: ['классический букет', 'корзина', 'композиция в вазе'],
      searchQueries: ['букет бабушке', 'розы нежные', 'корзина цветов'],
      budgetRange: { min: 2000, max: 5000 },
      description: 'Бабушке на день рождения подойдут классические цветы в нежных тонах. Корзина будет практичным вариантом.',
      symbolism: 'Хризантемы — долголетие, розы — любовь'
    }
  },
  {
    recipientType: 'grandmother',
    occasionType: 'march_8',
    recommendations: {
      flowerTypes: ['тюльпаны', 'нарциссы', 'гиацинты', 'примулы'],
      colors: ['розовый', 'жёлтый', 'белый', 'сиреневый'],
      styles: ['весенний букет', 'корзинка', 'горшечные цветы'],
      searchQueries: ['букет бабушке 8 марта', 'весенние цветы', 'тюльпаны нежные'],
      budgetRange: { min: 1500, max: 3500 },
      description: 'На 8 марта бабушке подарите весенние цветы или горшечное растение, которое будет радовать долго.',
    }
  },

  // ========== SISTER (СЕСТРА) COMBINATIONS ==========
  {
    recipientType: 'sister',
    occasionType: 'birthday',
    recommendations: {
      flowerTypes: ['розы', 'пионы', 'герберы', 'эустома'],
      colors: ['любимый цвет', 'яркие', 'микс'],
      styles: ['модный букет', 'композиция с декором', 'букет в коробке'],
      searchQueries: ['букет сестре', 'модный букет', 'яркие цветы'],
      budgetRange: { min: 2000, max: 5000 },
      description: 'Сестре на день рождения выберите модный букет в её любимых цветах или яркую необычную композицию.',
    }
  },

  // ========== FRIEND (ПОДРУГА) COMBINATIONS ==========
  {
    recipientType: 'friend',
    occasionType: 'birthday',
    recommendations: {
      flowerTypes: ['герберы', 'розы', 'ирисы', 'альстромерии'],
      colors: ['яркие', 'микс', 'любимый цвет'],
      styles: ['яркий букет', 'букет-сюрприз', 'необычная композиция'],
      searchQueries: ['букет подруге', 'яркие герберы', 'букет день рождения'],
      budgetRange: { min: 1500, max: 4000 },
      description: 'Подруге на день рождения подарите яркий, позитивный букет. Герберы и яркие розы поднимут настроение.',
    }
  },

  // ========== UNIVERSAL NO_REASON (БЕЗ ПОВОДА) ==========
  {
    recipientType: 'wife',
    occasionType: 'no_reason',
    recommendations: {
      flowerTypes: ['розы', 'пионы', 'тюльпаны', 'фрезии'],
      colors: ['любимые', 'нежные', 'пастельные'],
      styles: ['букет-сюрприз', 'моно-букет', 'композиция'],
      searchQueries: ['букет сюрприз', 'розы без повода', 'нежный букет'],
      budgetRange: { min: 2000, max: 5000 },
      description: 'Цветы без повода — лучший способ показать свою любовь. Выберите любимые цветы жены или сделайте сюрприз.',
      symbolism: 'Спонтанный подарок — истинная любовь'
    }
  },
  {
    recipientType: 'mother',
    occasionType: 'no_reason',
    recommendations: {
      flowerTypes: ['розы', 'хризантемы', 'герберы', 'альстромерии'],
      colors: ['розовый', 'персиковый', 'жёлтый'],
      styles: ['нежный букет', 'корзинка', 'композиция'],
      searchQueries: ['букет маме', 'розы для мамы', 'нежные цветы'],
      budgetRange: { min: 1500, max: 3500 },
      description: 'Порадуйте маму цветами просто так. Это покажет вашу любовь и заботу.',
    }
  }
]

/**
 * Get recommendations for a specific recipient and occasion
 */
export function getRecommendation(
  recipient?: string,
  occasion?: string
): FlowerRecommendation | undefined {
  return FLOWER_RECOMMENDATIONS.find(
    rec => rec.recipientType === recipient && rec.occasionType === occasion
  )
}

/**
 * Get all recommendations for a specific recipient
 */
export function getRecipientRecommendations(
  recipient: string
): FlowerRecommendation[] {
  return FLOWER_RECOMMENDATIONS.filter(
    rec => rec.recipientType === recipient
  )
}

/**
 * Get all recommendations for a specific occasion
 */
export function getOccasionRecommendations(
  occasion: string
): FlowerRecommendation[] {
  return FLOWER_RECOMMENDATIONS.filter(
    rec => rec.occasionType === occasion
  )
}