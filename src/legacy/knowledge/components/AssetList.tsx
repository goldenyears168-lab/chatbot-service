'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Database, 
  Settings, 
  MessageSquare,
  Building2,
  FileText,
  Info,
  Search,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AssetListProps {
  files: Array<{
    filename: string
    name: string
    key: string
    size: number
    lastModified: string
    stats: Record<string, any>
  }>
  selectedKey: string | null
  onSelect: (key: string) => void
}

const getFileIcon = (key: string) => {
  switch (key) {
    case 'services': return <Database className="w-4 h-4" />
    case 'company_info': return <Building2 className="w-4 h-4" />
    case 'faq_detailed': return <MessageSquare className="w-4 h-4" />
    case 'ai_config': return <Settings className="w-4 h-4" />
    case 'response_templates': return <FileText className="w-4 h-4" />
    case 'personas': return <Info className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

const getFileTitle = (key: string, name: string) => {
  const titles: Record<string, string> = {
    'services': '服務資訊',
    'company_info': '專案資訊',
    'faq_detailed': 'FAQ 詳細資料',
    'ai_config': 'AI 設定',
    'response_templates': '回覆範本',
    'personas': '角色設定'
  }
  return titles[key] || name
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AssetList({ files, selectedKey, onSelect }: AssetListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredFiles = files.filter(file => 
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getFileTitle(file.key, file.name).toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="搜尋資產..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      
      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {filteredFiles.map((file) => (
          <Card
            key={file.filename}
            className={cn(
              "bg-[var(--surface-glass)] backdrop-blur-md border-[var(--border-subtle)] cursor-pointer transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-soft)]",
              selectedKey === file.key && "border-[var(--primary-400)] shadow-[var(--shadow-xl)] bg-gradient-to-br from-[var(--primary-50)]/40 to-[var(--accent-purple-100)]/40 ring-2 ring-[var(--primary-200)]/50"
            )}
            onClick={() => onSelect(file.key)}
          >
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary-400)]/20 to-[var(--accent-purple-500)]/20 rounded-xl flex items-center justify-center text-[var(--primary-600)] shadow-[var(--shadow-xs)] shrink-0 mt-0.5 backdrop-blur-sm border border-[var(--primary-200)]/30">
                  {getFileIcon(file.key)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {getFileTitle(file.key, file.name)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                    {file.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {formatFileSize(file.size)}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(file.lastModified).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

