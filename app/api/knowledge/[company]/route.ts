import { NextRequest, NextResponse } from 'next/server'
import { loadKnowledgeData } from '@/lib/knowledge/loader'

// 使用 Edge Runtime（Cloudflare Pages 要求）
export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ company: string }> | { company: string } }
) {
  try {
    const { company } = await Promise.resolve(params)
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // 获取 base URL（从请求中推断）
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    
    // 使用共享的加载函数
    const knowledgeData = await loadKnowledgeData(company, baseUrl)
    
    return NextResponse.json(knowledgeData)
  } catch (error) {
    console.error('Error loading knowledge base:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // 如果是文件未找到的错误，返回 404
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to load knowledge base', details: errorMessage },
      { status: 500 }
    )
  }
}

