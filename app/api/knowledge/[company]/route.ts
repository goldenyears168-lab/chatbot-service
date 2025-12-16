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
    } catch {
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
      data: unknown
      stats: Record<string, unknown>
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

function getFileStats(key: string, data: unknown): Record<string, unknown> {
  const stats: Record<string, unknown> = {}
  
  // 类型守卫：检查 data 是否为对象
  if (typeof data !== 'object' || data === null) {
    return stats
  }
  
  const dataObj = data as Record<string, unknown>
  
  switch (key) {
    case 'services':
      if (dataObj.services) {
        const services = Array.isArray(dataObj.services) ? dataObj.services : Object.values(dataObj.services)
        stats.count = services.length
        stats.items = services.map((s: unknown) => {
          if (typeof s === 'object' && s !== null) {
            const service = s as Record<string, unknown>
            return service.name || service.id
          }
          return null
        }).filter(Boolean)
      }
      break
      
    case 'company_info':
      if (dataObj.branches) {
        const branches = dataObj.branches
        stats.branches = Array.isArray(branches) ? branches.length : Object.keys(branches as Record<string, unknown>).length
        stats.branchNames = Array.isArray(branches) 
          ? branches.map((b: unknown) => {
              if (typeof b === 'object' && b !== null) {
                const branch = b as Record<string, unknown>
                return branch.name
              }
              return null
            }).filter(Boolean)
          : Object.values(branches as Record<string, unknown>).map((b: unknown) => {
              if (typeof b === 'object' && b !== null) {
                const branch = b as Record<string, unknown>
                return branch.name
              }
              return null
            }).filter(Boolean)
      }
      if ('contact_channels' in dataObj || 'contact' in dataObj) {
        stats.hasContact = true
      }
      break
      
    case 'faq_detailed':
      if (dataObj.categories && typeof dataObj.categories === 'object') {
        const categories = Object.keys(dataObj.categories)
        stats.categories = categories.length
        stats.categoryNames = categories
        let totalQuestions = 0
        categories.forEach((cat: string) => {
          const category = (dataObj.categories as Record<string, unknown>)[cat]
          if (typeof category === 'object' && category !== null) {
            const categoryObj = category as Record<string, unknown>
            const questions = Array.isArray(categoryObj.questions) ? categoryObj.questions : []
            totalQuestions += questions.length
          }
        })
        stats.totalQuestions = totalQuestions
      }
      break
      
    case 'ai_config':
      if (dataObj.intents) {
        stats.intents = Array.isArray(dataObj.intents) ? dataObj.intents.length : Object.keys(dataObj.intents as Record<string, unknown>).length
      }
      if (dataObj.entities) {
        stats.entities = Array.isArray(dataObj.entities) ? dataObj.entities.length : Object.keys(dataObj.entities as Record<string, unknown>).length
      }
      break
      
    case 'response_templates':
      if (dataObj.templates) {
        stats.templates = Array.isArray(dataObj.templates) ? dataObj.templates.length : Object.keys(dataObj.templates as Record<string, unknown>).length
      }
      break
      
    case 'personas':
      if (dataObj.personas) {
        stats.personas = Array.isArray(dataObj.personas) ? dataObj.personas.length : Object.keys(dataObj.personas as Record<string, unknown>).length
      }
      break
  }
  
  return stats
}

