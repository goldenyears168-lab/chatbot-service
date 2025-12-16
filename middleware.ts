// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isOriginAllowed } from '@/lib/env'

export function middleware(request: NextRequest) {
  // 为 Widget 相关路由添加 CORS 头
  if (request.nextUrl.pathname.startsWith('/widget/') || 
      request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // 设置 CORS 头（使用白名单）
    const origin = request.headers.get('origin')
    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    } else if (process.env.NODE_ENV === 'development') {
      // 开发环境允许所有来源
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    // 生产环境如果 origin 不在白名单中，不设置 CORS 头
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // 安全头
    // 注意：如果需要允许 iframe 嵌入，应该移除 X-Frame-Options 或设置为 SAMEORIGIN
    // 'ALLOWALL' 不是标准值，移除该头部以允许 iframe 嵌入（Widget 需要）
    // response.headers.set('X-Frame-Options', 'SAMEORIGIN') // 如果需要限制，使用 SAMEORIGIN
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/widget/:path*', '/api/:path*'],
}

