// components/chatbot/ChatInput.tsx
// 聊天输入组件

'use client'

import { memo, useState, FormEvent } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>
  isLoading: boolean
  placeholder?: string
}

export const ChatInput = memo(function ChatInput({ onSubmit, isLoading, placeholder = '输入消息...' }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageText = input.trim()
    setInput('')
    await onSubmit(messageText)
  }

  return (
    <div 
      className="border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ paddingBottom: `max(1rem, env(safe-area-inset-bottom))` }}
    >
      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 h-12 px-3 sm:px-4 text-sm sm:text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-white text-gray-900"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-12 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex-shrink-0"
        >
          <Send className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">送出</span>
        </Button>
      </form>
    </div>
  )
})

