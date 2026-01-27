/**
 * Сервис для интеграции с Mautic
 * https://mautic.cvetov.com/
 */

const MAUTIC_URL = 'https://mautic.cvetov.com'
const MAUTIC_USER = process.env.MAUTIC_USER || 'mautic'
const MAUTIC_PASSWORD = process.env.MAUTIC_PASSWORD || ''

interface MauticContact {
  phone: string
  firstname?: string
  lastname?: string
  telegram_id?: string
  max_id?: string
  tags?: string[]
}

/**
 * Создать или обновить контакт в Mautic
 * Использует Basic Auth
 */
export async function sendContactToMautic(contact: MauticContact): Promise<boolean> {
  if (!MAUTIC_PASSWORD) {
    console.warn('[Mautic] Password not configured, skipping')
    return false
  }

  if (!contact.phone) {
    console.warn('[Mautic] Phone is required, skipping')
    return false
  }

  try {
    // Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${MAUTIC_USER}:${MAUTIC_PASSWORD}`).toString('base64')

    // Формируем данные контакта
    const contactData: Record<string, any> = {
      phone: contact.phone,
      overwriteWithBlank: false, // Не перезаписывать пустыми значениями
    }

    if (contact.firstname) {
      contactData.firstname = contact.firstname
    }

    if (contact.lastname) {
      contactData.lastname = contact.lastname
    }

    if (contact.telegram_id) {
      contactData.telegram_id = contact.telegram_id
    }

    if (contact.max_id) {
      contactData.max_id = contact.max_id
    }

    if (contact.tags && contact.tags.length > 0) {
      contactData.tags = contact.tags
    }

    console.log('[Mautic] Sending contact:', {
      phone: contact.phone.slice(0, 5) + '****',
      telegram_id: contact.telegram_id,
      max_id: contact.max_id,
    })

    const response = await fetch(`${MAUTIC_URL}/api/contacts/new`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('[Mautic] Contact created/updated, ID:', data.contact?.id)
      return true
    } else {
      const errorText = await response.text()
      console.error('[Mautic] API error:', response.status, errorText)
      return false
    }
  } catch (error) {
    console.error('[Mautic] Failed to send contact:', error)
    return false
  }
}
