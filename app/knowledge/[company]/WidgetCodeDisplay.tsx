'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Settings } from 'lucide-react'

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
            Widget 嵌入代码
          </CardTitle>
          <Button
            onClick={handleCopy}
            variant="default"
            size="default"
            className="gap-2 font-semibold text-sm px-5 py-5 h-auto shadow-sm hover:shadow-md transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                已复制 ✓
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制代码
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <p className="text-sm text-foreground leading-relaxed font-medium">
          将以下代码添加到您的网站 <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono font-semibold">&lt;body&gt;</code> 标签结束前：
        </p>
        <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed border border-slate-800 shadow-inner">
          <code>{widgetCode}</code>
        </pre>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed font-medium flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>提示：复制代码后，粘贴到您的网站 HTML 中即可使用聊天机器人。</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

