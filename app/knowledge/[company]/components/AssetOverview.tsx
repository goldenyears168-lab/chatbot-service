'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  BookOpen, 
  Database, 
  MessageSquare,
  Settings,
  FileText,
  Building2,
  Info
} from 'lucide-react'

interface AssetOverviewProps {
  totalFiles: number
  totalSize: number
  files: Array<{
    key: string
    stats: Record<string, any>
  }>
}

const assetCategories = {
  'services': { name: '服務資訊', icon: Database, color: 'bg-blue-50 text-blue-600' },
  'company_info': { name: '專案資訊', icon: Building2, color: 'bg-purple-50 text-purple-600' },
  'faq_detailed': { name: 'FAQ 詳細資料', icon: MessageSquare, color: 'bg-green-50 text-green-600' },
  'ai_config': { name: 'AI 設定', icon: Settings, color: 'bg-orange-50 text-orange-600' },
  'response_templates': { name: '回覆範本', icon: FileText, color: 'bg-pink-50 text-pink-600' },
  'personas': { name: '角色設定', icon: Info, color: 'bg-indigo-50 text-indigo-600' }
}

export function AssetOverview({ totalFiles, totalSize, files }: AssetOverviewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryStats = () => {
    const stats: Record<string, { count: number; items: any[] }> = {}
    files.forEach(file => {
      if (!stats[file.key]) {
        stats[file.key] = { count: 0, items: [] }
      }
      const stat = stats[file.key]
      if (stat) {
        stat.count++
        stat.items.push(file)
      }
    })
    return stats
  }

  const categoryStats = getCategoryStats()

  return (
    <div className="space-y-6">
      {/* 總覽統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-xl)] hover:border-[var(--primary-200)] transition-all duration-300">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-muted-foreground">知識資產</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{totalFiles}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 via-pink-50/50 to-purple-50 border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-xl)] hover:border-[var(--accent-purple-200)] transition-all duration-300">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-muted-foreground">總大小</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{formatFileSize(totalSize)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {(() => {
          const faqFile = files.find(f => f.key === 'faq_detailed')
          const totalQuestions = faqFile?.stats?.totalQuestions
          return totalQuestions ? (
            <Card className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-50 border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-xl)] hover:border-[var(--accent-emerald-200)] transition-all duration-300">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-muted-foreground">FAQ 問題</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{totalQuestions}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null
        })()}
        
        {(() => {
          const servicesFile = files.find(f => f.key === 'services')
          const serviceCount = servicesFile?.stats?.count
          return serviceCount ? (
            <Card className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50 border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-xl)] hover:border-[var(--accent-amber-200)] transition-all duration-300">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-muted-foreground">服務項目</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{serviceCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                    <Database className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null
        })()}
      </div>

      {/* 資產分類 */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">資產分類</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(assetCategories).map(([key, category]) => {
            const stats = categoryStats[key]
            if (!stats || stats.count === 0) return null
            
            const Icon = category.icon
            return (
              <Card key={key} className="bg-[var(--surface-glass)] backdrop-blur-md border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-soft)] transition-all duration-300">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{stats.count} 個檔案</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

