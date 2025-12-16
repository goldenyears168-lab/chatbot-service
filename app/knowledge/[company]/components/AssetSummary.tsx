'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

interface AssetSummaryProps {
  assetKey: string
  assetData: any
}

const assetSummaries: Record<string, {
  whatItDoes: string
  whereUsed: string[]
  keyGuarantees: string[]
  risks: string[]
}> = {
  'services': {
    whatItDoes: '定義您提供的所有服務項目、價格範圍和特色說明，是客戶了解服務的第一手資料。',
    whereUsed: ['FAQ', 'Pricing', 'Widget'],
    keyGuarantees: ['價格一致性', '服務資訊可版本化', '支援多語言展示'],
    risks: ['價格資訊缺失會導致報價錯誤', '服務描述不準確會影響客戶期望']
  },
  'company_info': {
    whatItDoes: '儲存專案基本資訊、聯絡方式、服務說明等，確保所有渠道展示一致。',
    whereUsed: ['FAQ', 'Routing', 'Widget'],
    keyGuarantees: ['資訊一致性', '多分店支援', '即時更新'],
    risks: ['地址錯誤會導致客戶找不到門店', '營業時間不準確會影響預約']
  },
  'faq_detailed': {
    whatItDoes: '包含所有常見問題和答案，支援分類管理，是 AI 聊天機器人的核心知識庫。',
    whereUsed: ['FAQ', 'Chat', 'Routing'],
    keyGuarantees: ['問題涵蓋全面', '答案準確性', '分類可管理'],
    risks: ['問題缺失會導致 AI 無法回答', '答案過時會影響客戶體驗']
  },
  'ai_config': {
    whatItDoes: '設定 AI 的意圖識別規則和實體提取模式，決定 AI 如何理解用戶意圖和提取關鍵資訊。',
    whereUsed: ['Routing', 'Chat', 'Persona'],
    keyGuarantees: ['意圖識別準確性', '可設定優先級', '支援上下文判斷'],
    risks: ['設定錯誤會導致意圖識別失敗', '關鍵詞衝突會影響匹配準確性']
  },
  'response_templates': {
    whatItDoes: '定義針對不同意圖的標準回覆範本，確保 AI 回覆的一致性和專業性。',
    whereUsed: ['Chat', 'Routing'],
    keyGuarantees: ['回覆一致性', '多意圖支援', '可版本化管理'],
    risks: ['範本缺失會導致 AI 回覆不專業', '範本過時會影響客戶體驗']
  },
  'personas': {
    whatItDoes: '定義不同客戶畫像的個人化回覆策略，讓 AI 能夠針對不同客戶類型提供客製化服務。',
    whereUsed: ['Persona', 'Chat', 'Routing'],
    keyGuarantees: ['個人化服務', '客戶畫像匹配', '策略可設定'],
    risks: ['畫像設定錯誤會導致回覆不匹配', '策略缺失會影響個人化效果']
  }
}

export function AssetSummary({ assetKey }: AssetSummaryProps) {
  const summary = assetSummaries[assetKey] || {
    whatItDoes: '此資產用於設定和儲存系統運行所需的關鍵資訊。',
    whereUsed: [],
    keyGuarantees: [],
    risks: []
  }

  return (
    <div className="space-y-4">
      {/* What it does */}
      <Card className="bg-[var(--surface-base)] border-[var(--border-subtle)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            用途说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">{summary.whatItDoes}</p>
        </CardContent>
      </Card>

      {/* Where it's used */}
      {summary.whereUsed.length > 0 && (
        <Card className="bg-[var(--surface-base)] border-[var(--border-subtle)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              影响范围
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.whereUsed.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs font-medium">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key guarantees */}
      {summary.keyGuarantees.length > 0 && (
        <Card className="bg-[var(--surface-base)] border-[var(--border-subtle)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              核心保障
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.keyGuarantees.map((guarantee, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{guarantee}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risks */}
      {summary.risks.length > 0 && (
        <Card className="bg-gradient-to-br from-[var(--accent-amber-50)]/60 to-yellow-50/40 border-[var(--accent-amber-200)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              注意事项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.risks.map((risk, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

