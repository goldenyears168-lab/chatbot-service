'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorDisplay } from './ErrorDisplay'
import { EmptyState } from './EmptyState'

interface KnowledgeFile {
  filename: string
  name: string
  key: string
  data: unknown
  stats: Record<string, unknown>
}

interface KnowledgeViewerProps {
  file: KnowledgeFile
}

export function KnowledgeViewer({ file }: KnowledgeViewerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'json'>('preview')
  const [renderError, setRenderError] = useState<Error | null>(null)
  
  // 資料驗證（必須在 Hooks 之後）
  if (!file) {
    return <EmptyState message="檔案資料載入失敗" icon="file" />
  }
  
  if (!file.data) {
    return <EmptyState message="該檔案暫無資料" description="檔案可能為空或資料格式不正確" icon="file" />
  }
  
  const renderPreview = () => {
    try {
      switch (file.key) {
        case 'services':
          return renderServices(file.data)
        case 'company_info':
          return renderCompanyInfo(file.data)
        case 'faq_detailed':
          return renderFAQ(file.data)
        case 'ai_config':
          return renderAIConfig(file.data)
        case 'response_templates':
          return renderTemplates(file.data)
        default:
          return renderJSON(file.data)
      }
    } catch (error) {
      setRenderError(error instanceof Error ? error : new Error('渲染內容時發生錯誤'))
      return null
    }
  }
  
  if (renderError) {
    return <ErrorDisplay error={renderError} title="內容渲染失敗" />
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={viewMode === 'preview' ? 'default' : 'secondary'}
          size="default"
          onClick={() => setViewMode('preview')}
          className="text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md transition-all"
        >
          預覽模式
        </Button>
        <Button
          variant={viewMode === 'json' ? 'default' : 'secondary'}
          size="default"
          onClick={() => setViewMode('json')}
          className="text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md transition-all"
        >
          JSON 格式
        </Button>
      </div>
      
      <Card className="bg-muted/30 border-border">
        <CardContent className="pt-4 px-4 pb-4">
          <div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.2) transparent' }}>
            {viewMode === 'preview' ? (
              <div className="text-sm space-y-3 leading-relaxed">
                {renderPreview()}
              </div>
            ) : (
              <pre className="text-xs bg-background p-4 rounded-lg border border-border overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(file.data, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function renderServices(data: unknown) {
  if (!data || typeof data !== 'object') {
    return <EmptyState message="暫無服務資訊" icon="file" />
  }
  
  const dataObj = data as Record<string, unknown>
  const services = dataObj.services 
    ? (Array.isArray(dataObj.services) ? dataObj.services : Object.values(dataObj.services))
    : []
  
  if (!services || services.length === 0) {
    return <EmptyState message="暫無服務資訊" icon="file" />
  }
  
  return (
    <div className="space-y-3">
      {services.map((service: unknown, index: number) => {
        const serviceObj = typeof service === 'object' && service !== null ? service as Record<string, unknown> : {}
        return (
          <div key={index} className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-1.5 text-base">{String(serviceObj.name || `服務 ${index + 1}`)}</h4>
            {String(serviceObj.one_line) && (
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{String(serviceObj.one_line)}</p>
            )}
            {String(serviceObj.price_range) && (
              <p className="text-xs text-muted-foreground font-medium">價格: {String(serviceObj.price_range || "")}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderCompanyInfo(data: unknown) {
  if (!data || typeof data !== 'object') {
    return <EmptyState message="暫無專案資訊" icon="file" />
  }
  
  const dataObj = data as Record<string, unknown>
  const branches = dataObj.branches 
    ? (Array.isArray(dataObj.branches) ? dataObj.branches : Object.values(dataObj.branches))
    : []
  
  if (!branches || branches.length === 0) {
    if (!('contact_channels' in dataObj) && !('contact' in dataObj)) {
      return <EmptyState message="暫無專案資訊" icon="file" />
    }
  }
  
  return (
    <div className="space-y-4">
      {branches.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">分店資訊</h4>
          {branches.map((branch: unknown, index: number) => {
            const branchObj = typeof branch === "object" && branch !== null ? branch as Record<string, unknown> : {}
            return (
              <div key={index} className="bg-background p-4 rounded-lg border border-border mb-3">
                <h5 className="font-semibold text-foreground mb-1.5">{String(branchObj.name || "")}</h5>
                {String(branchObj.address) && (
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{String(branchObj.address || "")}</p>
                )}
                {String(branchObj.phone) && (
                  <p className="text-xs text-muted-foreground mt-2 font-medium">電話: {String(branchObj.phone || "")}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {((dataObj.contact_channels !== undefined && dataObj.contact_channels !== null) || (dataObj.contact !== undefined && dataObj.contact !== null)) && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">聯絡方式</h4>
          <div className="bg-background p-4 rounded-lg border border-border">
            {dataObj.contact_channels && typeof dataObj.contact_channels === 'object' && dataObj.contact_channels !== null && 'email' in dataObj.contact_channels && (
              <p className="text-sm text-muted-foreground mb-1.5">Email: {String((dataObj.contact_channels as Record<string, unknown>).email || '')}</p>
            )}
            {dataObj.contact_channels && typeof dataObj.contact_channels === 'object' && dataObj.contact_channels !== null && 'phone' in dataObj.contact_channels && (
              <p className="text-sm text-muted-foreground">電話: {String((dataObj.contact_channels as Record<string, unknown>).phone || '')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function renderFAQ(data: unknown) {
  if (!data || typeof data !== 'object') {
    return <EmptyState message="暫無資料" icon="file" />
  }
  
  const dataObj = data as Record<string, unknown>
  
  if (!dataObj.categories || typeof dataObj.categories !== 'object') {
    return <EmptyState message="暫無 FAQ 資料" icon="file" />
  }
  
  const categories = Object.keys(dataObj.categories)
  
  if (categories.length === 0) {
    return <EmptyState message="暫無 FAQ 資料" icon="file" />
  }
  
  return (
    <div className="space-y-4">
      {categories.map((catKey: string) => {
        const category = dataObj.categories[catKey]
        const questions = category?.questions || []
        
        return (
          <div key={catKey} className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3 text-base">{category?.title || catKey}</h4>
            <div className="space-y-3">
              {questions.map((q: unknown, index: number) => {
                const qObj = typeof q === "object" && q !== null ? q as Record<string, unknown> : {}
                return (
                  <div key={index} className="text-sm">
                    <p className="text-foreground font-semibold mb-1">Q: {String(qObj.question || "")}</p>
                    <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">{String(qObj.answer || "")}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })
    </div>
  )
}

function renderAIConfig(data: unknown) {
  if (!data || typeof data !== 'object') {
    return <EmptyState message="暫無資料" icon="file" />
  }
  
  const dataObj = data as Record<string, unknown>
  if (!data) {
    return <EmptyState message="暫無 AI 設定資料" icon="file" />
  }
  
  const intents = dataObj.intents 
    ? (Array.isArray(dataObj.intents) ? dataObj.intents : Object.values(dataObj.intents))
    : []
  const entityPatterns = dataObj.entity_patterns || {}
  
  if (intents.length === 0 && Object.keys(entityPatterns).length === 0) {
    return <EmptyState message="暫無 AI 設定資料" icon="file" />
  }
  
  return (
    <div className="space-y-4">
      {intents.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">意圖識別 ({String(intents.length || "")} 個)</h4>
          <div className="space-y-3">
            {intents.map((intent: unknown, index: number) => {
              const intentObj = typeof intent === "object" && intent !== null ? intent as Record<string, unknown> : {}
              return (
                <div key={String(intentObj.id) || index} className="bg-background p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-foreground text-sm mb-1">
                      {String(intentObj.id) || `意圖 ${index + 1}`}
                    </h5>
                    {String(intentObj._comment) && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{String(intentObj._comment || "")}</p>
                    )}
                  </div>
                  {intentObj.priority !== undefined && (
                    <span className="text-xs bg-muted px-2 py-1 rounded font-medium shrink-0 ml-2">
                      優先級: {String(intentObj.priority || "")}
                    </span>
                  )}
                </div>
                
                {String(intentObj.keywords) && Array.isArray(intentObj.keywords) && intentObj.keywords.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">關鍵詞：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intentObj.keywords.map((keyword: string, kwIndex: number) => (
                        <span key={kwIndex} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {String(intentObj.excludeKeywords) && Array.isArray(intentObj.excludeKeywords) && intentObj.excludeKeywords.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">排除關鍵詞：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intentObj.excludeKeywords.map((keyword: string, kwIndex: number) => (
                        <span key={kwIndex} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {String(intentObj.contextKeywords) && Array.isArray(intentObj.contextKeywords) && intentObj.contextKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">上下文關鍵詞：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intentObj.contextKeywords.map((keyword: string, kwIndex: number) => (
                        <span key={kwIndex} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </div>
      )}
      
      {Object.keys(entityPatterns).length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">實體提取模式</h4>
          <div className="space-y-4">
            {Object.entries(entityPatterns).map(([entityType, entities]: [string, unknown]) => {
              if (!entities || (Array.isArray(entities) && entities.length === 0) || (typeof entities === 'object' && Object.keys(entities).length === 0)) {
                return null
              }
              
              const entityList = Array.isArray(entities) 
                ? entities 
                : Object.entries(entities).map(([key, value]: [string, unknown]) => ({
                    id: key,
                    ...(typeof value === 'object' ? value : { keywords: value })}))
              
              if (entityList.length === 0) return null
              
              return (
                <div key={entityType} className="bg-background p-4 rounded-lg border border-border">
                  <h5 className="font-semibold text-foreground text-sm mb-3 capitalize">
                    {entityType.replace(/_/g, ' ')}
                  </h5>
                  <div className="space-y-3">
                    {entityList.map((entity: unknown, index: number) => {
                      const entityObj = typeof entity === "object" && entity !== null ? entity as Record<string, unknown> : {}
                      return (
                        <div key={String(entityObj.id) || index} className="bg-muted/30 p-3 rounded border border-border">
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-foreground">
                            {String(entityObj.id) || `實體 ${index + 1}`}
                          </span>
                          {String(entityObj._comment) && (
                            <p className="text-xs text-muted-foreground mt-1">{String(entityObj._comment || "")}</p>
                          )}
                        </div>
                        
                        {String(entityObj.keywords) && Array.isArray(entityObj.keywords) && entityObj.keywords.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">關鍵詞：</p>
                            <div className="flex flex-wrap gap-1.5">
                              {entityObj.keywords.map((keyword: string, kwIndex: number) => (
                                <span key={kwIndex} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          </div>
        </div>
      )}
    </div>
  )
}

function renderTemplates(data: unknown) {
  if (!data || typeof data !== 'object') {
    return <EmptyState message="暫無資料" icon="file" />
  }
  
  const dataObj = data as Record<string, unknown>
  if (!data) {
    return <EmptyState message="暫無範本" icon="file" />
  }
  
  const templates = dataObj.templates 
    ? (Array.isArray(dataObj.templates) ? dataObj.templates : Object.entries(dataObj.templates))
    : []
  
  if (!templates || templates.length === 0) {
    return <EmptyState message="暫無範本" icon="file" />
  }
  
  return (
    <div className="space-y-3">
      {templates.map((template: unknown, index: number) => {
        const [key, value] = Array.isArray(template) ? template : [index, template]
        const templateData = value || template
        const templateKey = typeof key === 'string' ? key : `範本 ${index + 1}`
        
        return (
          <div key={index} className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2 text-base">{templateKey}</h4>
            {String(templateData.main_answer) && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">主要回答：</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{String(templateData.main_answer || "")}</p>
              </div>
            )}
            {String(templateData.supplementary_info) && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">補充資訊：</p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{String(templateData.supplementary_info || "")}</p>
              </div>
            )}
            {String(templateData.next_best_actions) && Array.isArray(templateData.next_best_actions) && templateData.next_best_actions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">下一步行动：</p>
                <div className="flex flex-wrap gap-1.5">
                  {templateData.next_best_actions.map((action: string, actionIndex: number) => (
                    <span key={actionIndex} className="text-xs bg-muted px-2 py-1 rounded border border-border">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })
    </div>
  )
}

function renderJSON(data: unknown) {
  if (!data || typeof data !== 'object') {
    return <EmptyState message="暫無資料" icon="file" />
  }
  
  const dataObj = data as Record<string, unknown>
  if (!data) {
    return <EmptyState message="暫無資料" icon="file" />
  }
  
  try {
    return (
      <pre className="text-xs bg-background p-5 rounded-lg border border-border overflow-x-auto font-mono leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  } catch (error) {
    return <ErrorDisplay error={error instanceof Error ? error : new Error('JSON 序列化失敗')} title="資料格式錯誤" />
  }
}

