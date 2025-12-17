import { getKnowledgeBase } from '@/lib/knowledge'
import { validateCompanyId } from '@/lib/config'
import { formatErrorResponse, logError, NotFoundError } from '@/lib/error-handler'
import { createRateLimit } from '@/lib/rate-limit'
import { hasStatusCode } from '@/types/chat'
import { getCorsHeaders, withCors } from '@/functions/_utils/cors'

const rateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 60,
})

export const onRequest = async (context: any) => {
  const { request, params } = context as { request: Request; params: Record<string, string> }
  const cors = getCorsHeaders(request, { methods: 'GET, OPTIONS', headers: 'Content-Type' })

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (request.method !== 'GET') {
    return withCors(new Response('Method Not Allowed', { status: 405 }), cors)
  }

  const rateLimitResponse = await rateLimit(request)
  if (rateLimitResponse) {
    return withCors(rateLimitResponse, cors)
  }

  try {
    const company = params.company
    if (!company) throw new NotFoundError('Company is required')

    const isValidCompany = await validateCompanyId(company)
    if (!isValidCompany) {
      throw new NotFoundError(`Company ${company} not found`)
    }

    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const knowledgeBase = await getKnowledgeBase(company, baseUrl)

    const faqData = knowledgeBase.faq_detailed || knowledgeBase.faq || (knowledgeBase as any).faqMenu || null
    if (faqData && typeof faqData === 'object' && faqData !== null && 'categories' in faqData) {
      return withCors(
        new Response(JSON.stringify(faqData), { status: 200, headers: { 'Content-Type': 'application/json' } }),
        cors
      )
    }

    return withCors(
      new Response(JSON.stringify({ categories: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      cors
    )
  } catch (error) {
    logError(error, { company: params.company, endpoint: '/api/[company]/faq-menu' })

    const errorResponse = formatErrorResponse(error)
    const statusCode = hasStatusCode(error) ? (error.statusCode ?? 500) : 500

    return withCors(
      new Response(JSON.stringify(errorResponse), { status: statusCode, headers: { 'Content-Type': 'application/json' } }),
      cors
    )
  }
}


