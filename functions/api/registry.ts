import registry from '@/projects/registry.json'
import { getCorsHeaders, withCors } from '@/functions/_utils/cors'

export const onRequest = async (context: any) => {
  const { request } = context
  const cors = getCorsHeaders(request, { methods: 'GET, OPTIONS', headers: 'Content-Type' })

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (request.method !== 'GET') {
    return withCors(new Response('Method Not Allowed', { status: 405 }), cors)
  }

  return withCors(
    new Response(JSON.stringify(registry), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    cors
  )
}


