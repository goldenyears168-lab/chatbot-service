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
  data: any
  stats: Record<string, any>
}

interface KnowledgeViewerProps {
  file: KnowledgeFile
}

export function KnowledgeViewer({ file }: KnowledgeViewerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'json'>('preview')
  const [renderError, setRenderError] = useState<Error | null>(null)
  
  // 資料驗證
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

function renderServices(data: any) {
  if (!data) {
    return <EmptyState message="暫無服務資訊" icon="file" />
  }
  
  const services = data.services 
    ? (Array.isArray(data.services) ? data.services : Object.values(data.services))
    : []
  
  if (!services || services.length === 0) {
    return <EmptyState message="暫無服務資訊" icon="file" />
  }
  
  return (
    <div className="space-y-3">
      {services.map((service: any, index: number) => (
        <div key={index} className="bg-background p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-1.5 text-base">{service.name || `服務 ${index + 1}`}</h4>
          {service.one_line && (
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{service.one_line}</p>
          )}
          {service.price_range && (
            <p className="text-xs text-muted-foreground font-medium">價格: {service.price_range}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function renderCompanyInfo(data: any) {
  if (!data) {
    return <EmptyState message="暫無專案資訊" icon="file" />
  }
  
  const branches = data.branches 
    ? (Array.isArray(data.branches) ? data.branches : Object.values(data.branches))
    : []
  
  if (!branches || branches.length === 0) {
    if (!data.contact_channels && !data.contact) {
      return <EmptyState message="暫無專案資訊" icon="file" />
    }
  }
  
  return (
    <div className="space-y-4">
      {branches.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">分店資訊</h4>
          {branches.map((branch: any, index: number) => (
            <div key={index} className="bg-background p-4 rounded-lg border border-border mb-3">
              <h5 className="font-semibold text-foreground mb-1.5">{branch.name}</h5>
              {branch.address && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{branch.address}</p>
              )}
              {branch.phone && (
                <p className="text-xs text-muted-foreground mt-2 font-medium">電話: {branch.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {(data.contact_channels || data.contact) && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">聯絡方式</h4>
          <div className="bg-background p-4 rounded-lg border border-border">
            {data.contact_channels?.email && (
              <p className="text-sm text-muted-foreground mb-1.5">Email: {data.contact_channels.email}</p>
            )}
            {data.contact_channels?.phone && (
              <p className="text-sm text-muted-foreground">電話: {data.contact_channels.phone}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function renderFAQ(data: any) {
  if (!data) {
    return <EmptyState message="暫無 FAQ 資料" icon="file" />
  }
  
  if (!data.categories || typeof data.categories !== 'object') {
    return <EmptyState message="暫無 FAQ 資料" icon="file" />
  }
  
  const categories = Object.keys(data.categories)
  
  if (categories.length === 0) {
    return <EmptyState message="暫無 FAQ 資料" icon="file" />
  }
  
  return (
    <div className="space-y-4">
      {categories.map((catKey: string) => {
        const category = data.categories[catKey]
        const questions = category?.questions || []
        
        return (
          <div key={catKey} className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3 text-base">{category?.title || catKey}</h4>
            <div className="space-y-3">
              {questions.map((q: any, index: number) => (
                <div key={index} className="text-sm">
                  <p className="text-foreground font-semibold mb-1">Q: {q.question}</p>
                  <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">{q.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderAIConfig(data: any) {
  if (!data) {
    return <EmptyState message="暫無 AI 設定資料" icon="file" />
  }
  
  const intents = data.intents 
    ? (Array.isArray(data.intents) ? data.intents : Object.values(data.intents))
    : []
  const entityPatterns = data.entity_patterns || {}
  
  if (intents.length === 0 && Object.keys(entityPatterns).length === 0) {
    return <EmptyState message="暫無 AI 設定資料" icon="file" />
  }
  
  return (
    <div className="space-y-4">
      {intents.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">意圖識別 ({intents.length} 個)</h4>
          <div className="space-y-3">
            {intents.map((intent: any, index: number) => (
              <div key={intent.id || index} className="bg-background p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-foreground text-sm mb-1">
                      {intent.id || `意圖 ${index + 1}`}
                    </h5>
                    {intent._comment && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{intent._comment}</p>
                    )}
                  </div>
                  {intent.priority !== undefined && (
                    <span className="text-xs bg-muted px-2 py-1 rounded font-medium shrink-0 ml-2">
                      優先級: {intent.priority}
                    </span>
                  )}
                </div>
                
                {intent.keywords && Array.isArray(intent.keywords) && intent.keywords.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">關鍵詞：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intent.keywords.map((keyword: string, kwIndex: number) => (
                        <span key={kwIndex} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {intent.excludeKeywords && Array.isArray(intent.excludeKeywords) && intent.excludeKeywords.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">排除關鍵詞：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intent.excludeKeywords.map((keyword: string, kwIndex: number) => (
                        <span key={kwIndex} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {intent.contextKeywords && Array.isArray(intent.contextKeywords) && intent.contextKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">上下文關鍵詞：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intent.contextKeywords.map((keyword: string, kwIndex: number) => (
                        <span key={kwIndex} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {Object.keys(entityPatterns).length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">實體提取模式</h4>
          <div className="space-y-4">
            {Object.entries(entityPatterns).map(([entityType, entities]: [string, any]) => {
              if (!entities || (Array.isArray(entities) && entities.length === 0) || (typeof entities === 'object' && Object.keys(entities).length === 0)) {
                return null
              }
              
              const entityList = Array.isArray(entities) 
                ? entities 
                : Object.entries(entities).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...(typeof value === 'object' ? value : { keywords: value })
                  }))
              
              if (entityList.length === 0) return null
              
              return (
                <div key={entityType} className="bg-background p-4 rounded-lg border border-border">
                  <h5 className="font-semibold text-foreground text-sm mb-3 capitalize">
                    {entityType.replace(/_/g, ' ')}
                  </h5>
                  <div className="space-y-3">
                    {entityList.map((entity: any, index: number) => (
                      <div key={entity.id || index} className="bg-muted/30 p-3 rounded border border-border">
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-foreground">
                            {entity.id || `實體 ${index + 1}`}
                          </span>
                          {entity._comment && (
                            <p className="text-xs text-muted-foreground mt-1">{entity._comment}</p>
                          )}
                        </div>
                        
                        {entity.keywords && Array.isArray(entity.keywords) && entity.keywords.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">關鍵詞：</p>
                            <div className="flex flex-wrap gap-1.5">
                              {entity.keywords.map((keyword: string, kwIndex: number) => (
                                <span key={kwIndex} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function renderTemplates(data: any) {
  if (!data) {
    return <EmptyState message="暫無範本" icon="file" />
  }
  
  const templates = data.templates 
    ? (Array.isArray(data.templates) ? data.templates : Object.entries(data.templates))
    : []
  
  if (!templates || templates.length === 0) {
    return <EmptyState message="暫無範本" icon="file" />
  }
  
  return (
    <div className="space-y-3">
      {templates.map((template: any, index: number) => {
        const [key, value] = Array.isArray(template) ? template : [index, template]
        const templateData = value || template
        const templateKey = typeof key === 'string' ? key : `範本 ${index + 1}`
        
        return (
          <div key={index} className="bg-background p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2 text-base">{templateKey}</h4>
            {templateData.main_answer && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">主要回答：</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{templateData.main_answer}</p>
              </div>
            )}
            {templateData.supplementary_info && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">補充資訊：</p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{templateData.supplementary_info}</p>
              </div>
            )}
            {templateData.next_best_actions && Array.isArray(templateData.next_best_actions) && templateData.next_best_actions.length > 0 && (
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
      })}
    </div>
  )
}

function renderJSON(data: any) {
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

