import { isOriginAllowed } from '@/lib/env'

export function getCorsHeaders(
  request: Request,
  opts: { methods: string; headers: string }
): Record<string, string> {
  const origin = request.headers.get('origin')
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': opts.methods,
    'Access-Control-Allow-Headers': opts.headers,
  }

  if (origin && isOriginAllowed(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
    corsHeaders['Access-Control-Allow-Credentials'] = 'true'
  } else if (process.env.NODE_ENV === 'development') {
    corsHeaders['Access-Control-Allow-Origin'] = origin || '*'
    corsHeaders['Access-Control-Allow-Credentials'] = 'true'
  }

  return corsHeaders
}

export function withCors(resp: Response, corsHeaders: Record<string, string>): Response {
  Object.entries(corsHeaders).forEach(([k, v]) => resp.headers.set(k, v))
  return resp
}


