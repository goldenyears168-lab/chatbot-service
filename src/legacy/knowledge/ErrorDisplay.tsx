'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
  error: string | Error
  onRetry?: () => void
  title?: string
}

export function ErrorDisplay({ error, onRetry, title = '載入失敗' }: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6 pb-6 px-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1.5">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重試
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

