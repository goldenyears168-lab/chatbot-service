// components/chatbot/SuggestedQuestions.tsx
// 预测问题选项组件

'use client'

import { memo } from 'react'
import { Button } from '../ui/button'

interface SuggestedQuestionsProps {
  questions: string[]
  onQuestionClick: (question: string) => void
  isLoading?: boolean
}

export const SuggestedQuestions = memo(function SuggestedQuestions({
  questions,
  onQuestionClick,
  isLoading = false,
}: SuggestedQuestionsProps) {
  if (!questions || questions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {questions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onQuestionClick(question)}
          disabled={isLoading}
          className="text-xs bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors"
        >
          {question}
        </Button>
      ))}
    </div>
  )
})

