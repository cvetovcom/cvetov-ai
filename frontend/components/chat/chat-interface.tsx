'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mic, User, Settings, Menu, X, LogIn, Lock } from 'lucide-react';
import { useChatStore } from '@/lib/store/chat-store';
import { ParamsProgress } from './params-progress';
import { MessageBubble } from './message-bubble';
import { QuickReplies } from './quick-replies';
import { ChatInput } from './chat-input';
import { ProductGrid } from './product-grid';
import { ShoppingCart } from './shopping-cart';
import { CheckoutModal } from './checkout-modal';
import { TypingIndicator } from './typing-indicator';
import { useSpeechRecognition, useSpeechSynthesis } from '@/lib/hooks';
import { useTelegramUser } from '@/lib/hooks/useTelegramUser';
import { sendChatMessage } from '@/lib/services/chat-api.service';
import {
  trackChatStarted,
  trackMessageSent,
  trackRecipientSet,
  trackOccasionSet,
  trackCitySet,
  trackCatalogShown,
  trackCartAdd,
  trackCheckoutStart,
  trackOrderComplete,
} from '@/lib/services/analytics.service';
import { generateQuickReplies } from '@/lib/utils/quick-replies-generator';
import type { MCPProduct } from '@/types';
import Image from 'next/image';

export function ChatInterface() {
  // Telegram Web App integration
  const { user: telegramUser, isLoading: isTelegramLoading, isTelegram } = useTelegramUser();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loadingStatusMessage, setLoadingStatusMessage] = useState<string>('');

  // Состояния для попапов меню
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

  // Проверка авторизации
  const isAuthenticated = !!telegramUser;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Feature flag для прямых ссылок на cvetov.com
  const enableDirectLinks = process.env.NEXT_PUBLIC_ENABLE_DIRECT_LINKS === 'true';

  // Speech Recognition & Synthesis
  const { isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcript) => {
      handleSendMessage(transcript);
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
    },
  });

  const { isSpeaking, speak } = useSpeechSynthesis();

  // Zustand store
  const {
    session,
    isLoading,
    cart,
    isCheckoutOpen,
    addMessage,
    updateParam,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getTotalPrice,
    setCheckoutOpen,
    setLoading,
    resetSession,
  } = useChatStore();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  // Add initial greeting message when chat is opened
  useEffect(() => {
    if (showChat && session.messages.length === 0) {
      // Отслеживаем начало чата
      trackChatStarted();

      const quickReplies = generateQuickReplies(session.params);
      addMessage(
        'Привет! 🌸 Я AI-ассистент Цветов.ру. Помогу подобрать идеальный букет. Для кого вы хотите заказать цветы?',
        'assistant',
        { quickReplies }
      );
    }
  }, [showChat, session.messages.length, addMessage, session.params]);

  // Приветствие в зависимости от времени суток
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро!';
    if (hour < 18) return 'Добрый день!';
    return 'Добрый вечер!';
  };

  // Обработка отправки сообщения
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Добавляем сообщение пользователя
    addMessage(content, 'user');

    // Отслеживаем отправку сообщения
    const userMessagesCount = session.messages.filter(m => m.role === 'user').length + 1;
    trackMessageSent(content, userMessagesCount);

    // Показываем индикатор загрузки
    setLoading(true);

    // Определяем сообщение о статусе загрузки
    // Проверяем есть ли в сообщении указание на цветок или цвет
    const contentLower = content.toLowerCase();
    const hasFlowerOrColor =
      contentLower.match(/роз|тюльпан|пион|хризантем|гвозд|лили|орхиде|ромашк|гербер/) ||
      contentLower.match(/бел|красн|розов|персиков|желт|оранжев|голуб|сирен|бордов|пурпурн|беж|кремов|лилов|фиолетов/);

    if (hasFlowerOrColor) {
      // Если указаны свойства цветов
      setLoadingStatusMessage(`Фильтрую товары по запросу "${content}"`);
    } else if (session.params.city) {
      // Если город уже выбран, но свойств нет
      setLoadingStatusMessage(`Подбираю 16 букетов в магазинах г. ${session.params.city.name}`);
    } else {
      // Общий случай
      setLoadingStatusMessage('Обрабатываю ваш запрос');
    }

    try {
      // Вызываем Firebase Function для получения ответа
      const response = await sendChatMessage(
        session.messages.concat([{
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        }]),
        session.params
      );

      // Обновляем параметры, если были извлечены
      if (response.extractedParams) {
        Object.entries(response.extractedParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            updateParam(key as any, value);

            // Отслеживаем установку параметров воронки
            if (key === 'recipient' && typeof value === 'string') {
              trackRecipientSet(value);
            } else if (key === 'occasion' && typeof value === 'string') {
              trackOccasionSet(value);
            } else if (key === 'city' && typeof value === 'object' && value !== null && 'name' in value) {
              trackCitySet((value as { name: string }).name);
            }
          }
        });
      }

      // Отслеживаем показ каталога товаров
      if (response.products && response.products.length > 0) {
        trackCatalogShown(response.products.length);
      }

      // Используем быстрые кнопки из ответа API (если есть)
      // Если кнопок нет - генерируем на основе параметров (fallback)
      const updatedParams = { ...session.params, ...response.extractedParams };
      const quickReplies = response.quickReplies || generateQuickReplies(updatedParams);

      // Добавляем ответ ассистента
      // Если есть товары - не показываем быстрые кнопки
      setLoading(false);
      setLoadingStatusMessage(''); // Очищаем статусное сообщение
      addMessage(response.message, 'assistant', {
        quickReplies: response.products && response.products.length > 0 ? undefined : quickReplies,
        products: response.products
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      setLoadingStatusMessage(''); // Очищаем статусное сообщение
      addMessage('Извините, произошла ошибка. Попробуйте еще раз.', 'assistant');
    }
  };

  // Обработка быстрого ответа
  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  // Обработка выбора товара
  const handleSelectProduct = (product: MCPProduct) => {
    addToCart(product);

    // Отслеживаем добавление в корзину
    trackCartAdd(product.name, product.price.final_price);

    addMessage('Товар добавлен в корзину! Хотите продолжить выбор?', 'assistant', {
      quickReplies: ['Показать ещё', 'Изменить параметры'],
    });
  };

  // Обработка обновления количества в корзине
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.guid === productId);
    if (item) {
      updateCartQuantity(productId, item.quantity + delta);
    }
  };

  // Обработка оформления заказа
  const handleCheckout = () => {
    // Отслеживаем начало оформления заказа
    trackCheckoutStart(getTotalPrice(), cart.length);

    setCheckoutOpen(true);
  };

  // Обработка подтверждения заказа
  const handleSubmitOrder = (orderData: any) => {
    console.log('Order submitted:', orderData);
    // TODO: Отправить заказ на backend

    // Отслеживаем завершение заказа
    trackOrderComplete(getTotalPrice(), cart.length);

    addMessage(
      'Спасибо за заказ! Ваш заказ принят и будет доставлен в указанное время. Мы отправили SMS с подтверждением.',
      'assistant'
    );

    setCheckoutOpen(false);
    // TODO: Очистить корзину после успешного заказа
  };

  // Обработка голосового ввода
  const handleVoiceInput = () => {
    setShowChat(true);
    toggleListening();
  };

  // Озвучить ответ ассистента (опционально)
  const handleSpeakResponse = (text: string) => {
    speak(text);
  };

  // Обработка "Новый чат"
  const handleNewChat = () => {
    resetSession();
    setShowChat(false);
    setShowSidebar(false);
  };

  return (
    <div className="flex bg-gray-900" style={{ height: '100dvh' }}>
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <Button
            className="w-full bg-gray-800 hover:bg-gray-700 text-white"
            onClick={handleNewChat}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Новый чат
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-500 px-3 mb-2">История</p>
          {!isAuthenticated ? (
            <div className="px-3 py-4 text-center">
              <Lock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                История доступна при авторизации
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-500 px-3">
              {/* TODO: Список чатов из истории */}
              <p className="text-gray-600">Нет сохранённых чатов</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-700">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-gray-800 mb-1"
              onClick={() => setShowAccountPopup(true)}
            >
              <User className="w-4 h-4 mr-3" />
              Аккаунт
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:bg-gray-800 mb-1"
              disabled
            >
              <LogIn className="w-4 h-4 mr-3" />
              Войти
            </Button>
          )}
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-gray-800 ${isAuthenticated ? 'text-white' : 'text-gray-600 cursor-not-allowed'}`}
            disabled={!isAuthenticated}
            onClick={() => isAuthenticated && setShowSettingsPopup(true)}
          >
            <Settings className="w-4 h-4 mr-3" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <Button
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white mr-2"
                onClick={handleNewChat}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Новый чат
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-xs text-gray-500 px-3 mb-2">История</p>
              {!isAuthenticated ? (
                <div className="px-3 py-4 text-center">
                  <Lock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    История доступна при авторизации
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500 px-3">
                  {/* TODO: Список чатов из истории */}
                  <p className="text-gray-600">Нет сохранённых чатов</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-700">
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-gray-800 mb-1"
                  onClick={() => {
                    setShowAccountPopup(true);
                    setShowSidebar(false);
                  }}
                >
                  <User className="w-4 h-4 mr-3" />
                  Аккаунт
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-400 hover:bg-gray-800 mb-1"
                  disabled
                >
                  <LogIn className="w-4 h-4 mr-3" />
                  Войти
                </Button>
              )}
              <Button
                variant="ghost"
                className={`w-full justify-start hover:bg-gray-800 ${isAuthenticated ? 'text-white' : 'text-gray-600 cursor-not-allowed'}`}
                disabled={!isAuthenticated}
                onClick={() => {
                  if (isAuthenticated) {
                    setShowSettingsPopup(true);
                    setShowSidebar(false);
                  }
                }}
              >
                <Settings className="w-4 h-4 mr-3" />
                Настройки
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center h-14 px-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-2"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-gray-800">Цветов.ру AI</h1>

          {showChat && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setShowChat(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Content Area - Reserve space for ChatInput at bottom */}
        <div className="flex-1 overflow-hidden" style={{ maxHeight: 'calc(100dvh - 56px - 88px)' }}>
          {!showChat ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              {/* Logo */}
              <div className="mb-8">
                <div className="w-20 h-20 lg:w-24 lg:h-24 relative">
                  <Image
                    src="/logo.png"
                    alt="AI Ассистент"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                  {(isListening || isSpeaking) && (
                    <div className="absolute inset-0 border-4 border-red-500 rounded-2xl animate-ping"></div>
                  )}
                </div>
              </div>

              {/* Welcome Text */}
              <div className="space-y-4 mb-8">
                <h2 className="text-3xl lg:text-5xl text-gray-800">{getGreeting()}</h2>
                <p className="text-xl text-gray-600">Какой букет и кому сегодня подбираем?</p>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                <button
                  onClick={() => setShowChat(true)}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0 mt-1" />
                    <div>
                      <div className="text-gray-700 mb-1">Начать разговор</div>
                      <div className="text-sm text-gray-500">Начните общение с AI ассистентом</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleVoiceInput}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <Mic className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0 mt-1" />
                    <div>
                      <div className="text-gray-700 mb-1">Голосовой ввод</div>
                      <div className="text-sm text-gray-500">Расскажите голосом о вашем запросе</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Chat Screen */
            <div className="flex flex-col h-full">
              {/* Parameters Progress */}
              {showChat && <ParamsProgress params={session.params} />}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6">
                  {session.messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Начните разговор...</p>
                    </div>
                  )}

                  {session.messages.map((message) => (
                    <MessageBubble key={message.id} message={message}>
                      {/* Product Grid */}
                      {message.role === 'assistant' && message.products && message.products.length > 0 && (
                        <ProductGrid
                          products={message.products}
                          onSelectProduct={handleSelectProduct}
                          citySlug={session.params.city?.slug}
                        />
                      )}

                      {/* Quick Replies */}
                      {message.role === 'assistant' && message.quickReplies && (
                        <QuickReplies
                          replies={message.quickReplies}
                          onSelect={handleQuickReply}
                        />
                      )}
                    </MessageBubble>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && <TypingIndicator statusMessage={loadingStatusMessage} />}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shopping Cart */}
        {showChat && !enableDirectLinks && (
          <ShoppingCart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
            getTotalPrice={getTotalPrice}
          />
        )}

        {/* Chat Input - Always at bottom */}
        <ChatInput
          onSend={(message) => {
            if (!showChat) {
              setShowChat(true);
            }
            handleSendMessage(message);
          }}
          disabled={isLoading}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onVoiceInput={handleVoiceInput}
        />
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && !enableDirectLinks && (
        <CheckoutModal
          cart={cart}
          sessionParams={session.params}
          onClose={() => setCheckoutOpen(false)}
          onSubmit={handleSubmitOrder}
          getTotalPrice={getTotalPrice}
        />
      )}

      {/* Account Popup */}
      {showAccountPopup && telegramUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAccountPopup(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <button
              onClick={() => setShowAccountPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                {telegramUser.photo_url ? (
                  <img
                    src={telegramUser.photo_url}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {telegramUser.first_name} {telegramUser.last_name || ''}
              </h3>
              {telegramUser.username && (
                <p className="text-gray-500">@{telegramUser.username}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ID</span>
                <span className="text-gray-900">{telegramUser.id}</span>
              </div>
              {telegramUser.language_code && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Язык</span>
                  <span className="text-gray-900">{telegramUser.language_code.toUpperCase()}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-6 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                // TODO: Implement logout
                setShowAccountPopup(false);
              }}
            >
              Выйти
            </Button>
          </div>
        </div>
      )}

      {/* Settings Popup */}
      {showSettingsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettingsPopup(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <button
              onClick={() => setShowSettingsPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold text-gray-900 mb-6">Настройки</h3>

            <div className="flex border-b border-gray-200 mb-4">
              <button className="flex-1 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                Общее
              </button>
              <button className="flex-1 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                Уведомления
              </button>
            </div>

            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Настройки будут доступны в следующем обновлении</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
