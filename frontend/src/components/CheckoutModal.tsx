/**
 * Checkout Modal Component
 * Modal for collecting order information and processing payment
 */

'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '@/store/chat.store'
import { DeliveryType } from '@/types/orders.types'
import { authService } from '@/services/auth.service'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (paymentUrl: string) => void
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { sessionId, cart, userCity, customerInfo } = useChatStore()

  // Form state - recipient
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  // Form state - delivery (always DELIVERY, no selector needed)
  const deliveryType = DeliveryType.DELIVERY // Always delivery, no pickup
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTimeRange, setDeliveryTimeRange] = useState('')
  const [orderComment, setOrderComment] = useState('')
  const [cardText, setCardText] = useState('')

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate total
  const cartTotal = cart?.total_price || 0
  const deliveryPrice = deliveryType === DeliveryType.DELIVERY ? 300 : 0 // Example delivery price
  const finalTotal = cartTotal + deliveryPrice

  useEffect(() => {
    if (isOpen) {
      console.log('[CheckoutModal] Modal opened')
      console.log('[CheckoutModal] CustomerInfo:', customerInfo)
      console.log('[CheckoutModal] CustomerInfo type:', typeof customerInfo)
      console.log('[CheckoutModal] CustomerInfo keys:', customerInfo ? Object.keys(customerInfo) : 'null')

      // Auto-fill form fields from customerInfo
      if (customerInfo && customerInfo.name) {
        console.log('[CheckoutModal] Setting name:', customerInfo.name)
        setRecipientName(customerInfo.name)
      }
      if (customerInfo && customerInfo.phone) {
        console.log('[CheckoutModal] Setting phone:', customerInfo.phone)
        setRecipientPhone(formatPhone(customerInfo.phone))
      }
      if (customerInfo && customerInfo.address) {
        console.log('[CheckoutModal] Setting address:', customerInfo.address)
        setDeliveryAddress(customerInfo.address)
      }
      if (customerInfo && customerInfo.card_text) {
        console.log('[CheckoutModal] Setting card text:', customerInfo.card_text)
        setCardText(customerInfo.card_text)
      }

      // Use delivery date from customerInfo if available, otherwise set to tomorrow
      if (customerInfo && customerInfo.delivery_date) {
        setDeliveryDate(customerInfo.delivery_date)
      } else {
        // Set default delivery date to tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setDeliveryDate(tomorrow.toISOString().split('T')[0])
      }
    }
  }, [isOpen, customerInfo])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as Russian phone number
    if (digits.length <= 1) return digits
    if (digits.length <= 4) return `+7 (${digits.slice(1)})`
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setRecipientPhone(formatted)
  }

  const validateForm = () => {
    if (!recipientName.trim()) {
      setError('Укажите имя получателя')
      return false
    }

    if (!recipientPhone || recipientPhone.replace(/\D/g, '').length !== 11) {
      setError('Укажите корректный номер телефона')
      return false
    }

    if (!deliveryAddress.trim()) {
      setError('Укажите адрес доставки')
      return false
    }

    if (!deliveryDate) {
      setError('Выберите дату доставки')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      // Get auth header from auth service
      const authHeader = await authService.getAuthHeader()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Step 1: Sync cart to backend
      const syncCartResponse = await fetch(`${API_URL}/api/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          session_id: sessionId,
          delivery_info: {
            type: DeliveryType.DELIVERY,
            address: deliveryAddress,
            city: userCity || 'Уфа',
            recipient_name: recipientName,
            recipient_phone: recipientPhone.replace(/\D/g, ''), // Send only digits
            delivery_date: deliveryDate,
            delivery_time_range: deliveryTimeRange || null,
            comment: orderComment || null,
            card_text: cardText || null
          },
          user_info: {
            full_name: recipientName,
            phone: recipientPhone.replace(/\D/g, ''),
            email: 'order@cvetov-ai.ru' // Default email since we don't collect it
          }
        })
      })

      if (!syncCartResponse.ok) {
        const errorData = await syncCartResponse.json()
        throw new Error(errorData.message || 'Ошибка синхронизации корзины')
      }

      // Step 2: Create order
      const createOrderResponse = await fetch(`${API_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          session_id: sessionId,
          platform: 'ai_assistant'
        })
      })

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json()
        throw new Error(errorData.message || 'Ошибка создания заказа')
      }

      const orderData = await createOrderResponse.json()

      if (orderData.payment_url) {
        // Success - redirect to payment page
        onSuccess(orderData.payment_url)

        // Open payment URL in new window
        window.open(orderData.payment_url, '_blank')

        // Clear the form and close modal
        onClose()
      } else {
        throw new Error('Не получена ссылка для оплаты')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при оформлении заказа')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#343541] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Оформление заказа</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Recipient Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Информация о получателе</h3>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Имя получателя
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                placeholder="Иван Иванов"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={handlePhoneChange}
                className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

          </div>

          {/* Delivery Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Доставка</h3>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Адрес доставки
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                placeholder="ул. Ленина, д. 1, кв. 1"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Дата доставки
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Время доставки (необязательно)
              </label>
              <select
                value={deliveryTimeRange}
                onChange={(e) => setDeliveryTimeRange(e.target.value)}
                className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
              >
                <option value="">Любое время</option>
                <option value="09:00-12:00">09:00 - 12:00</option>
                <option value="12:00-15:00">12:00 - 15:00</option>
                <option value="15:00-18:00">15:00 - 18:00</option>
                <option value="18:00-21:00">18:00 - 21:00</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Текст открытки (необязательно)
              </label>
              <textarea
                value={cardText}
                onChange={(e) => setCardText(e.target.value)}
                className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                rows={2}
                placeholder="Например: Любимой маме ❤️"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Комментарий к заказу (необязательно)
              </label>
              <textarea
                value={orderComment}
                onChange={(e) => setOrderComment(e.target.value)}
                className="w-full px-3 py-2 bg-[#40414F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                rows={3}
                placeholder="Особые пожелания к заказу..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-6 p-4 bg-[#40414F] rounded-md">
            <h3 className="text-lg font-medium text-white mb-4">Итого</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Товары ({cart?.items_count || 0} шт.)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Доставка</span>
                <span>{formatPrice(deliveryPrice)}</span>
              </div>
              <div className="pt-2 border-t border-gray-600">
                <div className="flex justify-between text-white text-lg font-semibold">
                  <span>К оплате</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isProcessing || !cart || cart.items_count === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isProcessing || !cart || cart.items_count === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#10a37f] text-white hover:bg-[#0d8f6e]'
              }`}
            >
              {isProcessing ? 'Обработка...' : 'Перейти к оплате'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}