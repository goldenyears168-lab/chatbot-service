'use client'

import * as React from 'react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Edit, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiffChange {
  path: string
  type: 'added' | 'removed' | 'changed'
  before?: unknown
  after?: unknown
}

interface JsonDiffViewerProps {
  prev: unknown
  next: unknown
  className?: string
}

// Simple diff algorithm for JSON objects
function computeDiff(prev: unknown, next: unknown, path = ''): DiffChange[] {
  const changes: DiffChange[] = []

  // Handle null/undefined
  if (prev === null || prev === undefined) {
    if (next !== null && next !== undefined) {
      changes.push({ path, type: 'added', after: next })
    }
    return changes
  }

  if (next === null || next === undefined) {
    changes.push({ path, type: 'removed', before: prev })
    return changes
  }

  // Handle primitives
  if (typeof prev !== 'object' || typeof next !== 'object') {
    if (prev !== next) {
      changes.push({ path, type: 'changed', before: prev, after: next })
    }
    return changes
  }

  // Handle arrays (simple comparison)
  if (Array.isArray(prev) || Array.isArray(next)) {
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      changes.push({ path, type: 'changed', before: prev, after: next })
    }
    return changes
  }

  // Handle objects
  const prevObj = prev as Record<string, unknown>
  const nextObj = next as Record<string, unknown>
  const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)])

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key
    const prevValue = prevObj[key]
    const nextValue = nextObj[key]

    if (!(key in prevObj)) {
      // Added
      changes.push({ path: currentPath, type: 'added', after: nextValue })
    } else if (!(key in nextObj)) {
      // Removed
      changes.push({ path: currentPath, type: 'removed', before: prevValue })
    } else {
      // Recursively check nested objects
      changes.push(...computeDiff(prevValue, nextValue, currentPath))
    }
  }

  return changes
}

// Format value for display
function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') {
    return value.length > 100 ? value.substring(0, 100) + '...' : `"${value}"`
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
  }
  return String(value)
}

export function JsonDiffViewer({ prev, next, className }: JsonDiffViewerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const changes = React.useMemo(() => {
    return computeDiff(prev, next)
  }, [prev, next])

  const summary = React.useMemo(() => {
    return {
      added: changes.filter((c) => c.type === 'added').length,
      removed: changes.filter((c) => c.type === 'removed').length,
      changed: changes.filter((c) => c.type === 'changed').length,
    }
  }, [changes])

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  if (changes.length === 0) {
    return (
      <Card className={cn('bg-card border-border', className)}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">沒有發現變更</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">變更摘要</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                <Plus className="w-3 h-3 mr-1" />
                {summary.added}
              </Badge>
              <Badge variant="default" className="bg-red-600">
                <Minus className="w-3 h-3 mr-1" />
                {summary.removed}
              </Badge>
              <Badge variant="default" className="bg-yellow-600">
                <Edit className="w-3 h-3 mr-1" />
                {summary.changed}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {changes.map((change, index) => {
            const isExpanded = expandedPaths.has(change.path)
            const hasComplexValue: boolean = 
              (change.before && typeof change.before === 'object') ||
              (change.after && typeof change.after === 'object')
                ? true
                : false

            return (
              <div
                key={index}
                className={cn(
                  'border rounded-lg p-3 transition-colors',
                  change.type === 'added' && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                  change.type === 'removed' && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                  change.type === 'changed' && 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {change.type === 'added' && (
                        <Plus className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                      {change.type === 'removed' && (
                        <Minus className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      {change.type === 'changed' && (
                        <Edit className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      )}
                      <code className="text-xs font-mono text-foreground break-all">
                        {change.path || '(root)'}
                      </code>
                    </div>
                    
                    {change.type === 'removed' && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">移除：</span>
                        <span className="font-mono ml-2">
                          {hasComplexValue && !isExpanded ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePath(change.path)}
                              className="h-6 text-xs"
                            >
                              展開...
                            </Button>
                          ) : (
                            formatValue(change.before)
                          )}
                        </span>
                      </div>
                    )}
                    
                    {change.type === 'added' && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">新增：</span>
                        <span className="font-mono ml-2">
                          {hasComplexValue && !isExpanded ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePath(change.path)}
                              className="h-6 text-xs"
                            >
                              展開...
                            </Button>
                          ) : (
                            formatValue(change.after)
                          )}
                        </span>
                      </div>
                    )}
                    
                    {change.type === 'changed' && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">之前：</span>
                          <span className="font-mono ml-2">
                            {hasComplexValue && !isExpanded ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePath(change.path)}
                                className="h-6 text-xs"
                              >
                                展開...
                              </Button>
                            ) : (
                              formatValue(change.before)
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">之後：</span>
                          <span className="font-mono ml-2">
                            {hasComplexValue && !isExpanded ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePath(change.path)}
                                className="h-6 text-xs"
                              >
                                展開...
                              </Button>
                            ) : (
                              formatValue(change.after)
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {isExpanded && hasComplexValue && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                        <pre className="whitespace-pre-wrap">
                          {(() => {
                            const content = change.type === 'removed' 
                              ? JSON.stringify(change.before, null, 2)
                              : change.type === 'added'
                              ? JSON.stringify(change.after, null, 2)
                              : `Before:\n${JSON.stringify(change.before, null, 2)}\n\nAfter:\n${JSON.stringify(change.after, null, 2)}`
                            return String(content ?? '')
                          })()}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

