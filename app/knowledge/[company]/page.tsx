import { getCompanyConfig } from '@/lib/config'
import { DynamicChatbotWidget } from '@/app/demo/[company]/DynamicChatbotWidget'
import { ErrorDisplay } from './ErrorDisplay'
import { EmptyState } from './EmptyState'
import { ClientConsole } from './components/ClientConsole'
import { WidgetCodeDisplay } from './WidgetCodeDisplay'
import { loadKnowledgeData } from '@/lib/knowledge/loader'
import { headers } from 'next/headers'
import type { CompanyConfig } from '@/lib/config'

interface KnowledgePageProps {
  params: Promise<{ company: string }> | { company: string }
}

async function getBaseUrl(): Promise<string> {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // 在 Edge Runtime 中，从请求头中获取 baseUrl
  try {
    const headersList = await headers()
    const host = headersList.get('host') || headersList.get('x-forwarded-host')
    const protocol = headersList.get('x-forwarded-proto') || 'https'
    
    if (host) {
      return `${protocol}://${host}`
    }
  } catch (error) {
    // 如果无法获取 headers，继续使用默认值
  }
  
  // 开发环境默认值
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // 生产环境如果没有设置，抛出错误
  throw new Error(
    'NEXT_PUBLIC_BASE_URL environment variable is required in production. ' +
    'Please set it in Cloudflare Pages environment variables.'
  )
}

// 使用 Edge Runtime（Cloudflare Pages 要求）
export const runtime = 'edge'

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { company } = await Promise.resolve(params)
  
  // 获取 baseUrl（用于加载知识库数据）
  const baseUrl = await getBaseUrl()
  
  // 获取用于显示的 baseUrl（可选）
  const displayBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : baseUrl)
  
  let knowledgeData: Awaited<ReturnType<typeof loadKnowledgeData>> | null = null
  let companyConfig: CompanyConfig | null = null
  let error: string | null = null
  
  try {
    // 直接使用共享的加载函数，而不是通过 HTTP fetch
    [knowledgeData, companyConfig] = await Promise.all([
      loadKnowledgeData(company, baseUrl),
      getCompanyConfig(company)
    ])
    
    // 資料驗證
    if (knowledgeData && (!knowledgeData.files || !Array.isArray(knowledgeData.files))) {
      throw new Error('知識庫資料格式錯誤：缺少檔案列表')
    }
    
    // 驗證檔案資料完整性
    if (knowledgeData?.files) {
      knowledgeData.files = knowledgeData.files.filter((file) => 
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
        ) : (knowledgeData && knowledgeData.files && knowledgeData.files.length === 0) ? (
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
            {displayBaseUrl && (
              <WidgetCodeDisplay companyId={company} baseUrl={displayBaseUrl} />
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

