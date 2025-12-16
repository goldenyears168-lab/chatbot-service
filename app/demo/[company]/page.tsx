import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DynamicChatbotWidget } from './DynamicChatbotWidget'
import { getCompanyConfig } from '@/lib/config'
import { getKnowledgeBase } from '@/lib/knowledge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Service, Branch } from '@/types/knowledge'
import { isService, isBranch } from '@/types/knowledge'

export const runtime = 'edge'

// 兼容 Promise 和非 Promise 的 params 类型
type Params = { company: string } | Promise<{ company: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  // 使用 Promise.resolve() 统一解包，可同时处理 object 和 Promise
  const { company } = await Promise.resolve(params)
  const config = await getCompanyConfig(company)

  return {
    title: config?.name || 'Demo Page',
    description: config?.name_en || `Demo page for ${company}`,
  }
}

export default async function DemoPage({
  params,
}: {
  params: Params
}) {
  // 使用 Promise.resolve() 统一解包，可同时处理 object 和 Promise
  const { company } = await Promise.resolve(params)
  const config = await getCompanyConfig(company)
  
  if (!config) {
    notFound()
  }

  // 加载知识库
  // 在 Edge Runtime 中，我们需要从请求中获取 baseUrl
  // 优先使用环境变量，如果没有则从 headers 推导，最后使用开发环境默认值
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  
  // 如果环境变量未设置，尝试从请求 headers 推导（在 Edge Runtime 中需要传入 headers）
  // 注意：在 Edge Runtime 中无法直接访问 request，但可以通过环境变量或配置获取
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'
    } else {
      // Production 环境必须设置 NEXT_PUBLIC_BASE_URL
      // 如果未设置，抛出错误而不是使用 undefined
      throw new Error(
        'NEXT_PUBLIC_BASE_URL environment variable is required in production. ' +
        'Please set it in your deployment environment (e.g., Cloudflare Pages environment variables).'
      )
    }
  }
  
  const knowledgeBase = await getKnowledgeBase(company, baseUrl)
  const servicesData = knowledgeBase.services || {}
  const companyInfo = knowledgeBase.company_info || {}
  
  // 服务列表（可能是数组或对象）
  const servicesList: Service[] = Array.isArray(servicesData.services)
    ? servicesData.services.filter(isService)
    : servicesData.services && typeof servicesData.services === 'object'
      ? Object.values(servicesData.services).filter(isService)
      : []

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
                    {service.one_line && (
                      <p className="text-sm text-muted-foreground mb-2">{service.one_line}</p>
                    )}
                    {service.price_range && (
                      <p className="text-sm font-medium text-foreground">价格: {service.price_range}</p>
                    )}
                    {service.use_cases && Array.isArray(service.use_cases) && service.use_cases.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        适用: {service.use_cases.join('、')}
                      </p>
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
            {companyInfo.branches && Array.isArray(companyInfo.branches) && companyInfo.branches.length > 0 ? (
              <div className="space-y-4">
                {companyInfo.branches.filter(isBranch).map((branch: Branch) => (
                  <div key={branch.id} className="border-b pb-3 last:border-0">
                    <h3 className="font-semibold text-foreground mb-2">{branch.name}</h3>
                    {branch.address && (
                      <p className="text-sm text-foreground mb-1">
                        <span className="font-medium">地址:</span> {branch.address}
                      </p>
                    )}
                    {branch.address_note && (
                      <p className="text-xs text-muted-foreground mb-1">{branch.address_note}</p>
                    )}
                    {branch.phone && (
                      <p className="text-sm text-foreground">
                        <span className="font-medium">电话:</span> {branch.phone}
                      </p>
                    )}
                    {branch.hours && branch.hours.weekday && (
                      <p className="text-xs text-muted-foreground mt-1">
                        营业时间: {branch.hours.weekday}
                      </p>
                    )}
                  </div>
                ))}
                {companyInfo.contact_channels && (
                  <div className="mt-4 pt-4 border-t">
                    {companyInfo.contact_channels.email && (
                      <p className="text-sm text-foreground mb-1">
                        <span className="font-medium">邮箱:</span>{' '}
                        <a href={`mailto:${companyInfo.contact_channels.email}`} className="text-primary hover:underline">
                          {companyInfo.contact_channels.email}
                        </a>
                      </p>
                    )}
                    {companyInfo.contact_channels.ig && (
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Instagram:</span> {companyInfo.contact_channels.ig}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : companyInfo.contact_channels ? (
              <div className="space-y-2 text-sm">
                {companyInfo.contact_channels.email && (
                  <p className="text-foreground">
                    <span className="font-semibold">邮箱:</span>{' '}
                    <a href={`mailto:${companyInfo.contact_channels.email}`} className="text-primary hover:underline">
                      {companyInfo.contact_channels.email}
                    </a>
                  </p>
                )}
                {companyInfo.contact_channels.phone && (
                  <p className="text-foreground">
                    <span className="font-semibold">电话:</span> {companyInfo.contact_channels.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无联系方式</p>
            )}
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

