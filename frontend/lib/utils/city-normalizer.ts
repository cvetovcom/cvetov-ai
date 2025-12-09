/**
 * Нормализация названий городов к русскому формату
 */

// Словарь для перевода английских названий в русские
const CITY_TRANSLATIONS: Record<string, string> = {
  // Основные города
  'moscow': 'Москва',
  'saint petersburg': 'Санкт-Петербург',
  'st. petersburg': 'Санкт-Петербург',
  'kazan': 'Казань',
  'yekaterinburg': 'Екатеринбург',
  'ekaterinburg': 'Екатеринбург',
  'nizhny novgorod': 'Нижний Новгород',
  'novosibirsk': 'Новосибирск',
  'samara': 'Самара',
  'omsk': 'Омск',
  'chelyabinsk': 'Челябинск',
  'rostov-on-don': 'Ростов-на-Дону',
  'ufa': 'Уфа',
  'krasnoyarsk': 'Красноярск',
  'voronezh': 'Воронеж',
  'perm': 'Пермь',
  'volgograd': 'Волгоград',
  'krasnodar': 'Краснодар',
  'saratov': 'Саратов',
  'tyumen': 'Тюмень',
  'tolyatti': 'Тольятти',
  'izhevsk': 'Ижевск',
  'barnaul': 'Барнаул',
  'irkutsk': 'Иркутск',
  'ulyanovsk': 'Ульяновск',
  'vladivostok': 'Владивосток',
  'yaroslavl': 'Ярославль',
  'khabarovsk': 'Хабаровск',
  'makhachkala': 'Махачкала',
  'orenburg': 'Оренбург',
  'novokuznetsk': 'Новокузнецк',
  'kemerovo': 'Кемерово',
  'ryazan': 'Рязань',
  'tomsk': 'Томск',
  'astrakhan': 'Астрахань',
  'penza': 'Пенза',
  'lipetsk': 'Липецк',
  'tula': 'Тула',
  'kirov': 'Киров',
  'cheboksary': 'Чебоксары',
  'kaliningrad': 'Калининград',
  'bryansk': 'Брянск',
  'kursk': 'Курск',
  'ivanovo': 'Иваново',
  'magnitogorsk': 'Магнитогорск',
  'tver': 'Тверь',
  'stavropol': 'Ставрополь',
  'belgorod': 'Белгород',
  'sochi': 'Сочи',
};

// Словарь вариантов названий (разговорные формы)
const CITY_VARIANTS: Record<string, string> = {
  'питер': 'Санкт-Петербург',
  'спб': 'Санкт-Петербург',
  'петербург': 'Санкт-Петербург',
  'екб': 'Екатеринбург',
  'нижний': 'Нижний Новгород',
  'ростов': 'Ростов-на-Дону',
};

/**
 * Проверяет, содержит ли строка кириллицу
 */
function isCyrillic(text: string): boolean {
  return /[а-яА-ЯёЁ]/.test(text);
}

/**
 * Нормализует название города к русскому формату
 */
export function normalizeCity(cityName: string): string {
  if (!cityName) {
    throw new Error('City name is required');
  }

  const trimmed = cityName.trim();

  // Если уже на кириллице - возвращаем с заглавной буквы
  if (isCyrillic(trimmed)) {
    const lower = trimmed.toLowerCase();

    // Проверяем варианты названий
    if (CITY_VARIANTS[lower]) {
      return CITY_VARIANTS[lower];
    }

    // Возвращаем с заглавной буквы
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // Переводим с английского
  const lower = trimmed.toLowerCase();

  if (CITY_TRANSLATIONS[lower]) {
    return CITY_TRANSLATIONS[lower];
  }

  // Если перевод не найден - возвращаем как есть с заглавной буквы
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
