import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DynamicChatbotWidget } from '@/src/components/DynamicChatbotWidget'
import { ErrorDisplay } from '@/src/legacy/knowledge/ErrorDisplay'
import { EmptyState } from '@/src/legacy/knowledge/EmptyState'
import { ClientConsole } from '@/src/legacy/knowledge/components/ClientConsole'
import { WidgetCodeDisplay } from '@/src/legacy/knowledge/WidgetCodeDisplay'

type CompanyConfig = {
  id: string
  name: string
  name_en: string
}

async function fetchCompanyConfig(company: string): Promise<CompanyConfig | null> {
  const res = await fetch(`/api/${company}/config`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  return (await res.json()) as CompanyConfig
}

async function fetchKnowledge(company: string): Promise<any> {
  const url = `/api/knowledge/${company}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) throw new Error(`Failed to load knowledge data: ${res.status} ${res.statusText}`)
  if (!contentType.includes('application/json')) throw new Error(`Expected JSON from ${url} but got ${contentType || 'unknown content-type'}`)
  const json = await res.json()
  return json
}

export default function KnowledgePage() {
  const params = useParams()
  const company = params.company || 'unknown'

  const [knowledgeData, setKnowledgeData] = useState<any>(null)
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchKnowledge(company), fetchCompanyConfig(company)])
      .then(([kb, cfg]) => {
        if (cancelled) return
        setKnowledgeData(kb)
        setCompanyConfig(cfg)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      })

    return () => {
      cancelled = true
    }
  }, [company])

  const displayBaseUrl = useMemo(() => import.meta.env.VITE_BASE_URL || window.location.origin, [])

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <ErrorDisplay error={error} />
        </div>
      </div>
    )
  }

  if (!knowledgeData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <EmptyState message="載入中..." description="正在載入知識庫資料" icon="inbox" />
        </div>
      </div>
    )
  }

  if (!knowledgeData.files || !Array.isArray(knowledgeData.files) || knowledgeData.files.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <EmptyState message="暫無知識庫檔案" description="知識庫中還沒有任何檔案，請先新增知識庫檔案" icon="file" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <ClientConsole
          company={company}
          companyName={companyConfig?.name}
          companyNameEn={companyConfig?.name_en}
          knowledgeData={knowledgeData}
        />

        {displayBaseUrl && <WidgetCodeDisplay companyId={company} baseUrl={displayBaseUrl} />}

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


