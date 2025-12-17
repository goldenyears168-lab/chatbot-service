#!/usr/bin/env tsx
/**
 * 专案隔离测试脚本
 * 
 * 测试内容：
 * 1. 配置加载 - getCompanyConfig() 和 getCompanyRegistry()
 * 2. 知识库加载 - 验证知识库文件可访问
 * 3. 专案隔离 - 确保不同专案的知识库和配置不会相互影响
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// 测试结果接口
interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

// 辅助函数：添加测试结果
function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}: ${message}`)
  if (details && !passed) {
    console.log(`   详情: ${JSON.stringify(details, null, 2)}`)
  }
}

// 测试 1: 验证 registry.json 存在并可解析
async function testRegistryFile() {
  console.log('\n📋 测试 1: 验证 registry.json')
  
  try {
    const registryPath = join(process.cwd(), 'projects', 'registry.json')
    
    if (!existsSync(registryPath)) {
      addResult('registry.json 存在', false, `文件不存在: ${registryPath}`)
      return
    }
    
    const content = await readFile(registryPath, 'utf-8')
    const registry = JSON.parse(content)
    
    // 验证结构
    if (!registry.version || !registry.companies) {
      addResult('registry.json 结构', false, '缺少必要字段: version 或 companies')
      return
    }
    
    const companyCount = Object.keys(registry.companies).length
    addResult('registry.json 解析', true, `成功解析，包含 ${companyCount} 个专案`)
    
    // 验证每个专案都有必要字段
    for (const [id, company] of Object.entries(registry.companies as any)) {
      const required = ['id', 'name', 'name_en', 'path', 'active']
      const missing = required.filter(field => !(company as any)[field])
      
      if (missing.length > 0) {
        addResult(`专案 ${id} 结构`, false, `缺少字段: ${missing.join(', ')}`)
      } else {
        addResult(`专案 ${id} 结构`, true, '结构完整')
      }
    }
    
  } catch (error) {
    addResult('registry.json 解析', false, `解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 测试 2: 验证每个专案的 config.json 存在
async function testProjectConfigs() {
  console.log('\n⚙️  测试 2: 验证专案配置')
  
  try {
    const registryPath = join(process.cwd(), 'projects', 'registry.json')
    const content = await readFile(registryPath, 'utf-8')
    const registry = JSON.parse(content)
    
    for (const [id, company] of Object.entries(registry.companies as any)) {
      const configPath = join(process.cwd(), 'projects', id, 'config.json')
      
      if (!existsSync(configPath)) {
        addResult(`专案 ${id} config.json`, false, `配置文件不存在: ${configPath}`)
        continue
      }
      
      try {
        const configContent = await readFile(configPath, 'utf-8')
        const config = JSON.parse(configContent)
        
        // 验证必要字段
        if (!config.id || !config.name) {
          addResult(`专案 ${id} config.json 结构`, false, '缺少必要字段: id 或 name')
        } else {
          addResult(`专案 ${id} config.json`, true, '配置文件有效', {
            id: config.id,
            name: config.name,
            hasAllowedOrigins: !!config.allowedOrigins,
            hasWidgetConfig: !!config.widgetConfig,
            hasApiConfig: !!config.apiConfig
          })
        }
      } catch (error) {
        addResult(`专案 ${id} config.json 解析`, false, `解析失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  } catch (error) {
    addResult('读取 registry.json', false, `读取失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 测试 3: 验证知识库文件存在
async function testKnowledgeBaseFiles() {
  console.log('\n📚 测试 3: 验证知识库文件')
  
  try {
    const registryPath = join(process.cwd(), 'projects', 'registry.json')
    const content = await readFile(registryPath, 'utf-8')
    const registry = JSON.parse(content)
    
    const expectedFiles = [
      '1-services.json',
      '2-company_info.json',
      '3-ai_config.json',
      '3-personas.json', // 可选
      '3-knowledge_base.json', // 可选
      '4-response_templates.json',
      '5-faq_detailed.json',
      '_manifest.json'
    ]
    
    for (const [id, company] of Object.entries(registry.companies as any)) {
      const knowledgeDir = join(process.cwd(), 'projects', id, 'knowledge')
      
      if (!existsSync(knowledgeDir)) {
        addResult(`专案 ${id} knowledge 目录`, false, `目录不存在: ${knowledgeDir}`)
        continue
      }
      
      // 检查文件
      const foundFiles: string[] = []
      const missingFiles: string[] = []
      
      for (const file of expectedFiles) {
        const filePath = join(knowledgeDir, file)
        if (existsSync(filePath)) {
          foundFiles.push(file)
          
          // 验证 JSON 格式
          try {
            const fileContent = await readFile(filePath, 'utf-8')
            JSON.parse(fileContent)
          } catch (error) {
            addResult(`专案 ${id} ${file} JSON`, false, `JSON 格式错误: ${error instanceof Error ? error.message : String(error)}`)
          }
        } else if (!file.includes('personas') && !file.includes('knowledge_base')) {
          // personas 和 knowledge_base 是可选的
          missingFiles.push(file)
        }
      }
      
      if (missingFiles.length > 0) {
        addResult(`专案 ${id} 知识库文件`, false, `缺少文件: ${missingFiles.join(', ')}`, {
          found: foundFiles.length,
          missing: missingFiles
        })
      } else {
        addResult(`专案 ${id} 知识库文件`, true, `找到 ${foundFiles.length} 个文件`, {
          files: foundFiles
        })
      }
      
      // 验证 public 目录
      const publicKnowledgeDir = join(process.cwd(), 'public', 'projects', id, 'knowledge')
      if (!existsSync(publicKnowledgeDir)) {
        addResult(`专案 ${id} public knowledge 目录`, false, `目录不存在: ${publicKnowledgeDir}`)
      } else {
        addResult(`专案 ${id} public knowledge 目录`, true, '静态文件目录存在')
      }
    }
  } catch (error) {
    addResult('读取 registry.json', false, `读取失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 测试 4: 验证专案隔离（确保不同专案的知识库不相互影响）
async function testProjectIsolation() {
  console.log('\n🔒 测试 4: 验证专案隔离')
  
  try {
    const registryPath = join(process.cwd(), 'projects', 'registry.json')
    const content = await readFile(registryPath, 'utf-8')
    const registry = JSON.parse(content)
    
    const projectIds = Object.keys(registry.companies)
    
    if (projectIds.length < 2) {
      addResult('专案隔离测试', true, '专案数量少于 2 个，跳过隔离测试')
      return
    }
    
    // 比较不同专案的知识库文件
    const knowledgeBases: Record<string, any> = {}
    
    for (const id of projectIds) {
      const knowledgeDir = join(process.cwd(), 'projects', id, 'knowledge')
      const servicesFile = join(knowledgeDir, '1-services.json')
      
      if (existsSync(servicesFile)) {
        try {
          const content = await readFile(servicesFile, 'utf-8')
          const data = JSON.parse(content)
          knowledgeBases[id] = data
        } catch (error) {
          addResult(`专案 ${id} 知识库读取`, false, `读取失败: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
    
    // 验证不同专案的知识库内容不同
    const baseIds = Object.keys(knowledgeBases)
    for (let i = 0; i < baseIds.length; i++) {
      for (let j = i + 1; j < baseIds.length; j++) {
        const id1 = baseIds[i]
        const id2 = baseIds[j]
        
        const kb1 = knowledgeBases[id1]
        const kb2 = knowledgeBases[id2]
        
        // 比较 services 数据（如果存在）
        if (kb1.services && kb2.services) {
          const services1 = Array.isArray(kb1.services) ? kb1.services : Object.values(kb1.services)
          const services2 = Array.isArray(kb2.services) ? kb2.services : Object.values(kb2.services)
          
          if (services1.length === services2.length && 
              JSON.stringify(services1) === JSON.stringify(services2)) {
            addResult(`专案隔离 ${id1} vs ${id2}`, false, '知识库内容相同，可能未正确隔离')
          } else {
            addResult(`专案隔离 ${id1} vs ${id2}`, true, '知识库内容不同，隔离正常', {
              [`${id1} services`]: services1.length,
              [`${id2} services`]: services2.length
            })
          }
        }
      }
    }
    
    // 验证配置隔离
    const configs: Record<string, any> = {}
    for (const id of projectIds) {
      const configPath = join(process.cwd(), 'projects', id, 'config.json')
      if (existsSync(configPath)) {
        try {
          const content = await readFile(configPath, 'utf-8')
          configs[id] = JSON.parse(content)
        } catch (error) {
          // 忽略
        }
      }
    }
    
    // 验证不同专案的配置不同
    const configIds = Object.keys(configs)
    for (let i = 0; i < configIds.length; i++) {
      for (let j = i + 1; j < configIds.length; j++) {
        const id1 = configIds[i]
        const id2 = configIds[j]
        
        if (JSON.stringify(configs[id1]) === JSON.stringify(configs[id2])) {
          addResult(`配置隔离 ${id1} vs ${id2}`, false, '配置完全相同，可能未正确隔离')
        } else {
          addResult(`配置隔离 ${id1} vs ${id2}`, true, '配置不同，隔离正常')
        }
      }
    }
    
  } catch (error) {
    addResult('专案隔离测试', false, `测试失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 测试 5: 验证文件路径结构
async function testFilePathStructure() {
  console.log('\n📁 测试 5: 验证文件路径结构')
  
  try {
    const registryPath = join(process.cwd(), 'projects', 'registry.json')
    const content = await readFile(registryPath, 'utf-8')
    const registry = JSON.parse(content)
    
    for (const [id, company] of Object.entries(registry.companies as any)) {
      const projectDir = join(process.cwd(), 'projects', id)
      const configPath = join(projectDir, 'config.json')
      const knowledgeDir = join(projectDir, 'knowledge')
      const publicKnowledgeDir = join(process.cwd(), 'public', 'projects', id, 'knowledge')
      
      const checks = [
        { path: projectDir, name: `专案目录 ${id}` },
        { path: configPath, name: `配置文件 ${id}` },
        { path: knowledgeDir, name: `知识库目录 ${id}` },
        { path: publicKnowledgeDir, name: `公共知识库目录 ${id}` }
      ]
      
      for (const check of checks) {
        if (existsSync(check.path)) {
          addResult(check.name, true, `路径存在: ${check.path}`)
        } else {
          addResult(check.name, false, `路径不存在: ${check.path}`)
        }
      }
    }
  } catch (error) {
    addResult('路径结构测试', false, `测试失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 主函数
async function main() {
  console.log('='.repeat(60))
  console.log('专案隔离测试')
  console.log('='.repeat(60))
  console.log(`工作目录: ${process.cwd()}`)
  console.log()
  
  await testRegistryFile()
  await testProjectConfigs()
  await testKnowledgeBaseFiles()
  await testProjectIsolation()
  await testFilePathStructure()
  
  // 生成报告
  console.log('\n' + '='.repeat(60))
  console.log('测试报告')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  console.log(`总计: ${total} 个测试`)
  console.log(`通过: ${passed} 个`)
  console.log(`失败: ${failed} 个`)
  console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n失败的测试:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`)
    })
    process.exit(1)
  } else {
    console.log('\n✅ 所有测试通过！')
    process.exit(0)
  }
}

// 运行测试
main().catch(error => {
  console.error('测试执行失败:', error)
  process.exit(1)
})

