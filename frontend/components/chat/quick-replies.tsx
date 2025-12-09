import React, { useState } from 'react';
import { detectUserCity } from '@/lib/services/geolocation.service';
import { Loader2 } from 'lucide-react';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  const [isDetecting, setIsDetecting] = useState(false);

  if (!replies || replies.length === 0) return null;

  const handleClick = async (reply: string) => {
    // Проверяем, это ли кнопка определения геопозиции
    if (reply.includes('геопозиции') || reply.includes('местоположение')) {
      setIsDetecting(true);

      try {
        const city = await detectUserCity();
        // Отправляем сообщение с подтверждением города
        onSelect(`Вы в городе ${city}?`);
      } catch (error) {
        console.error('Geolocation error:', error);
        // Отправляем сообщение об ошибке
        onSelect('К сожалению, не удалось определить ваше местоположение. Пожалуйста, выберите город вручную.');
      } finally {
        setIsDetecting(false);
      }
    } else {
      // Обычная быстрая кнопка
      onSelect(reply);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 px-2">
      {replies.map((reply, index) => {
        const isGeolocationButton = reply.includes('геопозиции') || reply.includes('местоположение');
        const isLoading = isDetecting && isGeolocationButton;

        return (
          <button
            key={index}
            onClick={() => handleClick(reply)}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-full text-sm transition-all duration-200 flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isGeolocationButton
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 border-0'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Определяем...' : reply}
          </button>
        );
      })}
    </div>
  );
}
