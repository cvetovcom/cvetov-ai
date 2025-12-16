import { useEffect, useState } from 'react'

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    auth_date?: number
    hash?: string
  }
  ready: () => void
  expand: () => void
  close: () => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function useTelegramUser() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sendUserData = async (telegramUser: TelegramUser) => {
      try {
        // saveTelegramUser is in europe-west1
        const endpoint = 'https://europe-west1-cvetov-ai.cloudfunctions.net/saveTelegramUser'

        if (!endpoint) {
          console.warn('saveTelegramUser endpoint not configured')
          return
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: telegramUser,
            initData: window.Telegram?.WebApp?.initDataUnsafe,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('User data saved:', data)
      } catch (err) {
        console.error('Failed to save user data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    // Проверяем наличие Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp

      // Сообщаем Telegram, что приложение готово
      tg.ready()

      // Разворачиваем приложение на весь экран
      tg.expand()

      // Получаем данные пользователя
      const telegramUser = tg.initDataUnsafe?.user

      if (telegramUser) {
        setUser(telegramUser)
        // Отправляем данные на сервер
        sendUserData(telegramUser)
      } else {
        console.warn('No user data from Telegram')
      }

      setIsLoading(false)
    } else {
      // Если не в Telegram, можно использовать моковые данные для тестирования
      console.log('Not running in Telegram WebApp')
      setIsLoading(false)
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    isTelegram: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
  }
}
