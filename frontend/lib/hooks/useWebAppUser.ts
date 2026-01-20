import { useEffect, useState, useCallback } from 'react'

/**
 * Универсальный пользователь из WebApp (Telegram или MAX)
 */
export interface WebAppUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export type Platform = 'telegram' | 'max' | 'web'

interface TelegramContactResponse {
  responseUnsafe?: {
    contact?: {
      phone_number: string
      first_name: string
      last_name?: string
      user_id: number
    }
    auth_date?: string
    hash?: string
  }
  status: 'sent' | 'cancelled'
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: WebAppUser
    auth_date?: number
    hash?: string
  }
  ready: () => void
  expand: () => void
  close: () => void
  openTelegramLink: (url: string) => void
  openLink: (url: string) => void
  requestContact: (callback: (sent: boolean, response?: TelegramContactResponse) => void) => void
}

interface MaxWebApp {
  initData: string
  initDataUnsafe: {
    user?: WebAppUser
    auth_date?: number
    hash?: string
    query_id?: string
  }
  platform: string
  version: string
  ready: () => void
  close: () => void
  requestContact: () => Promise<{ phone: string }>
  shareContent: (params: { text: string; link: string }) => void
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
    WebApp?: MaxWebApp
  }
}

/**
 * Универсальный хук для работы с WebApp пользователями
 * Поддерживает Telegram и MAX
 */
export function useWebAppUser() {
  const [user, setUser] = useState<WebAppUser | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('web')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Отправка данных пользователя на сервер
   */
  const sendUserData = useCallback(async (webAppUser: WebAppUser, userPlatform: Platform, userPhone?: string) => {
    try {
      const endpoint = userPlatform === 'telegram'
        ? 'https://europe-west1-cvetov-ai.cloudfunctions.net/saveTelegramUser'
        : 'https://europe-west1-cvetov-ai.cloudfunctions.net/saveMaxUser'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: webAppUser,
          phone: userPhone,
          platform: userPlatform,
          initData: userPlatform === 'telegram'
            ? window.Telegram?.WebApp?.initDataUnsafe
            : window.WebApp?.initDataUnsafe,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[${userPlatform}] User data saved:`, data)
    } catch (err) {
      console.error(`Failed to save ${userPlatform} user data:`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  /**
   * Запросить номер телефона (MAX и Telegram)
   */
  const requestPhone = useCallback(async (): Promise<string | null> => {
    if (platform === 'web') {
      console.warn('requestContact недоступен в браузере')
      return null
    }

    try {
      if (platform === 'max') {
        // MAX — прямой запрос
        const result = await window.WebApp?.requestContact()
        if (result?.phone) {
          setPhone(result.phone)
          if (user) {
            await sendUserData(user, 'max', result.phone)
          }
          return result.phone
        }
      } else if (platform === 'telegram') {
        // Telegram — через callback
        return new Promise((resolve) => {
          window.Telegram?.WebApp?.requestContact((sent, response) => {
            if (sent && response?.responseUnsafe?.contact?.phone_number) {
              const phoneNumber = response.responseUnsafe.contact.phone_number
              setPhone(phoneNumber)
              if (user) {
                sendUserData(user, 'telegram', phoneNumber)
              }
              resolve(phoneNumber)
            } else {
              console.log('Пользователь отказал в доступе к телефону')
              resolve(null)
            }
          })
        })
      }
      return null
    } catch (err) {
      console.error('Ошибка запроса телефона:', err)
      return null
    }
  }, [platform, user, sendUserData])

  /**
   * Универсальный шеринг контента
   * Работает на всех платформах: MAX, Telegram, Web
   */
  const shareContent = useCallback(async (text: string, url: string): Promise<boolean> => {
    try {
      if (platform === 'max') {
        // MAX — нативный шеринг
        window.WebApp?.shareContent({ text, link: url })
        return true
      } else if (platform === 'telegram') {
        // Telegram — через share link
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        window.Telegram?.WebApp?.openTelegramLink(shareUrl)
        return true
      } else {
        // Web — Web Share API (если поддерживается)
        if (navigator.share) {
          await navigator.share({ title: text, text, url })
          return true
        } else {
          // Fallback — копировать в буфер
          await navigator.clipboard.writeText(`${text}\n${url}`)
          return true
        }
      }
    } catch (err) {
      console.error('Share error:', err)
      // Fallback — копировать в буфер
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        return true
      } catch {
        return false
      }
    }
  }, [platform])

  useEffect(() => {
    // Определяем платформу и получаем данные пользователя

    // Проверяем Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      console.log('[WebApp] Detected Telegram platform')
      setPlatform('telegram')

      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()

      const telegramUser = tg.initDataUnsafe.user
      if (telegramUser) {
        setUser(telegramUser)
        sendUserData(telegramUser, 'telegram')
      }

      setIsLoading(false)
      return
    }

    // Проверяем MAX
    if (typeof window !== 'undefined' && window.WebApp?.initDataUnsafe?.user) {
      console.log('[WebApp] Detected MAX platform')
      setPlatform('max')

      window.WebApp.ready()

      const maxUser = window.WebApp.initDataUnsafe.user
      if (maxUser) {
        setUser(maxUser)
        sendUserData(maxUser, 'max')
      }

      setIsLoading(false)
      return
    }

    // Обычный браузер
    console.log('[WebApp] Running in regular browser')
    setPlatform('web')
    setIsLoading(false)
  }, [sendUserData])

  return {
    user,
    phone,
    platform,
    isLoading,
    error,
    requestPhone,
    shareContent,
    isTelegram: platform === 'telegram',
    isMax: platform === 'max',
    isWebApp: platform !== 'web',
  }
}
