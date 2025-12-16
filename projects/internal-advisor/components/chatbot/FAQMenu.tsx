// components/chatbot/FAQMenu.tsx
// FAQ 菜单组件

'use client'

import { memo, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'

export interface FAQCategory {
  title: string
  questions: Array<{
    id: string
    question: string
    answer: string
    next_best_actions?: string[]
  }>
}

export interface FAQMenu {
  categories: Record<string, FAQCategory>
}

interface FAQMenuProps {
  menu: FAQMenu
  onQuestionClick: (question: string) => void
  isLoading: boolean
}

export const FAQMenu = memo(function FAQMenu({ menu, onQuestionClick, isLoading }: FAQMenuProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleCategoryToggle = useCallback((key: string) => {
    setExpandedCategory(prev => prev === key ? null : key)
  }, [])

  const handleQuestionClick = useCallback((question: string) => {
    onQuestionClick(question)
  }, [onQuestionClick])

  if (!menu.categories || Object.keys(menu.categories).length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {Object.entries(menu.categories).map(([key, category]) => (
        <Card key={key} className="border-2 border-gray-200 hover:border-blue-300 transition-colors overflow-hidden">
          <button
            onClick={() => handleCategoryToggle(key)}
            className="w-full px-5 py-4 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
          >
            <span className="font-semibold text-gray-800 text-base">{category.title}</span>
            {expandedCategory === key ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedCategory === key && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 space-y-2 max-h-64 overflow-y-auto">
              {category.questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleQuestionClick(q.question)}
                  disabled={isLoading}
                  className="block w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-50 py-2.5 px-3 rounded-lg transition-colors font-medium"
                >
                  {q.question}
                </button>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
})

