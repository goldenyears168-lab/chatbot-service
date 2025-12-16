'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
  
  const renderPreview = () => {
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
          预览模式
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
  const services = data.services 
    ? (Array.isArray(data.services) ? data.services : Object.values(data.services))
    : []
  
  if (services.length === 0) {
    return <p className="text-muted-foreground text-sm">暂无服务信息</p>
  }
  
  return (
    <div className="space-y-3">
      {services.map((service: any, index: number) => (
        <div key={index} className="bg-background p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-1.5 text-base">{service.name || `服务 ${index + 1}`}</h4>
          {service.one_line && (
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{service.one_line}</p>
          )}
          {service.price_range && (
            <p className="text-xs text-muted-foreground font-medium">价格: {service.price_range}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function renderCompanyInfo(data: any) {
  const branches = data.branches 
    ? (Array.isArray(data.branches) ? data.branches : Object.values(data.branches))
    : []
  
  return (
    <div className="space-y-4">
      {branches.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">分店信息</h4>
          {branches.map((branch: any, index: number) => (
            <div key={index} className="bg-background p-4 rounded-lg border border-border mb-3">
              <h5 className="font-semibold text-foreground mb-1.5">{branch.name}</h5>
              {branch.address && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{branch.address}</p>
              )}
              {branch.phone && (
                <p className="text-xs text-muted-foreground mt-2 font-medium">电话: {branch.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {(data.contact_channels || data.contact) && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-base">联系方式</h4>
          <div className="bg-background p-4 rounded-lg border border-border">
            {data.contact_channels?.email && (
              <p className="text-sm text-muted-foreground mb-1.5">Email: {data.contact_channels.email}</p>
            )}
            {data.contact_channels?.phone && (
              <p className="text-sm text-muted-foreground">电话: {data.contact_channels.phone}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function renderFAQ(data: any) {
  const categories = data.categories ? Object.keys(data.categories) : []
  
  if (categories.length === 0) {
    return <p className="text-muted-foreground text-sm">暂无 FAQ 数据</p>
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
  return (
    <div className="space-y-3">
      {data.intents && (
        <div className="bg-background p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2 text-base">意图识别</h4>
          <p className="text-sm text-muted-foreground font-medium">
            {Array.isArray(data.intents) ? data.intents.length : Object.keys(data.intents).length} 个意图
          </p>
        </div>
      )}
      {data.entities && (
        <div className="bg-background p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2 text-base">实体提取</h4>
          <p className="text-sm text-muted-foreground font-medium">
            {Array.isArray(data.entities) ? data.entities.length : Object.keys(data.entities).length} 个实体
          </p>
        </div>
      )}
    </div>
  )
}

function renderTemplates(data: any) {
  const templates = data.templates 
    ? (Array.isArray(data.templates) ? data.templates : Object.entries(data.templates))
    : []
  
  if (templates.length === 0) {
    return <p className="text-muted-foreground text-sm">暂无模板</p>
  }
  
  return (
    <div className="space-y-3">
      {templates.map((template: any, index: number) => {
        const [key, value] = Array.isArray(template) ? template : [index, template]
        const templateData = value || template
        const templateKey = typeof key === 'string' ? key : `模板 ${index + 1}`
        
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
                <p className="text-xs font-semibold text-muted-foreground mb-1">补充信息：</p>
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
  return (
    <pre className="text-xs bg-background p-5 rounded-lg border border-border overflow-x-auto font-mono leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

