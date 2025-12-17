import { getCompanyConfig, validateCompanyId } from '@/lib/config'
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

    const config = await getCompanyConfig(company)
    if (!config) {
      throw new NotFoundError(`Company ${company} not found`)
    }

    return withCors(
      new Response(
        JSON.stringify({
          id: config.id,
          name: config.name,
          name_en: config.name_en,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      cors
    )
  } catch (error) {
    logError(error, { endpoint: '/api/[company]/config' })

    const errorResponse = formatErrorResponse(error)
    const statusCode = error instanceof NotFoundError ? 404 : 500

    return withCors(
      new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }),
      cors
    )
  }
}


