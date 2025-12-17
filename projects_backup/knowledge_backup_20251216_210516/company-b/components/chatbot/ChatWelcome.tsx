// components/chatbot/ChatWelcome.tsx
// 聊天欢迎界面组件

'use client'

import { memo } from 'react'
import type { FAQMenu } from './FAQMenu'
import { FAQMenu as FAQMenuComponent } from './FAQMenu'

interface ChatWelcomeProps {
  welcomeMessage: string
  welcomeSubtext?: string
  faqMenu: FAQMenu | null
  onQuestionClick: (question: string) => void
  isLoading: boolean
}

export const ChatWelcome = memo(function ChatWelcome({
  welcomeMessage,
  welcomeSubtext,
  faqMenu,
  onQuestionClick,
  isLoading,
}: ChatWelcomeProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-gray-800 text-base leading-relaxed">
          {welcomeMessage}
          {welcomeSubtext && (
            <>
              <br />
              <span className="text-gray-600">{welcomeSubtext}</span>
            </>
          )}
        </p>
      </div>

      {/* FAQ Menu */}
      {faqMenu && <FAQMenuComponent menu={faqMenu} onQuestionClick={onQuestionClick} isLoading={isLoading} />}
    </div>
  )
})

