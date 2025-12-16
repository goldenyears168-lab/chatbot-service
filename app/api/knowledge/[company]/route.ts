import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

// 确保使用 Node.js runtime（需要文件系统访问）
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
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

    const cwd = process.cwd()
    const knowledgeDir = join(cwd, 'projects', company, 'knowledge')
    
    try {
      const files = await readdir(knowledgeDir)
      const jsonFiles = files.filter(f => f.endsWith('.json'))
      
      const fileList = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = join(knowledgeDir, file)
          const fileStat = await stat(filePath)
          const content = await readFile(filePath, 'utf-8')
          const data = JSON.parse(content)
          
          // 提取文件信息
          const fileName = file.replace('.json', '')
          const fileNumber = fileName.match(/^\d+/)?.[0] || '0'
          const fileKey = fileName.replace(/^\d+-/, '')
          
          return {
            filename: file,
            name: fileName,
            key: fileKey,
            number: parseInt(fileNumber),
            size: fileStat.size,
            lastModified: fileStat.mtime.toISOString(),
            data: data,
            // 统计信息
            stats: getFileStats(fileKey, data)
          }
        })
      )
      
      // 按文件编号排序
      fileList.sort((a, b) => a.number - b.number)
      
      return NextResponse.json({
        company,
        files: fileList,
        totalFiles: fileList.length,
        totalSize: fileList.reduce((sum, f) => sum + f.size, 0)
      })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { error: `Knowledge directory not found for company: ${company}` },
          { status: 404 }
        )
      }
      throw error
    }
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

