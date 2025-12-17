'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search } from 'lucide-react'
import { EmptyState } from '../EmptyState'
import { CodeBlock } from '@/components/console/json-viewer/CodeBlock'

interface AssetRawJSONProps {
  assetData: any
  filename: string
  highlightPath?: string | null
}

// Helper to find line numbers for a given path
function findPathInJSON(data: unknown, path: string, jsonString: string): number[] {
  if (!path || !data) return []
  
  try {
    const keys = path.split(/[\.\[\]]/).filter(k => k)
    let value: any = data
    for (const key of keys) {
      if (value === null || value === undefined) return []
      if (Array.isArray(value)) {
        const index = parseInt(key)
        if (isNaN(index)) return []
        value = value[index]
      } else if (typeof value === 'object' && value !== null) {
        value = value[key]
      } else {
        return []
      }
    }
    
    // Find the line number by searching for the value in the JSON string
    if (value === undefined || value === null) return []
    
    const valueStr = JSON.stringify(value, null, 2)
    if (!valueStr) return []
    
    const lines = jsonString.split('\n')
    const matchingLines: number[] = []
    const valueLines = valueStr.split('\n')
    const firstLineOfValue = valueLines && valueLines.length > 0 ? valueLines[0] : ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line && (line.includes(path) || (firstLineOfValue && line.includes(firstLineOfValue)))) {
        matchingLines.push(i + 1)
      }
    }
    
    return matchingLines.length > 0 ? matchingLines : []
  } catch {
    return []
  }
}

export function AssetRawJSON({ assetData, filename, highlightPath }: AssetRawJSONProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  if (!assetData) {
    return <EmptyState message="暫無 JSON 資料" icon="file" />
  }
  
  const jsonString = JSON.stringify(assetData, null, 2)
  
  // Calculate highlight ranges from path
  const highlightRanges = highlightPath
    ? findPathInJSON(assetData, highlightPath, jsonString).map(line => ({ line }))
    : []
  
  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <Card className="bg-[var(--surface-base)] border-[var(--border-subtle)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold">完整 JSON</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜尋..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-48 h-8 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              下載
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <CodeBlock
          code={jsonString}
          language="json"
          searchTerm={searchTerm}
          highlightRanges={highlightRanges}
          showLineNumbers={true}
          maxHeight="60vh"
          className="border-0 rounded-none"
        />
      </CardContent>
    </Card>
  )
}

