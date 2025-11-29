import React, { useState } from 'react';
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

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Сообщение AI ассистенту..."
                disabled={disabled}
                className="pr-10 py-3 border-gray-300 rounded-3xl focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none"
              />
              {onVoiceInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 bottom-2 h-8 w-8 p-0 ${
                    isListening ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={onVoiceInput}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
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
