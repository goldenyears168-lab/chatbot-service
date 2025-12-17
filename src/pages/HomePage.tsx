import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, BookOpen, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

type Company = {
  id: string
  name: string
  name_en: string
  active?: boolean
}

type CompanyRegistry = {
  companies?: Record<string, Company>
}

async function fetchRegistry(): Promise<CompanyRegistry | null> {
  const res = await fetch('/api/registry', { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON from /api/registry but got ${contentType || 'unknown content-type'}`)
  }
  return (await res.json()) as CompanyRegistry
}

export default function HomePage() {
  const [registry, setRegistry] = useState<CompanyRegistry | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Dev default: do NOT call /api/* (Pages Functions) unless you explicitly enable it.
    // This avoids 500s when Vite proxy is not running.
    if (import.meta.env.DEV && import.meta.env.VITE_USE_API_REGISTRY !== 'true') {
      import('@/projects/registry.json')
        .then((mod) => {
          if (cancelled) return
          const data = (mod as any).default || mod
          setRegistry(data as CompanyRegistry)
          setError(null)
        })
        .catch((e) => {
          if (cancelled) return
          setError(e instanceof Error ? e.message : String(e))
        })
      return () => {
        cancelled = true
      }
    }

    fetchRegistry()
      .then((data) => {
        if (cancelled) return
        setRegistry(data)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const companies = useMemo(() => {
    const raw = registry?.companies ? Object.values(registry.companies) : []
    return raw.filter((c) => c && c.active !== false)
  }, [registry])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Chatbot Service
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">多租戶聊天機器人微服務管理平台</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">服務運行中</span>
          </div>
        </div>

        <Card className="mb-8 border-amber-200 bg-amber-50/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-900">重要: 環境變量配置</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800 mb-3">
              若要啟用 AI 聊天功能,請先在 Cloudflare Dashboard 設置{' '}
              <code className="bg-amber-100 px-2 py-1 rounded text-sm font-mono">GEMINI_API_KEY</code> 環境變量。
            </p>
            <div className="bg-white p-4 rounded-lg border border-amber-200 mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">設置步驟:</p>
              <p className="text-sm text-gray-600 font-mono">
                Workers & Pages → chatbot-service-multi-tenant → Settings → Environment variables
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" asChild>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">
                前往 Cloudflare Dashboard <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-900">專案測試頁面管理</h2>
          </div>
          <p className="text-gray-600 mb-6">每個專案都有獨立的測試環境,可在部署到主網站前進行驗證</p>

          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-red-700 text-sm">
                Failed to load registry: {error}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow border-gray-200 bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <CardDescription className="text-sm">{company.name_en}</CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                      {company.id}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full" size="sm">
                    <Link to={`/knowledge/${company.id}`}>
                      <BookOpen className="w-4 h-4 mr-1" />
                      管理頁面
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 mb-2">部署成功</h3>
                <p className="text-green-800 text-sm leading-relaxed">
                  多租戶 Chatbot Service 已成功部署到 Cloudflare Pages。此服務為多個專案提供 AI 聊天機器人功能,支持獨立的知識庫和配置管理。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


