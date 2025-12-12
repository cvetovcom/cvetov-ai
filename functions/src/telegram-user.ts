import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import crypto from 'crypto'

const db = admin.firestore()

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

interface TelegramWebAppData {
  user: TelegramUser
  auth_date: number
  hash: string
}

/**
 * Проверка подписи данных от Telegram Web App
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramWebAppData(
  data: TelegramWebAppData,
  botToken: string
): boolean {
  try {
    const { hash, ...dataToCheck } = data

    // Создаем строку проверки
    const dataCheckString = Object.keys(dataToCheck)
      .sort()
      .map(key => {
        const value = dataToCheck[key as keyof typeof dataToCheck]
        return `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`
      })
      .join('\n')

    // Вычисляем secret_key = HMAC-SHA-256(token, "WebAppData")
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Вычисляем hash = HMAC-SHA-256(secret_key, data_check_string)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return calculatedHash === hash
  } catch (error) {
    console.error('Error validating Telegram data:', error)
    return false
  }
}

/**
 * Сохранение пользователя Telegram
 */
export const saveTelegramUser = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { initData, user } = req.body

    if (!user || !user.id) {
      res.status(400).json({ error: 'User data is required' })
      return
    }

    // Валидация данных (опционально, требует токен бота)
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (botToken && initData) {
      const isValid = validateTelegramWebAppData(initData, botToken)
      if (!isValid) {
        console.warn('Invalid Telegram data signature')
        // Не блокируем, просто логируем
      }
    }

    const telegramUser: TelegramUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code,
      photo_url: user.photo_url,
    }

    // Сохраняем или обновляем пользователя в Firestore
    const userRef = db.collection('telegram_users').doc(String(user.id))

    await userRef.set({
      ...telegramUser,
      first_seen: admin.firestore.FieldValue.serverTimestamp(),
      last_seen: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })

    // Обновляем счетчик визитов
    await userRef.update({
      visit_count: admin.firestore.FieldValue.increment(1),
      last_seen: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`Telegram user saved: ${user.id} (@${user.username || 'no_username'})`)

    res.json({
      success: true,
      message: 'User saved successfully',
      userId: user.id,
    })
  } catch (error) {
    console.error('Error saving Telegram user:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Получение статистики пользователей
 */
export const getTelegramStats = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  try {
    // Проверка прав администратора (простая проверка по ID)
    const { adminId } = req.query
    if (adminId !== '236692046') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const usersSnapshot = await db.collection('telegram_users').get()
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[]

    const stats = {
      total_users: users.length,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        visit_count: u.visit_count || 1,
        first_seen: u.first_seen,
        last_seen: u.last_seen,
      })),
    }

    res.json(stats)
  } catch (error) {
    console.error('Error getting stats:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
