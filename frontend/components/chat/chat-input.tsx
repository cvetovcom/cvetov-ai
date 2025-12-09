import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff, Volume2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  onVoiceInput?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  isListening = false,
  isSpeaking = false,
  onVoiceInput
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSend(inputText);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // 50ms вибрация
    }
  };

  const handleVoiceInput = () => {
    triggerHaptic();
    onVoiceInput?.();
  };

  const handleInputFocus = () => {
    // Небольшая задержка чтобы дать клавиатуре начать анимацию
    setTimeout(() => {
      inputContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 300);
  };

  return (
    <div ref={inputContainerRef} className="border-t border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Сообщение AI ассистенту..."
                disabled={disabled}
                className="py-3 border-gray-300 rounded-3xl focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none"
              />
            </div>

            {onVoiceInput && (
              <button
                onClick={handleVoiceInput}
                disabled={disabled}
                className={`
                  relative h-12 w-12 rounded-full shrink-0
                  flex items-center justify-center
                  transition-all duration-200
                  ${isListening
                    ? 'bg-red-500 hover:bg-red-600 scale-105'
                    : 'bg-gray-800 hover:bg-gray-700'
                  }
                  disabled:bg-gray-200 disabled:cursor-not-allowed
                `}
              >
                {/* Иконка микрофона */}
                {isListening ? (
                  <MicOff className="h-5 w-5 text-white relative z-10" />
                ) : (
                  <Mic className="h-5 w-5 text-white relative z-10" />
                )}

                {/* Визуализация аудио-волн */}
                {isListening && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="absolute w-full h-full rounded-full border-4 border-red-300 animate-ping"
                      style={{ animationDuration: '1.5s' }}
                    />
                    <div className="absolute w-full h-full rounded-full border-2 border-red-400 animate-pulse" />
                  </div>
                )}
              </button>
            )}

            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || disabled}
              className="h-12 w-12 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 p-0 shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          {isListening && (
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Слушаю...
              </p>
            </div>
          )}
          
          {isSpeaking && (
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <Volume2 className="w-4 h-4" />
                Говорю...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
