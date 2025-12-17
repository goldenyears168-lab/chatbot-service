import { getKnowledgeBase } from '@/lib/knowledge'
import { validateCompanyId } from '@/lib/config'
import { formatErrorResponse, logError, NotFoundError } from '@/lib/error-handler'
import { getCorsHeaders, withCors } from '@/functions/_utils/cors'

export const onRequest = async (context: any) => {
  const { request, params } = context as { request: Request; params: Record<string, string> }
  const cors = getCorsHeaders(request, { methods: 'GET, OPTIONS', headers: 'Content-Type' })

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (request.method !== 'GET') {
    return withCors(new Response('Method Not Allowed', { status: 405 }), cors)
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

    const aiConfig = (knowledgeBase as any).aiConfig || (knowledgeBase as any).ai_config || {}
    const responseTemplates = (knowledgeBase as any).responseTemplates || (knowledgeBase as any).response_templates || {}

    const aiConfigObj = typeof aiConfig === 'object' && aiConfig !== null ? (aiConfig as Record<string, unknown>) : {}
    const responseTemplatesObj =
      typeof responseTemplates === 'object' && responseTemplates !== null ? (responseTemplates as Record<string, unknown>) : {}

    return withCors(
      new Response(
        JSON.stringify({
          ui:
            aiConfigObj.ui && typeof aiConfigObj.ui === 'object' && aiConfigObj.ui !== null
              ? aiConfigObj.ui
              : { removeMarkdownBold: true },
          responseTemplates:
            responseTemplatesObj.templates &&
            typeof responseTemplatesObj.templates === 'object' &&
            responseTemplatesObj.templates !== null
              ? responseTemplatesObj.templates
              : {},
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      cors
    )
  } catch (error) {
    logError(error, { endpoint: '/api/[company]/ui-config' })

    const errorResponse = formatErrorResponse(error)
    const statusCode = error instanceof NotFoundError ? 404 : 500

    return withCors(
      new Response(JSON.stringify(errorResponse), { status: statusCode, headers: { 'Content-Type': 'application/json' } }),
      cors
    )
  }
}


