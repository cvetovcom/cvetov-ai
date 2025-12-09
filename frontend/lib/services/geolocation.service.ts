import { normalizeCity } from '../utils/city-normalizer';

const GEOLOCATION_TIMEOUT = 10000; // 10 секунд
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const IP_API_URL = 'http://ip-api.com/json/?lang=ru&fields=city';

/**
 * Определяет город пользователя с использованием Browser API и IP fallback
 */
export async function detectUserCity(): Promise<string> {
  try {
    // Попытка 1: Browser Geolocation API
    const coords = await getBrowserLocation();
    const city = await reverseGeocode(coords.lat, coords.lon);
    return normalizeCity(city);
  } catch (browserError) {
    console.warn('Browser geolocation failed, falling back to IP:', browserError);

    // Попытка 2: IP Geolocation
    try {
      const city = await getCityByIP();
      return normalizeCity(city);
    } catch (ipError) {
      console.error('IP geolocation also failed:', ipError);
      throw new Error('Не удалось определить местоположение');
    }
  }
}

/**
 * Получить координаты через Browser Geolocation API
 */
async function getBrowserLocation(): Promise<{ lat: number; lon: number }> {
  if (!navigator.geolocation) {
    throw new Error('BROWSER_NOT_SUPPORTED');
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('TIMEOUT'));
    }, GEOLOCATION_TIMEOUT);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        if (error.code === 1) reject(new Error('PERMISSION_DENIED'));
        else if (error.code === 2) reject(new Error('POSITION_UNAVAILABLE'));
        else reject(new Error('TIMEOUT'));
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT,
        maximumAge: 300000, // 5 минут кэш
      }
    );
  });
}

/**
 * Конвертировать координаты в название города (Nominatim)
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&accept-language=ru`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CvetovAI/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('GEOCODING_FAILED');
  }

  const data = await response.json();

  // Nominatim возвращает город в разных полях
  const city = data.address?.city
    || data.address?.town
    || data.address?.village
    || data.address?.municipality;

  if (!city) {
    throw new Error('CITY_NOT_FOUND');
  }

  return city;
}

/**
 * Получить город по IP адресу
 */
async function getCityByIP(): Promise<string> {
  const response = await fetch(IP_API_URL);

  if (!response.ok) {
    throw new Error('IP_SERVICE_UNAVAILABLE');
  }

  const data = await response.json();

  if (!data.city) {
    throw new Error('CITY_NOT_FOUND');
  }

  return data.city;
}
