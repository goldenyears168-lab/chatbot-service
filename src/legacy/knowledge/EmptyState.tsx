'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, Inbox } from 'lucide-react'

interface EmptyStateProps {
  message?: string
  description?: string
  icon?: 'file' | 'inbox'
}

export function EmptyState({ 
  message = '暫無資料', 
  description,
  icon = 'inbox'
}: EmptyStateProps) {
  const IconComponent = icon === 'file' ? FileQuestion : Inbox

  return (
    <Card className="border-border bg-muted/30">
      <CardContent className="pt-8 pb-8 px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <IconComponent className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-2">{message}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-md">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

