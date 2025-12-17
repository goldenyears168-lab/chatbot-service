import { getCompanyConfig } from '@/lib/config'
import { DynamicChatbotWidget } from '@/app/demo/[company]/DynamicChatbotWidget'
import { ErrorDisplay } from './ErrorDisplay'
import { EmptyState } from './EmptyState'
import { ClientConsole } from './components/ClientConsole'
import { WidgetCodeDisplay } from './WidgetCodeDisplay'
import { headers } from 'next/headers'
import type { CompanyConfig } from '@/lib/config'

interface KnowledgePageProps {
  params: Promise<{ company: string }> | { company: string }
}

/**
 * 获取 baseUrl - 优先使用环境变量，否则尝试从 headers 获取
 * 注意：在 Edge Runtime 页面组件中，headers() 可能不可靠
 */
async function getBaseUrlForApi(): Promise<string> {
  // 优先使用环境变量（最可靠）
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // 生产环境：尝试从 headers 获取（可能不可靠）
  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') || headersList.get('host')
    if (host) {
      const hostWithoutPort = host.split(':')[0]
      const protocol = headersList.get('x-forwarded-proto') || 'https'
      return `${protocol}://${hostWithoutPort}`
    }
  } catch {
    // headers() 可能失败，这是正常的
  }
  
  // 如果都失败，返回空字符串，让 API route 处理
  return ''
}

/**
 * 通过 API route 加载知识库数据
 * 在 Edge Runtime 中，fetch 需要完整的 URL，所以必须提供 baseUrl
 */
async function loadKnowledgeDataViaApi(company: string, baseUrl: string): Promise<any> {
  if (!baseUrl) {
    throw new Error(
      'Base URL is required. Please set NEXT_PUBLIC_BASE_URL environment variable ' +
      'in Vercel Dashboard → Settings → Environment Variables.'
    )
  }
  
  const apiUrl = `${baseUrl}/api/knowledge/${company}`
  const response = await fetch(apiUrl, {
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `Failed to load knowledge data: ${response.status} ${response.statusText}` +
      (errorText ? ` - ${errorText}` : '')
    )
  }
  
  return response.json()
}

// Cloudflare Pages (next-on-pages) 运行在 Workers/Edge 环境，页面必须使用 Edge Runtime
export const runtime = 'edge'

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  let company: string
  let baseUrl: string = ''
  let displayBaseUrl: string = ''
  let knowledgeData: any = null
  let companyConfig: CompanyConfig | null = null
  let error: string | null = null
  
  try {
    // 解析 params
    company = (await Promise.resolve(params)).company
    
    // 获取 baseUrl（用于调用 API route）
    try {
      baseUrl = await getBaseUrlForApi()
    } catch (urlError) {
      error = `Failed to get base URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`
    }
    
    // 获取用于显示的 baseUrl
    displayBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : baseUrl)
    
    // 尝试加载数据
    // API route 可以从 request.url 获取可靠的 baseUrl
    if (!error && baseUrl) {
      try {
        // 通过 API route 加载数据
        [knowledgeData, companyConfig] = await Promise.all([
          loadKnowledgeDataViaApi(company, baseUrl),
          getCompanyConfig(company)
        ])
        
        // 資料驗證
        if (knowledgeData && (!knowledgeData.files || !Array.isArray(knowledgeData.files))) {
          throw new Error('知識庫資料格式錯誤：缺少檔案列表')
        }
        
        // 驗證檔案資料完整性
        if (knowledgeData?.files) {
          knowledgeData.files = knowledgeData.files.filter((file: any) => 
            file && 
            file.filename && 
            file.key && 
            file.data !== undefined &&
            file.size !== undefined &&
            file.lastModified
          )
        }
      } catch (dataError) {
        error = dataError instanceof Error ? dataError.message : String(dataError)
      }
    }
  } catch (err) {
    // 捕获所有其他可能的错误
    error = err instanceof Error ? err.message : String(err)
    // 确保 company 有值，即使出错
    try {
      company = (await Promise.resolve(params)).company
    } catch {
      company = 'unknown'
    }
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

