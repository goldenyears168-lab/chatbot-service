import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DynamicChatbotWidget } from '@/src/components/DynamicChatbotWidget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Service, Branch } from '@/types/knowledge'
import { isBranch, isService } from '@/types/knowledge'

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
  const res = await fetch(`/api/knowledge/${company}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Failed to load knowledge: ${res.status} ${res.statusText}`)
  return res.json()
}

export default function DemoPage() {
  const params = useParams()
  const company = params.company || ''

  const [config, setConfig] = useState<CompanyConfig | null>(null)
  const [knowledge, setKnowledge] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!company) return

    Promise.all([fetchCompanyConfig(company), fetchKnowledge(company)])
      .then(([cfg, kb]) => {
        if (cancelled) return
        if (!cfg) {
          setError(`Company ${company} not found`)
          return
        }
        setConfig(cfg)
        setKnowledge(kb)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      })

    return () => {
      cancelled = true
    }
  }, [company])

  const servicesList: Service[] = useMemo(() => {
    const servicesData = knowledge?.services || {}
    const servicesDataObj = typeof servicesData === 'object' && servicesData !== null ? (servicesData as Record<string, unknown>) : {}
    const servicesValue = servicesDataObj.services
    return Array.isArray(servicesValue)
      ? servicesValue.filter(isService)
      : servicesValue && typeof servicesValue === 'object' && servicesValue !== null
        ? Object.values(servicesValue).filter(isService)
        : []
  }, [knowledge])

  const companyInfoObj = useMemo(() => {
    const companyInfo = knowledge?.company_info || {}
    return typeof companyInfo === 'object' && companyInfo !== null ? (companyInfo as Record<string, unknown>) : {}
  }, [knowledge])

  if (!company) {
    return (
      <div className="container mx-auto p-8 min-h-screen bg-background">
        <p className="text-muted-foreground">Company is required</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 min-h-screen bg-background">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!config || !knowledge) {
    return (
      <div className="container mx-auto p-8 min-h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 min-h-screen bg-background">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">{config.name}</h1>
        <p className="text-muted-foreground text-lg">{config.name_en}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>服务范围</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesList.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {servicesList.map((service) => (
                  <div key={service.id || service.name} className="border-b pb-3 last:border-0">
                    <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>
                    {service.one_line && <p className="text-sm text-muted-foreground mb-2">{service.one_line}</p>}
                    {service.price_range && (
                      <p className="text-sm font-medium text-foreground">价格: {service.price_range}</p>
                    )}
                    {service.use_cases && Array.isArray(service.use_cases) && service.use_cases.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">适用: {service.use_cases.join('、')}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无服务信息</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>联系方式</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const branches = companyInfoObj.branches
              const contactChannels = companyInfoObj.contact_channels

              if (branches && Array.isArray(branches) && branches.length > 0) {
                const contactElements: React.ReactNode[] = []
                if (contactChannels && typeof contactChannels === 'object' && contactChannels !== null) {
                  const channels = contactChannels as Record<string, unknown>
                  if (channels.email && typeof channels.email === 'string') {
                    contactElements.push(
                      <p key="email" className="text-sm text-foreground mb-1">
                        <span className="font-medium">邮箱:</span>{' '}
                        <a href={`mailto:${channels.email}`} className="text-primary hover:underline">
                          {channels.email}
                        </a>
                      </p>
                    )
                  }
                  if (channels.ig && typeof channels.ig === 'string') {
                    contactElements.push(
                      <p key="ig" className="text-sm text-foreground">
                        <span className="font-medium">Instagram:</span> {channels.ig}
                      </p>
                    )
                  }
                }

                return (
                  <div className="space-y-4">
                    {(branches as unknown[]).filter(isBranch).map((branch: Branch) => (
                      <div key={branch.id} className="border-b pb-3 last:border-0">
                        <h3 className="font-semibold text-foreground mb-2">{branch.name}</h3>
                        {branch.address && (
                          <p className="text-sm text-foreground mb-1">
                            <span className="font-medium">地址:</span> {branch.address}
                          </p>
                        )}
                        {branch.address_note && <p className="text-xs text-muted-foreground mb-1">{branch.address_note}</p>}
                        {branch.phone && (
                          <p className="text-sm text-foreground">
                            <span className="font-medium">电话:</span> {branch.phone}
                          </p>
                        )}
                        {branch.hours && branch.hours.weekday && (
                          <p className="text-xs text-muted-foreground mt-1">营业时间: {branch.hours.weekday}</p>
                        )}
                      </div>
                    ))}
                    {contactElements.length > 0 && (
                      <div className="mt-4 pt-4 border-t">{contactElements}</div>
                    )}
                  </div>
                )
              } else if (contactChannels && typeof contactChannels === 'object' && contactChannels !== null) {
                const channels = contactChannels as Record<string, unknown>
                const elements: React.ReactNode[] = []
                if (channels.email && typeof channels.email === 'string') {
                  elements.push(
                    <p key="email" className="text-foreground">
                      <span className="font-semibold">邮箱:</span>{' '}
                      <a href={`mailto:${channels.email}`} className="text-primary hover:underline">
                        {channels.email}
                      </a>
                    </p>
                  )
                }
                if (channels.phone && typeof channels.phone === 'string') {
                  elements.push(
                    <p key="phone" className="text-foreground">
                      <span className="font-semibold">电话:</span> {channels.phone}
                    </p>
                  )
                }
                return <div className="space-y-2 text-sm">{elements}</div>
              } else {
                return <p className="text-muted-foreground">暂无联系方式</p>
              }
            })()}
          </CardContent>
        </Card>
      </div>

      <DynamicChatbotWidget
        companyId={company}
        apiEndpoint={`/api/${company}/chat`}
        pageType="home"
        companyName={config.name}
        companyNameEn={config.name_en}
      />
    </div>
  )
}


