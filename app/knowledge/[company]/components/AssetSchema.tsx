'use client'

import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Hash, Copy, Check } from 'lucide-react'
import { EmptyState } from '../EmptyState'
import { useToast } from '@/components/ui/use-toast'

interface AssetSchemaProps {
  assetKey: string
  assetData: any
}

interface SchemaField {
  key: string
  type: string
  required: boolean
  description: string
  example?: string
}

// Get value at path
function getValueAtPath(data: any, path: string): any {
  const keys = path.split('.')
  let value = data
  for (const key of keys) {
    if (value === null || value === undefined) return undefined
    if (Array.isArray(value) && /\[\d+\]/.test(key)) {
      const match = key.match(/\[(\d+)\]/)
      if (match && match[1]) {
        const index = parseInt(match[1])
        if (!isNaN(index)) {
          value = value[index]
        } else {
          return undefined
        }
      } else {
        return undefined
      }
    } else {
      value = value[key]
    }
  }
  return value
}

// Format example value for display
function formatExample(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') {
    return value.length > 50 ? value.substring(0, 50) + '...' : value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return `[${value.length} 項]`
  }
  if (typeof value === 'object') {
    return `{${Object.keys(value).length} 個欄位}`
  }
  return String(value)
}

function extractSchema(data: any, prefix = '', assetData: any): SchemaField[] {
  const schema: SchemaField[] = []
  
  if (!data || typeof data !== 'object') {
    return schema
  }
  
  if (Array.isArray(data)) {
    if (data.length > 0) {
      const itemSchema = extractSchema(data[0], prefix, assetData)
      schema.push(...itemSchema)
    }
    return schema
  }
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip comment fields
    if (key.startsWith('_')) {
      return
    }
    
    const fullKey = prefix ? `${prefix}.${key}` : key
    const valueType = Array.isArray(value) ? 'array' : typeof value
    const isRequired = value !== null && value !== undefined
    
    // Get description from _field_description if available
    let description = ''
    if (data._field_description && data._field_description[key]) {
      description = String(data._field_description[key])
    }
    
    // Get example value
    let example: string | undefined
    try {
      const exampleValue = getValueAtPath(assetData, fullKey)
      example = formatExample(exampleValue)
    } catch {
      example = undefined
    }
    
    schema.push({
      key: fullKey,
      type: valueType,
      required: isRequired,
      description,
      example
    })
    
    // Recursively process nested objects
    if (valueType === 'object' && !Array.isArray(value) && value !== null) {
      const nestedSchema = extractSchema(value, fullKey, assetData)
      schema.push(...nestedSchema)
    }
  })
  
  return schema
}

export function AssetSchema({ assetData }: AssetSchemaProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedPathIndex, setCopiedPathIndex] = useState<number | null>(null)
  const { toast } = useToast()
  
  if (!assetData) {
    return <EmptyState message="暫無 Schema 資料" icon="file" />
  }
  
  const allSchema = extractSchema(assetData, '', assetData)
  
  // Filter schema based on search term
  const filteredSchema = useMemo(() => {
    if (!searchTerm) return allSchema
    const lowerSearch = searchTerm.toLowerCase()
    return allSchema.filter(
      (field) =>
        field.key.toLowerCase().includes(lowerSearch) ||
        field.type.toLowerCase().includes(lowerSearch) ||
        field.description.toLowerCase().includes(lowerSearch) ||
        (field.example && field.example.toLowerCase().includes(lowerSearch))
    )
  }, [allSchema, searchTerm])
  
  if (allSchema.length === 0) {
    return <EmptyState message="無法提取 Schema" icon="file" />
  }
  
  const handleCopyPath = async (path: string, index: number) => {
    try {
      await navigator.clipboard.writeText(path)
      setCopiedPathIndex(index)
      toast({
        title: '已複製',
        description: `路徑 ${path} 已複製`,
        variant: 'success',
      })
      setTimeout(() => setCopiedPathIndex(null), 2000)
    } catch (err) {
      toast({
        title: '複製失敗',
        description: '無法複製路徑',
        variant: 'destructive',
      })
    }
  }

  const handleCopyExample = async (example: string) => {
    try {
      await navigator.clipboard.writeText(example)
      toast({
        title: '已複製',
        description: '範例值已複製',
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: '複製失敗',
        description: '無法複製範例',
        variant: 'destructive',
      })
    }
  }
  
  return (
    <Card className="bg-[var(--surface-base)] border-[var(--border-subtle)]">
      <CardHeader className="pb-4 space-y-3">
        <CardTitle className="text-base font-semibold">資料結構</CardTitle>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="搜尋欄位、類型、說明..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm w-full"
            />
          </div>
          {searchTerm && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
              <span className="font-medium">
                找到 <span className="text-foreground font-semibold">{filteredSchema.length}</span> / {allSchema.length} 個欄位
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <div className="w-full [&>div]:overflow-x-visible [&>div>table]:w-full">
          <Table className="table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">欄位名</TableHead>
                <TableHead className="w-[10%]">類型</TableHead>
                <TableHead className="w-[8%]">必填</TableHead>
                <TableHead className="w-[32%]">說明</TableHead>
                <TableHead className="w-[25%]">範例</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchema.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm">沒有找到符合搜尋條件的欄位</p>
                      {searchTerm && (
                        <p className="text-xs text-muted-foreground">嘗試使用不同的關鍵字</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchema.map((field, index) => (
                  <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs py-3 align-top">
                      <div className="flex items-start gap-2 group">
                        <span className="break-words break-all leading-relaxed">{field.key}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPath(field.key, index)}
                          className="h-7 w-7 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="複製路徑"
                        >
                          {copiedPathIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Hash className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <Badge variant="outline" className="text-xs font-mono font-medium">
                        {field.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      {field.required ? (
                        <Badge variant="default" className="text-xs font-medium">是</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">否</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-3 align-top">
                      <span className="break-words leading-relaxed">{field.description || <span className="text-muted-foreground/50">-</span>}</span>
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      {field.example ? (
                        <div className="flex items-start gap-2 group">
                          <span className="font-mono text-xs text-muted-foreground break-words break-all leading-relaxed flex-1 min-w-0">
                            {field.example}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyExample(field.example!)}
                            className="h-7 w-7 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="複製範例"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
