/**
 * ChatGPT-style Chat Component
 * Exact replica of ChatGPT interface for AI Shopping Assistant
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore, Product } from '@/store/chat.store'
import { ProductGrid } from './ProductGrid'
import { CheckoutModal } from './CheckoutModal'
import { authService } from '@/services/auth.service'

export function ChatGPT() {
  const [input, setInput] = useState('')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    sessionId,
    cart,
    isLoading,
    error,
    userCity,
    addMessage,
    setSessionId,
    setCart,
    setLoading,
    setError,
    setUserCity,
    setUserLocation,
    setCustomerInfo,
    clearChat,
  } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize session - will be set from server response
  useEffect(() => {
    console.log('Component mounted, waiting for session from server')
    // Don't create a local session - let the server manage it
  }, [])

  useEffect(() => {
    // Request geolocation on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.log('Geolocation not available:', error.message)
        }
      )
    }
  }, [setUserLocation])

  // Add warning on page refresh if there are messages
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (messages.length > 0) {
        const message = 'Внимание! При обновлении страницы история диалога будет удалена для обеспечения конфиденциальности.'
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [messages.length])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Add user message to chat
    addMessage({ role: 'user', content: userMessage })
    setLoading(true)
    setError(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Get auth header from auth service
      const authHeader = await authService.getAuthHeader()

      const requestBody: Record<string, unknown> = {
        message: userMessage,
      }

      // Get current state from localStorage to check persistence
      const storedState = localStorage.getItem('chat-store')
      console.log('[ChatGPT] LocalStorage state:', storedState ? JSON.parse(storedState).state?.sessionId : 'No stored state')
      console.log('[ChatGPT] Current sessionId from store:', sessionId)

      if (sessionId) {
        requestBody.session_id = sessionId
        console.log('[ChatGPT] Including session_id in request body:', requestBody)
      } else {
        console.log('[ChatGPT] WARNING: No sessionId available, server will create new session')
      }

      if (userCity) {
        requestBody.city = userCity
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send message')
      }

      const data = await response.json()

      // Debug: log the response to see if products are returned
      console.log('API Response:', data)
      console.log('Products in response:', data.products)

      // Always update session ID from server to maintain session consistency
      if (data.session_id) {
        console.log('[ChatGPT] Updating sessionId to:', data.session_id)
        setSessionId(data.session_id)
      }

      // Update cart
      if (data.cart) {
        setCart(data.cart)
      }

      // Update customer info if provided
      if (data.customerInfo) {
        console.log('[ChatGPT] Received customer info in regular message:', data.customerInfo)
        console.log('[ChatGPT] customerInfo type:', typeof data.customerInfo)
        console.log('[ChatGPT] customerInfo keys:', Object.keys(data.customerInfo))
        console.log('[ChatGPT] Calling setCustomerInfo with:', data.customerInfo)
        setCustomerInfo(data.customerInfo)
        console.log('[ChatGPT] setCustomerInfo called')
      }

      // Add assistant message with products
      addMessage({
        role: 'assistant',
        content: data.message,
        products: data.products || []
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      addMessage({
        role: 'assistant',
        content: `Sorry, an error occurred: ${errorMessage}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleAddToCart = async (product: Product) => {
    console.log('handleAddToCart called with product:', product)
    console.log('Current sessionId:', sessionId)
    console.log('Current userCity:', userCity)

    // First clear cart, then add new product (only 1 bouquet allowed)
    // Include all necessary product details including price
    const addToCartMessage = `Очисти корзину и добавь только товар "${product.name}" (${product.guid || product.id}) с ценой ${product.price} руб., магазин ${product.shop_uuid}`

    // Add user message to chat (show user-friendly message)
    addMessage({
      role: 'user',
      content: `Выбрать букет: ${product.name}`
    })

    setLoading(true)
    setError(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Get auth header from auth service
      const authHeader = await authService.getAuthHeader()

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          message: addToCartMessage,
          session_id: sessionId,
          city: userCity
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Update session and cart
      setSessionId(data.session_id)
      if (data.cart) {
        setCart(data.cart)
      }

      // Update customer info if provided
      if (data.customerInfo) {
        console.log('Received customer info:', data.customerInfo)
        setCustomerInfo(data.customerInfo)
      }

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: data.message
      })

      // Claude AI will handle requesting delivery details automatically after adding to cart
    } catch (err) {
      console.error('Error adding to cart:', err)
      const errorMessage = err instanceof Error ? err.message : 'Не удалось добавить товар в корзину'
      setError(errorMessage)
      addMessage({
        role: 'assistant',
        content: `Извините, произошла ошибка при добавлении товара в корзину: ${errorMessage}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMoreProducts = async () => {
    // Send message to load more products
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()

    if (lastUserMessage) {
      // Resend the last query with a request for more products
      setInput(`Покажи еще варианты для запроса: ${lastUserMessage.content}`)
      await sendMessage()
    } else {
      setInput('Покажи еще варианты букетов')
      await sendMessage()
    }
  }

  const startNewChat = () => {
    // Clear localStorage
    localStorage.removeItem('chat-store')
    localStorage.removeItem('auth-token')
    // Clear store
    clearChat()
    // Reload page to get new session
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#343541] overflow-hidden">
      {/* Header Bar */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-[#343541]">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <button className="text-gray-400 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-white text-base md:text-lg font-semibold">Цветов.ру AI</h1>
          </div>
          <button
            onClick={startNewChat}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-[#10a37f] text-white rounded-md md:rounded-lg hover:bg-[#0d8f6e] transition-colors text-xs md:text-sm font-medium">
            Новый чат
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="pb-32">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-2xl px-4 py-8">
                <h1 className="text-2xl md:text-4xl font-semibold text-white mb-2 md:mb-3">
                  Цветов.ру AI
                </h1>
                <p className="text-gray-400 text-sm md:text-base mb-6 md:mb-8 px-2">
                  AI ассистент для заказа цветов с доставкой по всей России, просто напишите город и адрес
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-left">
                  <div className="bg-[#444654] rounded-lg p-3 md:p-4 hover:bg-[#4a4b5e] transition-colors cursor-pointer">
                    <p className="text-white text-xs md:text-sm font-medium mb-1">Найти букет</p>
                    <p className="text-gray-400 text-xs md:text-sm">
                      "Покажи букеты роз до 5000 рублей"
                    </p>
                  </div>
                  <div className="bg-[#444654] rounded-lg p-3 md:p-4 hover:bg-[#4a4b5e] transition-colors cursor-pointer">
                    <p className="text-white text-xs md:text-sm font-medium mb-1">Помощь с выбором</p>
                    <p className="text-gray-400 text-xs md:text-sm">
                      "Что подарить на день рождения?"
                    </p>
                  </div>
                  <div className="bg-[#444654] rounded-lg p-3 md:p-4 hover:bg-[#4a4b5e] transition-colors cursor-pointer">
                    <p className="text-white text-xs md:text-sm font-medium mb-1">Оформить заказ</p>
                    <p className="text-gray-400 text-xs md:text-sm">
                      "Хочу заказать цветы с доставкой"
                    </p>
                  </div>
                  <div className="bg-[#444654] rounded-lg p-3 md:p-4 hover:bg-[#4a4b5e] transition-colors cursor-pointer">
                    <p className="text-white text-xs md:text-sm font-medium mb-1">Уход за цветами</p>
                    <p className="text-gray-400 text-xs md:text-sm">
                      "Как ухаживать за розами?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`${
                message.role === 'user' ? 'bg-[#343541]' : 'bg-[#444654]'
              }`}
            >
              <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-[#6b6c7b] flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Я</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-lg">🌸</span>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="text-white text-sm md:text-base whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {/* Product Grid */}
                    {message.products && message.products.length > 0 && (
                      <div className="mt-4">
                        <ProductGrid
                          products={message.products}
                          onAddToCart={handleAddToCart}
                          onLoadMore={handleLoadMoreProducts}
                          hasMore={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Copy Button */}
                  <div className="flex-shrink-0">
                    <button
                      className="text-gray-400 hover:text-white transition-colors p-1"
                      onClick={() => navigator.clipboard.writeText(message.content)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="bg-[#444654]">
              <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-lg">🌸</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Cart Info Bar (if items in cart) */}
      {cart.items_count > 0 && (
        <div className="flex-shrink-0 border-t border-gray-700 bg-[#343541] px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              <span>В корзине: {cart.items_count === 1 ? '1 букет' : `${cart.items_count} товаров`}</span>
              <span className="font-semibold">{cart.total_price}₽</span>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="text-sm text-[#10a37f] hover:text-[#0d8f6e] transition-colors"
            >
              Оформить заказ →
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-[#343541]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="max-w-4xl mx-auto px-4 py-4"
        >
          <div className="relative flex items-center bg-[#40414f] rounded-2xl shadow-sm border border-gray-700">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={messages.length === 0 ? "Кому и куда отправить букет?" : "Спросите еще что-нибудь"}
              className="flex-1 resize-none bg-transparent text-white text-sm md:text-base placeholder-gray-400 pl-4 pr-24 py-3 md:py-3.5 md:pr-28 focus:outline-none max-h-48 overflow-y-auto"
              disabled={isLoading}
              rows={1}
            />
            <div className="absolute right-2 inset-y-0 flex items-center gap-1">
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={() => alert('В разработке')}
                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-[#565869]"
                title="Голосовой ввод"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
              {/* Send Button - ChatGPT style */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-[#565869] text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14m0 0l-7-7m7 7l-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
          {!userCity && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Для поиска товаров укажите город доставки в сообщении
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="text-center pb-3 px-4 text-xs text-gray-500">
          Отправляя сообщение Цветов.ру AI, чат-боту с искусственным интеллектом, вы соглашаетесь с нашими условиями
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(paymentUrl) => {
          console.log('Payment URL:', paymentUrl)
          // Cart will be cleared after successful order
          setIsCheckoutOpen(false)
        }}
      />
    </div>
  )
}