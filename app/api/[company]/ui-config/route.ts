// app/api/[company]/ui-config/route.ts
// 返回项目的 UI 配置和响应模板

import { NextResponse } from 'next/server'
import { getKnowledgeBase } from '@/lib/knowledge'
import { validateCompanyId } from '@/lib/config'
import { formatErrorResponse, logError, NotFoundError } from '@/lib/error-handler'
import { isOriginAllowed } from '@/lib/env'

export const runtime = 'edge'
export const maxDuration = 10

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
  const corsHeaders = getCorsHeaders(request)
  
  try {
    const { company } = await params
    
    // 验证公司 ID
    const isValidCompany = await validateCompanyId(company)
    if (!isValidCompany) {
      throw new NotFoundError(`Company ${company} not found`)
    }
    
    // 获取知识库
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const knowledgeBase = await getKnowledgeBase(company, baseUrl)
    
    const aiConfig = knowledgeBase.aiConfig || knowledgeBase.ai_config || {}
    const responseTemplates = knowledgeBase.responseTemplates || knowledgeBase.response_templates || {}
    
    return NextResponse.json(
      {
        ui: aiConfig.ui || { removeMarkdownBold: true },
        responseTemplates: responseTemplates.templates || {},
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    logError(error, { endpoint: '/api/[company]/ui-config' })
    
    const errorResponse = formatErrorResponse(error)
    const statusCode = error instanceof NotFoundError ? 404 : 500
    
    return NextResponse.json(
      errorResponse,
      { status: statusCode, headers: corsHeaders }
    )
  }
}

