// app/api/[company]/config/route.ts
import { NextResponse } from 'next/server'
import { getCompanyConfig, validateCompanyId } from '@/lib/config'
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
  const corsHeaders = getCorsHeaders(request)
  
  try {
    const resolvedParams = await params
    const { company } = resolvedParams

    // 验证公司 ID
    const isValidCompany = await validateCompanyId(company)
    if (!isValidCompany) {
      throw new NotFoundError(`Company ${company} not found`)
    }

    // 获取公司配置
    const config = await getCompanyConfig(company)
    if (!config) {
      throw new NotFoundError(`Company ${company} not found`)
    }

    return NextResponse.json(
      {
        id: config.id,
        name: config.name,
        name_en: config.name_en,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    logError(error, { endpoint: '/api/[company]/config' })

    const errorResponse = formatErrorResponse(error)
    const statusCode = error instanceof NotFoundError ? 404 : 500

    return NextResponse.json(
      errorResponse,
      { status: statusCode, headers: corsHeaders }
    )
  }
}

