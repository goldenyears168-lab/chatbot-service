import { loadKnowledgeData } from '@/lib/knowledge/loader'
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

  const company = params.company
  if (!company) {
    return withCors(
      new Response(JSON.stringify({ error: 'Company ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
      cors
    )
  }

  try {
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const knowledgeData = await loadKnowledgeData(company, baseUrl)
    return withCors(
      new Response(JSON.stringify(knowledgeData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      cors
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const status = errorMessage.includes('not found') ? 404 : 500
    return withCors(
      new Response(
        JSON.stringify(
          status === 404
            ? { error: errorMessage }
            : { error: 'Failed to load knowledge base', details: errorMessage }
        ),
        { status, headers: { 'Content-Type': 'application/json' } }
      ),
      cors
    )
  }
}


