import React from 'react';

export function TypingIndicator() {
  return (
    <div className="mb-6">
      <div className="flex gap-3">
        {/* AI Avatar */}
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>

        {/* Typing Animation */}
        <div className="bg-gray-100 rounded-2xl px-5 py-4">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
