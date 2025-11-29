'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useChatStore } from '@/lib/store/chat-store'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { ChatInput } from './chat-input'
import { ParamsProgress } from './params-progress'
import { QuickReplies } from './quick-replies'
import { QuickReply, ChatSession } from '@/types'
import { sendChatMessage } from '@/lib/api/chat'

export function ChatInterface() {
  const { session, isTyping, showChat, addMessage, setIsTyping, setShowChat, updateParams } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [session.messages, isTyping])

  // Приветственное сообщение при загрузке
  useEffect(() => {
    if (session.messages.length === 0) {
      setTimeout(() => {
        addMessage({
          id: '1',
          role: 'assistant',
          content: 'Привет! 🌸 Я AI-ассистент Цветов.ру. Помогу подобрать идеальный букет. Какой повод для заказа цветов?',
          timestamp: new Date(),
        })

        setQuickReplies([
          { label: 'День матери', value: 'День матери' },
          { label: 'День рождения', value: 'День рождения' },
          { label: 'Свадьба', value: 'Свадьба' },
          { label: 'Просто так', value: 'Просто так' },
        ])
      }, 500)
    }
  }, [])

  const handleSendMessage = async (content: string) => {
    // Создать новое сообщение пользователя
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    }

    // Добавить сообщение пользователя
    addMessage(userMessage)

    // Очистить быстрые ответы
    setQuickReplies([])

    // Показать индикатор печати
    setIsTyping(true)

    try {
      // Отправить запрос к Claude API через Cloud Function
      // Включаем новое сообщение пользователя в запрос
      const response = await sendChatMessage(
        [...session.messages, userMessage],
        session.params
      )

      // Обновить параметры если они были извлечены
      if (response.extractedParams) {
        updateParams(response.extractedParams)
      }

      // Добавить ответ AI только если он не пустой
      if (response.message && response.message.trim().length > 0) {
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        })
      }

      // Генерировать quick replies на основе недостающих параметров
      // Объединяем старые и новые параметры, т.к. state обновляется асинхронно
      const replies = generateQuickReplies(
        { ...session.params, ...response.extractedParams },
        {}
      )
      setQuickReplies(replies)
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте еще раз.',
        timestamp: new Date(),
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickReply = (value: string) => {
    handleSendMessage(value)
  }

  // Приветствие в зависимости от времени суток
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Доброе утро!'
    if (hour < 18) return 'Добрый день!'
    return 'Добрый вечер!'
  }

  // Начать чат
  const handleStartChat = () => {
    setShowChat(true)
  }

  // Если welcome screen еще не пройден - показываем его
  if (!showChat) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-white to-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="text-6xl">🌸</div>
          </div>

          {/* Greeting */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}</h1>
            <p className="text-lg text-gray-600">
              Я AI-ассистент Цветов.ру
            </p>
            <p className="text-base text-gray-500">
              Помогу подобрать идеальный букет для любого повода
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleStartChat}
              className="w-full bg-[#DD0B20] hover:bg-[#c40a1c] text-white font-medium py-4 px-6 rounded-full transition-colors shadow-lg hover:shadow-xl"
            >
              Начать разговор
            </button>

            <p className="text-sm text-gray-400">
              Нажмите кнопку, чтобы подобрать цветы
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Основной интерфейс чата
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌸</span>
              <span className="font-medium">Цветов.ру AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar - только в режиме консультации */}
      {session.mode === 'consultation' && (
        <ParamsProgress params={session.params} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && <TypingIndicator />}

        {quickReplies.length > 0 && !isTyping && (
          <QuickReplies replies={quickReplies} onSelect={handleQuickReply} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isTyping} />
    </div>
  )
}

// Генерация quick replies на основе недостающих параметров
function generateQuickReplies(
  params: ChatSession['params'],
  extractedParams: any
): QuickReply[] {
  // Обновленные параметры после извлечения
  const updatedParams = { ...params, ...extractedParams }

  // 1. Если повод не указан - предлагаем поводы
  if (!updatedParams.occasion) {
    return [
      { label: 'День матери', value: 'День матери' },
      { label: 'День рождения', value: 'День рождения' },
      { label: 'Свадьба', value: 'Свадьба' },
      { label: 'Просто так', value: 'Просто так' },
    ]
  }

  // 2. Если получатель не указан - предлагаем получателей
  if (!updatedParams.recipient) {
    return [
      { label: '👩 Маме', value: 'Маме' },
      { label: '💑 Жене', value: 'Жене' },
      { label: '👭 Подруге', value: 'Подруге' },
      { label: '👔 Коллеге', value: 'Коллеге' },
    ]
  }

  // 3. Предпочтения НЕ собираются через quick replies
  // AI спросит текстом, пользователь ответит или пропустит

  // 4. Город НЕ показываем через quick replies
  // Пользователь должен ввести город и адрес текстом

  // Все параметры собраны или нужен текстовый ввод - убираем quick replies
  return []
}
