/**
 * City coordinates database
 * Temporary solution until we have a proper geocoding service
 */

export interface CityCoordinates {
  name: string
  slug: string
  latitude: number
  longitude: number
}

export const CITY_COORDINATES: CityCoordinates[] = [
  // Республика Башкортостан
  { name: 'Нефтекамск', slug: 'neftekamsk', latitude: 56.0885, longitude: 54.2485 },
  { name: 'Уфа', slug: 'ufa', latitude: 54.7388, longitude: 55.9721 },
  { name: 'Стерлитамак', slug: 'sterlitamak', latitude: 53.6246, longitude: 55.9500 },
  { name: 'Салават', slug: 'salavat', latitude: 53.3616, longitude: 55.9247 },
  { name: 'Октябрьский', slug: 'oktyabrskiy', latitude: 54.4815, longitude: 53.4710 },

  // Major cities
  { name: 'Москва', slug: 'moskva', latitude: 55.7558, longitude: 37.6173 },
  { name: 'Санкт-Петербург', slug: 'sankt-peterburg', latitude: 59.9311, longitude: 30.3609 },
  { name: 'Екатеринбург', slug: 'ekaterinburg', latitude: 56.8389, longitude: 60.6057 },
  { name: 'Новосибирск', slug: 'novosibirsk', latitude: 55.0084, longitude: 82.9357 },
  { name: 'Нижний Новгород', slug: 'nizhniy-novgorod', latitude: 56.2965, longitude: 43.9361 },
  { name: 'Казань', slug: 'kazan', latitude: 55.8304, longitude: 49.0661 },
  { name: 'Челябинск', slug: 'chelyabinsk', latitude: 55.1644, longitude: 61.4368 },
  { name: 'Омск', slug: 'omsk', latitude: 54.9885, longitude: 73.3242 },
  { name: 'Самара', slug: 'samara', latitude: 53.2415, longitude: 50.2212 },
  { name: 'Ростов-на-Дону', slug: 'rostov-na-donu', latitude: 47.2357, longitude: 39.7015 },
  { name: 'Красноярск', slug: 'krasnoyarsk', latitude: 56.0153, longitude: 92.8932 },
  { name: 'Пермь', slug: 'perm', latitude: 58.0092, longitude: 56.2270 },
  { name: 'Воронеж', slug: 'voronezh', latitude: 51.6720, longitude: 39.1843 },
  { name: 'Волгоград', slug: 'volgograd', latitude: 48.7194, longitude: 44.5018 },
  { name: 'Краснодар', slug: 'krasnodar', latitude: 45.0355, longitude: 38.9753 },
]

/**
 * Get coordinates for a city by name or slug
 */
export function getCityCoordinates(cityNameOrSlug: string): CityCoordinates | undefined {
  const search = cityNameOrSlug.toLowerCase()

  return CITY_COORDINATES.find(city =>
    city.name.toLowerCase() === search ||
    city.slug.toLowerCase() === search
  )
}

/**
 * Get coordinates by city name (case insensitive)
 */
export function getCityCoordinatesByName(cityName: string): CityCoordinates | undefined {
  const search = cityName.toLowerCase()
  return CITY_COORDINATES.find(city => city.name.toLowerCase() === search)
}

/**
 * Get coordinates by city slug
 */
export function getCityCoordinatesBySlug(slug: string): CityCoordinates | undefined {
  return CITY_COORDINATES.find(city => city.slug === slug.toLowerCase())
}