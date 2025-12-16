'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { EmptyState } from '../EmptyState'
import { CodeBlock } from '@/components/console/json-viewer/CodeBlock'
import { useToast } from '@/components/ui/use-toast'

interface AssetExamplesProps {
  assetKey: string
  assetData: unknown
}

interface Example {
  title: string
  content: unknown
  path: string
  whyItMatters: string
}

// Get "why it matters" explanation based on asset type and example
function getWhyItMatters(assetKey: string): string {
  switch (assetKey) {
    case 'services':
      return `這是服務項目的實際範例，展示價格、描述和特色，客戶會看到這些資訊來決定是否預約。`
    case 'company_info':
      return `這是分店的實際資訊，包含地址、電話、營業時間，用於導航和預約功能。`
    case 'faq_detailed':
      return `這是常見問題的實際範例，AI 會使用這些問答來回應客戶的詢問。`
    case 'ai_config':
      return `這是意圖識別的設定範例，決定 AI 如何理解用戶的訊息意圖。`
    case 'response_templates':
      return `這是回覆範本的實際範例，確保 AI 回覆的一致性和專業性。`
    case 'personas':
      return `這是客戶畫像的範例，用於提供個人化的服務體驗。`
    default:
      return `這是 ${assetKey} 的實際資料範例。`
  }
}


function getExamples(assetKey: string, data: unknown): Example[] {
  const examples: Example[] = []
  
  if (!data || typeof data !== 'object' || data === null) return examples
  
  const dataObj = data as Record<string, unknown>
  
  switch (assetKey) {
    case 'services':
      if (dataObj.services) {
        const services = Array.isArray(dataObj.services) ? dataObj.services : Object.values(dataObj.services)
        services.slice(0, 3).forEach((s: unknown, i: number) => {
          const serviceObj = typeof s === 'object' && s !== null ? s as Record<string, unknown> : {}
          examples.push({
            title: `服務範例 ${i + 1}: ${String(serviceObj.name || `服務 ${i + 1}`)}`,
            content: s,
            path: `services[${i}]`,
            whyItMatters: getWhyItMatters(assetKey)
          })
        })
      }
      break
      
    case 'company_info':
      if (dataObj.branches) {
        const branches = Array.isArray(dataObj.branches) ? dataObj.branches : Object.values(dataObj.branches)
        branches.slice(0, 3).forEach((b: unknown, i: number) => {
          const branchObj = typeof b === 'object' && b !== null ? b as Record<string, unknown> : {}
          const branchesObj = dataObj.branches as Record<string, unknown> | unknown[]
          examples.push({
            title: `分店範例 ${i + 1}: ${String(branchObj.name || `分店 ${i + 1}`)}`,
            content: b,
            path: Array.isArray(branchesObj) ? `branches[${i}]` : `branches.${Object.keys(branchesObj as Record<string, unknown>)[i]}`,
            whyItMatters: getWhyItMatters(assetKey)
          })
        })
      }
      break
      
    case 'faq_detailed':
      if (dataObj.categories && typeof dataObj.categories === 'object' && dataObj.categories !== null) {
        const categoriesObj = dataObj.categories as Record<string, unknown>
        const categories = Object.keys(categoriesObj)
        const firstCategoryKey = categories[0]
        if (firstCategoryKey) {
          const firstCategory = categoriesObj[firstCategoryKey]
          if (firstCategory && typeof firstCategory === 'object' && firstCategory !== null) {
            const categoryObj = firstCategory as Record<string, unknown>
            const questions = Array.isArray(categoryObj.questions) ? categoryObj.questions : []
            questions.slice(0, 3).forEach((q: unknown, i: number) => {
              const qObj = typeof q === 'object' && q !== null ? q as Record<string, unknown> : {}
              const question = String(qObj.question || '')
              examples.push({
                title: `FAQ 範例 ${i + 1}: ${question.substring(0, 40)}${question.length > 40 ? '...' : ''}`,
                content: q,
                path: `categories.${firstCategoryKey}.questions[${i}]`,
                whyItMatters: getWhyItMatters(assetKey)
              })
            })
          }
        }
      }
      break
      
    case 'ai_config':
      if (dataObj.intents) {
        const intents = Array.isArray(dataObj.intents) ? dataObj.intents : Object.values(dataObj.intents)
        intents.slice(0, 3).forEach((intent: unknown, i: number) => {
          const intentObj = typeof intent === 'object' && intent !== null ? intent as Record<string, unknown> : {}
          examples.push({
            title: `意圖範例 ${i + 1}: ${String(intentObj.id || `意圖 ${i + 1}`)}`,
            content: intent,
            path: `intents[${i}]`,
            whyItMatters: getWhyItMatters(assetKey)
          })
        })
      }
      break
      
    case 'response_templates':
      if (dataObj.templates) {
        const templates = Array.isArray(dataObj.templates) ? dataObj.templates : Object.entries(dataObj.templates)
        templates.slice(0, 3).forEach((template: unknown, i: number) => {
          const [key, value] = Array.isArray(template) ? template : [i, template]
          examples.push({
            title: `範本範例 ${i + 1}: ${String(key)}`,
            content: value || template,
            path: `templates.${String(key)}`,
            whyItMatters: getWhyItMatters(assetKey)
          })
        })
      }
      break
      
    case 'personas':
      if (dataObj.personas) {
        const personas = Array.isArray(dataObj.personas) ? dataObj.personas : Object.values(dataObj.personas)
        personas.slice(0, 3).forEach((persona: unknown, i: number) => {
          const personaObj = typeof persona === 'object' && persona !== null ? persona as Record<string, unknown> : {}
          examples.push({
            title: `角色範例 ${i + 1}: ${String(personaObj.id || personaObj.name || `角色 ${i + 1}`)}`,
            content: persona,
            path: `personas[${i}]`,
            whyItMatters: getWhyItMatters(assetKey)
          })
        })
      }
      break
  }
  
  return examples
}

export function AssetExamples({ assetKey, assetData }: AssetExamplesProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { toast } = useToast()
  const examples = getExamples(assetKey, assetData)
  
  if (examples.length === 0) {
    return <EmptyState message="暫無範例資料" icon="file" />
  }
  
  const handleCopySnippet = async (content: unknown, index: number) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2))
      setCopiedIndex(index)
      toast({
        title: '已複製',
        description: '範例內容已複製到剪貼簿',
        variant: 'success',
      })
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      toast({
        title: '複製失敗',
        description: '無法複製到剪貼簿',
        variant: 'destructive',
      })
    }
  }

  
  return (
    <div className="space-y-4">
      {examples.map((example, index) => (
        <Card key={index} className="bg-[var(--surface-glass)] backdrop-blur-md border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-soft)] transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{example.title}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopySnippet(example.content, index)}
                  className="h-7 text-xs gap-1.5"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      複製
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {example.whyItMatters}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-3">
              <CodeBlock
                code={JSON.stringify(example.content, null, 2)}
                language="json"
                showLineNumbers={true}
                maxHeight="300px"
                className="border-0"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
