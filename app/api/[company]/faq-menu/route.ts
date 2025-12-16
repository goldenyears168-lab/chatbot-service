// app/api/[company]/faq-menu/route.ts
import { NextResponse } from 'next/server'
import { getKnowledgeBase } from '@/lib/knowledge'
import { validateCompanyId } from '@/lib/config'
import { formatErrorResponse, logError, NotFoundError } from '@/lib/error-handler'
import { isOriginAllowed } from '@/lib/env'
import { createRateLimit } from '@/lib/rate-limit'
import { hasStatusCode } from '@/types/chat'

export const runtime = 'edge'
export const maxDuration = 10 // 最大执行时间（秒）

// 速率限制：每分钟 60 次请求
const rateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 60, // 60 次请求
})

/**
 * 获取 CORS 响应头
 */
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  } else if (process.env.NODE_ENV === 'development') {
    // 开发环境允许所有来源
    headers['Access-Control-Allow-Origin'] = origin || '*'
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  
  return headers
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ company: string }> }
) {
  // 速率限制检查
  const rateLimitResponse = await rateLimit(request)
  if (rateLimitResponse) {
    const corsHeaders = getCorsHeaders(request)
    rateLimitResponse.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
    Object.entries(corsHeaders).forEach(([key, value]) => {
      rateLimitResponse.headers.set(key, value)
    })
    return rateLimitResponse
  }
  
  const corsHeaders = getCorsHeaders(request)
  
  try {
    const { company } = await params
    
    // 验证公司 ID
    const isValidCompany = await validateCompanyId(company)
    if (!isValidCompany) {
      throw new NotFoundError(`Company ${company} not found`)
    }
    
    // 获取 FAQ 菜单
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const knowledgeBase = await getKnowledgeBase(company, baseUrl)
    
    // 尝试多种可能的 FAQ 数据键名
    const faqData = knowledgeBase.faq_detailed || knowledgeBase.faq || knowledgeBase.faqMenu || null
    
    if (faqData && faqData.categories) {
      return NextResponse.json(faqData, { headers: corsHeaders })
    }
    
    // 如果没有找到 FAQ，返回空结构
    return NextResponse.json({ categories: [] }, { headers: corsHeaders })
  } catch (error) {
    const { company: companyId } = await params
    logError(error, { company: companyId, endpoint: '/api/[company]/faq-menu' })
    
    const errorResponse = formatErrorResponse(error)
    const statusCode = hasStatusCode(error) 
      ? (error.statusCode ?? 500)
      : 500
    
    const errorResponseHeaders = {
      'Content-Type': 'application/json',
      ...corsHeaders,
    }
    
    return NextResponse.json(
      errorResponse,
      { status: statusCode, headers: errorResponseHeaders }
    )
  }
}

