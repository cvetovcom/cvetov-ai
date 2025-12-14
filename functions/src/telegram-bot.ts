import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const ADMIN_ID = 236692046
const MINI_APP_URL = 'https://ai.cvetov.com'

// Состояния для админ-панели
const adminStates = new Map<number, string>()

/**
 * Отправка сообщения через Telegram Bot API
 */
async function sendMessage(chatId: number, text: string, options?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  })

  return response.json()
}

/**
 * Обработчик вебхука от Telegram
 */
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(200).send('OK')
    return
  }

  try {
    const update = req.body

    // Обработка текстовых сообщений
    if (update.message?.text) {
      const chatId = update.message.chat.id
      const userId = update.message.from.id
      const text = update.message.text

      console.log(`Message from ${userId}: ${text}`)

      // Команда /start
      if (text === '/start') {
        const isAdmin = userId === ADMIN_ID

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🌸 Открыть каталог',
                web_app: { url: MINI_APP_URL },
              },
            ],
            ...(isAdmin ? [[
              { text: '⚙️ Админ-панель', callback_data: 'admin_panel' },
            ]] : []),
          ],
        }

        await sendMessage(
          chatId,
          isAdmin
            ? 'Добро пожаловать в AI-ассистент Цветов.ру!\n\nВы вошли как <b>администратор</b>.'
            : 'Добро пожаловать в AI-ассистент Цветов.ру!\n\nПоможем подобрать идеальный букет за пару минут 🌹',
          { reply_markup: keyboard }
        )
        res.status(200).send('OK')
        return
      }

      // Команда /admin (только для админа)
      if (text === '/admin' && userId === ADMIN_ID) {
        const keyboard = {
          inline_keyboard: [
            [{ text: '📊 Статистика', callback_data: 'stats' }],
            [{ text: '📢 Отправить рассылку', callback_data: 'broadcast_start' }],
            [{ text: '🔙 Назад', callback_data: 'back_to_start' }],
          ],
        }

        await sendMessage(chatId, '<b>Админ-панель</b>\n\nВыберите действие:', {
          reply_markup: keyboard,
        })
        res.status(200).send('OK')
        return
      }

      // Если админ в режиме ввода рассылки
      if (userId === ADMIN_ID && adminStates.get(userId) === 'waiting_broadcast') {
        adminStates.delete(userId)

        await sendMessage(chatId, '⏳ Отправляю рассылку...')

        // Отправляем рассылку через существующую функцию
        const broadcastUrl = `https://us-central1-cvetov-ai.cloudfunctions.net/sendBroadcast`
        const response = await fetch(broadcastUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminId: String(ADMIN_ID),
            message: text,
          }),
        })

        const result = await response.json()

        if (result.success) {
          await sendMessage(
            chatId,
            `✅ Рассылка завершена!\n\n` +
              `Отправлено: ${result.results.sent}\n` +
              `Ошибок: ${result.results.failed}`
          )
        } else {
          await sendMessage(chatId, '❌ Ошибка при отправке рассылки')
        }

        res.status(200).send('OK')
        return
      }

      // Неизвестная команда
      await sendMessage(
        chatId,
        'Используйте /start для открытия каталога или /admin для админ-панели'
      )
    }

    // Обработка callback query (нажатия на кнопки)
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const chatId = callbackQuery.message.chat.id
      const userId = callbackQuery.from.id
      const data = callbackQuery.data

      console.log(`Callback from ${userId}: ${data}`)

      // Подтверждаем получение callback
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackQuery.id }),
        }
      )

      // Только для админа
      if (userId !== ADMIN_ID) {
        res.status(200).send('OK')
        return
      }

      // Админ-панель
      if (data === 'admin_panel') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '📊 Статистика', callback_data: 'stats' }],
            [{ text: '📢 Отправить рассылку', callback_data: 'broadcast_start' }],
            [{ text: '🔙 Назад', callback_data: 'back_to_start' }],
          ],
        }

        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
              text: '<b>Админ-панель</b>\n\nВыберите действие:',
              parse_mode: 'HTML',
              reply_markup: keyboard,
            }),
          }
        )
      }

      // Статистика
      if (data === 'stats') {
        const usersSnapshot = await db.collection('telegram_users').get()
        const users = usersSnapshot.docs.map(doc => doc.data())

        const totalUsers = users.length
        const totalVisits = users.reduce((sum: number, u: any) => sum + (u.visit_count || 1), 0)

        // Последние 5 пользователей
        const recentUsers = users
          .sort((a: any, b: any) => {
            const aTime = a.last_seen?.toDate?.() || new Date(0)
            const bTime = b.last_seen?.toDate?.() || new Date(0)
            return bTime.getTime() - aTime.getTime()
          })
          .slice(0, 5)

        let statsText = `📊 <b>Статистика пользователей</b>\n\n`
        statsText += `👥 Всего пользователей: ${totalUsers}\n`
        statsText += `📈 Всего визитов: ${totalVisits}\n\n`
        statsText += `<b>Последние пользователи:</b>\n`

        recentUsers.forEach((u: any, i: number) => {
          const name = u.first_name || u.username || 'Неизвестный'
          const username = u.username ? `@${u.username}` : ''
          statsText += `${i + 1}. ${name} ${username}\n`
        })

        const keyboard = {
          inline_keyboard: [
            [{ text: '🔄 Обновить', callback_data: 'stats' }],
            [{ text: '🔙 Назад', callback_data: 'admin_panel' }],
          ],
        }

        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
              text: statsText,
              parse_mode: 'HTML',
              reply_markup: keyboard,
            }),
          }
        )
      }

      // Начало рассылки
      if (data === 'broadcast_start') {
        adminStates.set(userId, 'waiting_broadcast')

        const keyboard = {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'admin_panel' }],
          ],
        }

        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
              text:
                '📢 <b>Отправка рассылки</b>\n\n' +
                'Отправьте текст сообщения для рассылки.\n\n' +
                'Можно использовать HTML теги:\n' +
                '• <code>&lt;b&gt;жирный&lt;/b&gt;</code>\n' +
                '• <code>&lt;i&gt;курсив&lt;/i&gt;</code>\n' +
                '• <code>&lt;code&gt;код&lt;/code&gt;</code>',
              parse_mode: 'HTML',
              reply_markup: keyboard,
            }),
          }
        )
      }

      // Возврат к /start
      if (data === 'back_to_start') {
        adminStates.delete(userId)

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🌸 Открыть каталог',
                web_app: { url: MINI_APP_URL },
              },
            ],
            [{ text: '⚙️ Админ-панель', callback_data: 'admin_panel' }],
          ],
        }

        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
              text: 'Добро пожаловать в AI-ассистент Цветов.ру!\n\nВы вошли как <b>администратор</b>.',
              parse_mode: 'HTML',
              reply_markup: keyboard,
            }),
          }
        )
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(200).send('OK')
  }
})
