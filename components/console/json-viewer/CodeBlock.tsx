'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface HighlightRange {
  line: number
  className?: string
}

interface CodeBlockProps {
  code: string
  language?: string
  highlightRanges?: HighlightRange[]
  searchTerm?: string
  showLineNumbers?: boolean
  maxHeight?: string
  className?: string
}

export function CodeBlock({
  code,
  language = 'json',
  highlightRanges = [],
  searchTerm,
  showLineNumbers = true,
  maxHeight = '60vh',
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Format code - always use pretty format (2 spaces) for JSON
  const formattedCode = React.useMemo(() => {
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(code), null, 2)
      } catch {
        return code
      }
    }
    return code
  }, [code, language])

  // Split code into lines
  const lines = formattedCode.split('\n')

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode)
      setCopied(true)
      toast({
        title: '已複製',
        description: '程式碼已複製到剪貼簿',
        variant: 'success',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: '複製失敗',
        description: '無法複製到剪貼簿',
        variant: 'destructive',
      })
    }
  }

  // Handle search highlight
  const shouldHighlightLine = (lineIndex: number, line: string): boolean => {
    if (searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true
    }
    return highlightRanges.some((range) => range.line === lineIndex + 1)
  }

  // Scroll to highlighted line
  useEffect(() => {
    if (highlightRanges.length > 0 && highlightRanges[0]) {
      const firstHighlight = highlightRanges[0]
      const lineElement = codeRef.current?.querySelector(
        `[data-line="${firstHighlight.line}"]`
      )
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [highlightRanges])

  return (
    <Card className={cn('overflow-hidden bg-[var(--surface-elevated)] border-[var(--border-subtle)]', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-end border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--neutral-50)] to-[var(--neutral-100)] px-4 py-2.5 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 text-xs hover:bg-[var(--primary-50)] hover:text-[var(--primary-600)]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              已複製
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              複製
            </>
          )}
        </Button>
      </div>

      {/* Code Content */}
      <div
        ref={codeRef}
        className="relative overflow-auto bg-gradient-to-br from-[var(--neutral-50)] to-white"
        style={{ maxHeight }}
      >
        <pre
          className="text-xs md:text-sm font-mono leading-relaxed p-4 whitespace-pre-wrap break-words"
        >
          <code className="block">
            {lines.map((line, index) => {
              const lineNumber = index + 1
              const isHighlighted = shouldHighlightLine(index, line)
              const isEmpty = line.trim() === ''

              return (
                <div
                  key={index}
                  data-line={lineNumber}
                  className={cn(
                    'flex items-start gap-4 px-2 py-0.5',
                    isHighlighted && 'bg-yellow-200/50 dark:bg-yellow-900/30',
                    'hover:bg-muted/60 transition-colors'
                  )}
                >
                  {showLineNumbers && (
                    <span className="select-none text-muted-foreground text-right min-w-[3rem] font-normal">
                      {lineNumber}
                    </span>
                  )}
                  <span
                    className={cn(
                      'flex-1',
                      isEmpty && 'text-transparent select-none'
                    )}
                  >
                    {isEmpty ? '\u00A0' : line}
                  </span>
                </div>
              )
            })}
          </code>
        </pre>
      </div>
    </Card>
  )
}

