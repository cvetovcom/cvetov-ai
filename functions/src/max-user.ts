import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

interface MaxUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

/**
 * Сохранение пользователя MAX
 */
export const saveMaxUser = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
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
      const { user, phone } = req.body

      if (!user || !user.id) {
        res.status(400).json({ error: 'User data is required' })
        return
      }

      const maxUser: MaxUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
        photo_url: user.photo_url,
      }

      // Сохраняем или обновляем пользователя в Firestore
      const userRef = db.collection('max_users').doc(String(user.id))
      const userDoc = await userRef.get()

      if (!userDoc.exists) {
        // Новый пользователь
        const userData: any = {
          ...maxUser,
          miniapp_opened: true,
          first_seen: admin.firestore.FieldValue.serverTimestamp(),
          last_seen: admin.firestore.FieldValue.serverTimestamp(),
          visit_count: 1,
        }

        // Добавляем телефон если есть
        if (phone) {
          userData.phone = phone
          userData.phone_received_at = admin.firestore.FieldValue.serverTimestamp()
        }

        await userRef.set(userData)
        console.log(`MAX user created: ${user.id} (@${user.username || 'no_username'})`)
      } else {
        // Существующий пользователь - обновляем
        const updateData: any = {
          ...maxUser,
          miniapp_opened: true,
          last_seen: admin.firestore.FieldValue.serverTimestamp(),
          visit_count: admin.firestore.FieldValue.increment(1),
        }

        // Добавляем/обновляем телефон если есть
        if (phone) {
          updateData.phone = phone
          updateData.phone_received_at = admin.firestore.FieldValue.serverTimestamp()
        }

        await userRef.update(updateData)
        console.log(`MAX user updated: ${user.id} (@${user.username || 'no_username'})`)
      }

      res.json({
        success: true,
        message: 'User saved successfully',
        userId: user.id,
        hasPhone: !!phone,
      })
    } catch (error) {
      console.error('Error saving MAX user:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

/**
 * Получение статистики MAX пользователей
 */
export const getMaxStats = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
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

      const usersSnapshot = await db.collection('max_users').get()
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as any[]

      // Подсчитываем пользователей с телефоном
      const usersWithPhone = users.filter(u => u.phone).length

      const stats = {
        total_users: users.length,
        users_with_phone: usersWithPhone,
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          first_name: u.first_name,
          last_name: u.last_name,
          phone: u.phone ? `${u.phone.slice(0, 5)}****` : null, // Маскируем телефон
          visit_count: u.visit_count || 1,
          first_seen: u.first_seen,
          last_seen: u.last_seen,
        })),
      }

      res.json(stats)
    } catch (error) {
      console.error('Error getting MAX stats:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
