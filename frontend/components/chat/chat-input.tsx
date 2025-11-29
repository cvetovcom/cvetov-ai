'use client'

import { useState, FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Напишите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            className="pr-4"
          />
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || disabled}
          className="p-3 rounded-xl"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  )
}
