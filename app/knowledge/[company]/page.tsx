import { getCompanyConfig } from '@/lib/config'
import Link from 'next/link'
import { 
  ArrowLeft
} from 'lucide-react'
import { DynamicChatbotWidget } from '@/app/demo/[company]/DynamicChatbotWidget'
import { ErrorDisplay } from './ErrorDisplay'
import { EmptyState } from './EmptyState'
import { ClientConsole } from './components/ClientConsole'
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

// 使用 Node.js runtime（需要檔案系統存取）
export const runtime = 'nodejs'

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { company } = await Promise.resolve(params)
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
  
  let knowledgeData: any = null
  let companyConfig: any = null
  let error: string | null = null
  
  try {
    [knowledgeData, companyConfig] = await Promise.all([
      getKnowledgeData(company),
      getCompanyConfig(company)
    ])
    
    // 資料驗證
    if (knowledgeData && (!knowledgeData.files || !Array.isArray(knowledgeData.files))) {
      throw new Error('知識庫資料格式錯誤：缺少檔案列表')
    }
    
    // 驗證檔案資料完整性
    if (knowledgeData?.files) {
      knowledgeData.files = knowledgeData.files.filter((file: KnowledgeFile) => 
        file && 
        file.filename && 
        file.key && 
        file.data !== undefined &&
        file.size !== undefined &&
        file.lastModified
      )
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">         
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {companyConfig?.name?.charAt(0) || company.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-1.5">
                {companyConfig?.name || company} - 知識庫管理
              </h1>
              <p className="text-base text-muted-foreground font-medium">{companyConfig?.name_en || company}</p>
            </div>
          </div>
        </div>

        {error ? (
          <ErrorDisplay error={error} />
        ) : !knowledgeData ? (
          <EmptyState 
            message="暫無知識庫資料"
            description="請檢查知識庫設定或聯絡管理員"
            icon="inbox"
          />
        ) : !knowledgeData.files || knowledgeData.files.length === 0 ? (
          <EmptyState 
            message="暫無知識庫檔案"
            description="知識庫中還沒有任何檔案，請先新增知識庫檔案"
            icon="file"
          />
        ) : (
          <>
            <ClientConsole
              company={company}
              companyName={companyConfig?.name}
              companyNameEn={companyConfig?.name_en}
              knowledgeData={knowledgeData}
            />
            {baseUrl && (
              <WidgetCodeDisplay companyId={company} baseUrl={baseUrl} />
            )}
          </>
        )}

        {/* 聊天機器人 - 氣泡按鈕 */}
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

