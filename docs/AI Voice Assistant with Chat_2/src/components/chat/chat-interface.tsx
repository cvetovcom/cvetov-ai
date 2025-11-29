'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mic, User, Settings, Menu, X } from 'lucide-react';
import { useChatStore } from '@/lib/store/chat-store';
import { ParamsProgress } from './params-progress';
import { MessageBubble } from './message-bubble';
import { QuickReplies } from './quick-replies';
import { ChatInput } from './chat-input';
import { ProductGrid } from './product-grid';
import { ShoppingCart } from './shopping-cart';
import { CheckoutModal } from './checkout-modal';
import { TypingIndicator } from './typing-indicator';
import { handleUserMessage } from '@/lib/utils/message-handler';
import { useSpeechRecognition, useSpeechSynthesis } from '@/lib/hooks';
import logoImage from 'figma:asset/12f57705d86ebb7693bf9594c73ade82881c2f99.png';
import type { MCPProduct } from '@/types';

export function ChatInterface() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    switchMode,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getTotalPrice,
    setCheckoutOpen,
    setLoading,
  } = useChatStore();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

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

    // Показываем индикатор загрузки
    setLoading(true);

    // Небольшая задержка для реалистичности
    await new Promise(resolve => setTimeout(resolve, 500));

    // Обрабатываем сообщение с помощью утилиты
    const response = handleUserMessage(content, session.params, session.mode);

    // Обновляем параметр, если нужно
    if (response.updatedParam) {
      updateParam(response.updatedParam.key, response.updatedParam.value);
    }

    // Переключаем режим, если все параметры собраны
    if (response.shouldFetchProducts && session.mode === 'consultation') {
      switchMode('search');
    }

    // Загружаем товары, если нужно
    if (response.shouldFetchProducts) {
      // TODO: Здесь будет вызов MCP API
      // Пока используем моковые данные
      const mockProducts: MCPProduct[] = [
        {
          id: '1',
          name: 'Букет "Розовая нежность"',
          price: { final_price: 2890, original_price: 3200, discount: 10 },
          main_image: 'https://images.unsplash.com/photo-1694796152188-497671aac01c?w=400',
          shop_public_uuid: 'shop-1',
          parent_category_slug: 'bouquets',
          in_stock: true,
        },
        {
          id: '2',
          name: 'Тюльпаны весенние',
          price: { final_price: 1990 },
          main_image: 'https://images.unsplash.com/photo-1580403072903-36afa4f4c9f6?w=400',
          shop_public_uuid: 'shop-2',
          parent_category_slug: 'bouquets',
          in_stock: true,
        },
        {
          id: '3',
          name: 'Лилии элегантные',
          price: { final_price: 3490 },
          main_image: 'https://images.unsplash.com/photo-1709773628837-94e63fea4769?w=400',
          shop_public_uuid: 'shop-3',
          parent_category_slug: 'bouquets',
          in_stock: true,
        },
        {
          id: '4',
          name: 'Пионы розовые',
          price: { final_price: 4290 },
          main_image: 'https://images.unsplash.com/photo-1656056970279-0cdd04b60434?w=400',
          shop_public_uuid: 'shop-4',
          parent_category_slug: 'bouquets',
          in_stock: true,
        },
      ];

      setLoading(false);
      addMessage(response.text, 'assistant', { products: mockProducts });
      return;
    }

    // Добавляем ответ ассистента
    setLoading(false);
    addMessage(response.text, 'assistant', { quickReplies: response.quickReplies });
  };

  // Обработка быстрого ответа
  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  // Обработка выбора товара
  const handleSelectProduct = (product: MCPProduct) => {
    addToCart(product);
    addMessage('Товар добавлен в корзину! Хотите продолжить выбор?', 'assistant', {
      quickReplies: ['Показать ещё', 'Перейти к оформлению', 'Изменить параметры'],
    });
  };

  // Обработка обновления количества в корзине
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.id === productId);
    if (item) {
      updateCartQuantity(productId, item.quantity + delta);
    }
  };

  // Обработка оформления заказа
  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  // Обработка подтверждения заказа
  const handleSubmitOrder = (orderData: any) => {
    console.log('Order submitted:', orderData);
    // TODO: Отправить заказ на backend
    
    addMessage(
      'Спасибо за заказ! Ваш заказ принят и будет доставлен в указанное время. Мы отправили SMS с подтверждением.',
      'assistant'
    );
    
    setCheckoutOpen(false);
    // TODO: Очистить корзину после успешного заказа
  };

  // Обработка голосового ввода
  const handleVoiceInput = () => {
    toggleListening();
  };

  // Озвучить ответ ассистента (опционально)
  const handleSpeakResponse = (text: string) => {
    speak(text);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Новый чат
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-500 px-3 mb-2">История</p>
        </div>

        <div className="p-3 border-t border-gray-700">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800 mb-1">
            <User className="w-4 h-4 mr-3" />
            Аккаунт
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
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
              <Button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white mr-2">
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
            </div>

            <div className="p-3 border-t border-gray-700">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800 mb-1">
                <User className="w-4 h-4 mr-3" />
                Аккаунт
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
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

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {!showChat ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              {/* Logo */}
              <div className="mb-8">
                <div className="w-20 h-20 lg:w-24 lg:h-24 relative">
                  <img
                    src={logoImage}
                    alt="AI Ассистент"
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
                  {isLoading && <TypingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shopping Cart */}
        {showChat && (
          <ShoppingCart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
            getTotalPrice={getTotalPrice}
          />
        )}

        {/* Chat Input - Always at bottom when chat is active */}
        {showChat && (
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            isListening={isListening}
            isSpeaking={isSpeaking}
            onVoiceInput={handleVoiceInput}
          />
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onSubmit={handleSubmitOrder}
          getTotalPrice={getTotalPrice}
        />
      )}
    </div>
  );
}
