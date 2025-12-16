import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCompanyConfig } from '@/lib/config'
import Link from 'next/link'
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Database, 
  Settings, 
  MessageSquare, 
  Building2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react'
import { KnowledgeViewer } from './KnowledgeViewer'
import { DynamicChatbotWidget } from '@/app/demo/[company]/DynamicChatbotWidget'
import { WidgetCodeDisplay } from './WidgetCodeDisplay'

interface KnowledgeFile {
  filename: string
  name: string
  key: string
  number: number
  size: number
  lastModified: string
  data: any
  stats: Record<string, any>
}

interface KnowledgePageProps {
  params: Promise<{ company: string }> | { company: string }
}

async function getKnowledgeData(company: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
  
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL is required')
  }
  
  const response = await fetch(`${baseUrl}/api/knowledge/${company}`, {
    cache: 'no-store'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to load knowledge base: ${response.statusText}`)
  }
  
  return response.json()
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://chatbot-service-9qg.pages.dev')
}

// 使用 Node.js runtime（需要文件系统访问）
export const runtime = 'nodejs'

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { company } = await Promise.resolve(params)
  
  let knowledgeData: any = null
  let companyConfig: any = null
  let error: string | null = null
  
  try {
    [knowledgeData, companyConfig] = await Promise.all([
      getKnowledgeData(company),
      getCompanyConfig(company)
    ])
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }
  
  const getFileIcon = (key: string) => {
    switch (key) {
      case 'services': return <Database className="w-5 h-5" />
      case 'company_info': return <Building2 className="w-5 h-5" />
      case 'faq_detailed': return <MessageSquare className="w-5 h-5" />
      case 'ai_config': return <Settings className="w-5 h-5" />
      case 'response_templates': return <FileText className="w-5 h-5" />
      case 'personas': return <Info className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }
  
  const getFileTitle = (key: string, name: string) => {
    const titles: Record<string, string> = {
      'services': '服务信息',
      'company_info': '公司信息',
      'faq_detailed': 'FAQ 详细数据',
      'ai_config': 'AI 配置',
      'response_templates': '回复模板',
      'personas': '角色设定'
    }
    return titles[key] || name
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回首页</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {companyConfig?.name?.charAt(0) || company.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-1.5">
                {companyConfig?.name || company} - 知识库管理
              </h1>
              <p className="text-base text-muted-foreground font-medium">{companyConfig?.name_en || company}</p>
            </div>
          </div>
        </div>

        {error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive mb-1.5">加载失败</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : knowledgeData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-muted-foreground">知识库文件</p>
                      <p className="text-2xl font-bold text-foreground tracking-tight">{knowledgeData.totalFiles}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-muted-foreground">总大小</p>
                      <p className="text-2xl font-bold text-foreground tracking-tight">{formatFileSize(knowledgeData.totalSize)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {knowledgeData.files.find((f: KnowledgeFile) => f.key === 'faq_detailed')?.stats?.totalQuestions && (
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-muted-foreground">FAQ 问题</p>
                        <p className="text-2xl font-bold text-foreground tracking-tight">
                          {knowledgeData.files.find((f: KnowledgeFile) => f.key === 'faq_detailed')?.stats?.totalQuestions || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {knowledgeData.files.find((f: KnowledgeFile) => f.key === 'services')?.stats?.count && (
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-muted-foreground">服务项目</p>
                        <p className="text-2xl font-bold text-foreground tracking-tight">
                          {knowledgeData.files.find((f: KnowledgeFile) => f.key === 'services')?.stats?.count || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Knowledge Files */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 tracking-tight">知识库文件</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {knowledgeData.files.map((file: KnowledgeFile) => (
                  <Card key={file.filename} className="bg-card border-border hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-3 pt-4 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
                            {getFileIcon(file.key)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base font-semibold text-foreground leading-tight truncate">
                              {getFileTitle(file.key, file.name)}
                            </CardTitle>
                            <CardDescription className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                              {file.filename}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs font-medium shrink-0">
                          {formatFileSize(file.size)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium truncate">最后更新: {formatDate(file.lastModified)}</span>
                      </div>
                      
                      {Object.keys(file.stats).length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex flex-wrap gap-1.5">
                            {file.stats.count && (
                              <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                项目: {file.stats.count}
                              </Badge>
                            )}
                            {file.stats.totalQuestions && (
                              <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                问题: {file.stats.totalQuestions}
                              </Badge>
                            )}
                            {file.stats.categories && (
                              <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                分类: {file.stats.categories}
                              </Badge>
                            )}
                            {file.stats.branches && (
                              <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                分店: {file.stats.branches}
                              </Badge>
                            )}
                            {file.stats.intents && (
                              <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                意图: {file.stats.intents}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <KnowledgeViewer file={file} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Widget 嵌入代码 */}
            <WidgetCodeDisplay 
              companyId={company}
              baseUrl={getBaseUrl()}
            />

            {/* Quick Actions */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-lg font-semibold">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="default" size="default" className="font-semibold text-sm px-5 py-5 h-auto shadow-sm hover:shadow-md transition-all">
                    <Link href={`/widget/chat?company=${company}`} target="_blank" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      测试聊天
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="default" className="font-semibold text-sm px-5 py-5 h-auto shadow-sm hover:shadow-md transition-all">
                    <Link href={`/api/${company}/faq-menu`} target="_blank" className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      FAQ API
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* 聊天机器人 - 气泡按钮 */}
        {companyConfig && (
          <DynamicChatbotWidget
            companyId={company}
            apiEndpoint={`/api/${company}/chat`}
            pageType="home"
            autoOpen={false}
            companyName={companyConfig.name}
            companyNameEn={companyConfig.name_en}
          />
        )}
      </div>
    </div>
  )
}

