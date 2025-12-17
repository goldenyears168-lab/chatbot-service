'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WidgetCodeDisplayProps {
  companyId: string
  baseUrl: string
}

export function WidgetCodeDisplay({ companyId, baseUrl }: WidgetCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const widgetCode = `<script>
  window.smartBotConfig = {
    companyId: "${companyId}",
    themeColor: "#667eea",
    autoOpen: false
  };
</script>
<script src="${baseUrl}/widget/widget.js" async></script>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(widgetCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="bg-card border-border shadow-sm mb-6">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="w-4 h-4 text-muted-foreground" />
            Widget 嵌入程式碼
          </CardTitle>
          <Button
            onClick={handleCopy}
            variant="default"
            size="default"
            className={cn(
              "gap-2.5 font-semibold text-sm px-6 py-3 h-auto",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200 ease-in-out",
              "border-2",
              "min-w-[140px]",
              "relative overflow-hidden",
              "cursor-pointer",
              copied
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-green-400 scale-105"
                : "border-transparent hover:scale-105 active:scale-95"
            )}
          >
            <span className={cn(
              "relative z-10 flex items-center gap-2.5",
              copied && "text-white"
            )}>
              {copied ? (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>已複製</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>複製程式碼</span>
                </>
              )}
            </span>
            {copied && (
              <span className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <p className="text-sm text-foreground leading-relaxed font-medium">
          將以下程式碼新增到您的網站 <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono font-semibold">&lt;body&gt;</code> 標籤結束前：
        </p>
        <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed border border-slate-800 shadow-inner">
          <code>{widgetCode}</code>
        </pre>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
          <p className="text-xs text-amber-900 dark:text-amber-50 leading-relaxed font-medium flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>提示：複製程式碼後，貼上到您的網站 HTML 中即可使用聊天機器人。</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

