'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ConsoleH2, ConsoleMeta, ConsoleCodeInline } from '@/components/console/typography'
// Format file size utility
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface AssetHeaderProps {
  file: {
    name: string
    filename: string
    lastModified: string
    size: number
    data: any
  }
}

export function AssetHeader({ file }: AssetHeaderProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(file.data, null, 2)
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      toast({
        title: '已複製',
        description: 'JSON 已複製到剪貼簿',
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

  const handleDownload = () => {
    try {
      const jsonString = JSON.stringify(file.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: '下載成功',
        description: `已下載 ${file.filename}`,
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: '下載失敗',
        description: '無法下載檔案',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <ConsoleH2 className="mb-2">{file.name}</ConsoleH2>
          <div className="flex flex-wrap items-center gap-4">
            <ConsoleCodeInline>{file.filename}</ConsoleCodeInline>
            <ConsoleMeta>最後更新：{formatDate(file.lastModified)}</ConsoleMeta>
            <ConsoleMeta>大小：{formatFileSize(file.size)}</ConsoleMeta>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已複製
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                複製
              </>
            )}
          </Button>
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
    </div>
  )
}

