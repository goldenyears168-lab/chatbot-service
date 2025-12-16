import { NextRequest, NextResponse } from 'next/server'

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
    
    // 从 public 目录读取清单文件
    const manifestUrl = `${baseUrl}/projects/${company}/knowledge/_manifest.json`
    let fileList: string[] = []
    
    try {
      const manifestResponse = await fetch(manifestUrl, {
        cache: 'no-store'
      })
      
      if (manifestResponse.ok) {
        fileList = await manifestResponse.json()
      } else {
        // 如果清单文件不存在，尝试常见的文件名模式
        const commonFiles = [
          '1-company_info.json',
          '2-ai_config.json',
          '3-knowledge_base.json',
          '4-services.json',
          '5-faq_detailed.json',
          '6-response_templates.json'
        ]
        fileList = commonFiles
      }
    } catch (error) {
      // 如果清单文件读取失败，尝试常见的文件名模式
      const commonFiles = [
        '1-company_info.json',
        '2-ai_config.json',
        '3-knowledge_base.json',
        '4-services.json',
        '5-faq_detailed.json',
        '6-response_templates.json'
      ]
      fileList = commonFiles
    }
    
    // 过滤出 JSON 文件
    const jsonFiles = fileList.filter(f => f.endsWith('.json') && f !== '_manifest.json')
    
    // 并行读取所有文件
    const fileDataList = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const fileUrl = `${baseUrl}/projects/${company}/knowledge/${file}`
          const fileResponse = await fetch(fileUrl, {
            cache: 'no-store'
          })
          
          if (!fileResponse.ok) {
            return null
          }
          
          const content = await fileResponse.text()
          const data = JSON.parse(content)
          
          // 提取文件信息
          const fileName = file.replace('.json', '')
          const fileNumber = fileName.match(/^\d+/)?.[0] || '0'
          const fileKey = fileName.replace(/^\d+-/, '')
          
          // 估算文件大小（字符数）
          const size = new TextEncoder().encode(content).length
          
          return {
            filename: file,
            name: fileName,
            key: fileKey,
            number: parseInt(fileNumber),
            size: size,
            lastModified: new Date().toISOString(), // Edge Runtime 无法获取文件修改时间
            data: data,
            // 统计信息
            stats: getFileStats(fileKey, data)
          }
        } catch (error) {
          console.error(`Error loading file ${file}:`, error)
          return null
        }
      })
    )
    
    // 过滤掉 null 值并排序
    const validFiles = fileDataList.filter(f => f !== null) as Array<{
      filename: string
      name: string
      key: string
      number: number
      size: number
      lastModified: string
      data: any
      stats: Record<string, any>
    }>
    
    validFiles.sort((a, b) => a.number - b.number)
    
    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: `Knowledge directory not found for company: ${company}` },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      company,
      files: validFiles,
      totalFiles: validFiles.length,
      totalSize: validFiles.reduce((sum, f) => sum + f.size, 0)
    })
  } catch (error) {
    console.error('Error loading knowledge base:', error)
    return NextResponse.json(
      { error: 'Failed to load knowledge base', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

function getFileStats(key: string, data: any): Record<string, any> {
  const stats: Record<string, any> = {}
  
  switch (key) {
    case 'services':
      if (data.services) {
        const services = Array.isArray(data.services) ? data.services : Object.values(data.services)
        stats.count = services.length
        stats.items = services.map((s: any) => s.name || s.id).filter(Boolean)
      }
      break
      
    case 'company_info':
      if (data.branches) {
        stats.branches = Array.isArray(data.branches) ? data.branches.length : Object.keys(data.branches).length
        stats.branchNames = Array.isArray(data.branches) 
          ? data.branches.map((b: any) => b.name).filter(Boolean)
          : Object.values(data.branches).map((b: any) => b.name).filter(Boolean)
      }
      if (data.contact_channels || data.contact) {
        stats.hasContact = true
      }
      break
      
    case 'faq_detailed':
      if (data.categories) {
        const categories = Object.keys(data.categories)
        stats.categories = categories.length
        stats.categoryNames = categories
        let totalQuestions = 0
        categories.forEach((cat: string) => {
          const questions = data.categories[cat]?.questions || []
          totalQuestions += questions.length
        })
        stats.totalQuestions = totalQuestions
      }
      break
      
    case 'ai_config':
      if (data.intents) {
        stats.intents = Array.isArray(data.intents) ? data.intents.length : Object.keys(data.intents).length
      }
      if (data.entities) {
        stats.entities = Array.isArray(data.entities) ? data.entities.length : Object.keys(data.entities).length
      }
      break
      
    case 'response_templates':
      if (data.templates) {
        stats.templates = Array.isArray(data.templates) ? data.templates.length : Object.keys(data.templates).length
      }
      break
      
    case 'personas':
      if (data.personas) {
        stats.personas = Array.isArray(data.personas) ? data.personas.length : Object.keys(data.personas).length
      }
      break
  }
  
  return stats
}

