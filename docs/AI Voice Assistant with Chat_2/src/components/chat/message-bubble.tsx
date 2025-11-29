import React from 'react';
import { User } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  children?: React.ReactNode; // Для ProductGrid и QuickReplies
}

export function MessageBubble({ message, children }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`mb-6 ${isUser ? 'flex justify-end' : ''}`}>
      <div className={`${isUser ? 'max-w-[80%]' : 'w-full'}`}>
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gray-800' 
              : 'bg-gradient-to-br from-purple-500 to-pink-500'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <div className="w-3 h-3 bg-white rounded-full"></div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1">
            <div className={`rounded-2xl px-4 py-3 ${
              isUser 
                ? 'bg-gray-100 text-gray-800' 
                : 'bg-transparent text-gray-800'
            }`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            
            {/* Children (ProductGrid, QuickReplies) */}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
