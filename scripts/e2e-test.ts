// scripts/e2e-test.ts
// 端到端测试脚本

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

const results: TestResult[] = []

async function runTest(name: string, testFn: () => Promise<void>) {
  const startTime = Date.now()
  try {
    await testFn()
    const duration = Date.now() - startTime
    results.push({ name, passed: true, duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error: any) {
    const duration = Date.now() - startTime
    results.push({ name, passed: false, error: error.message, duration })
    console.log(`❌ ${name} (${duration}ms): ${error.message}`)
  }
}

async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) })
    return response.ok
  } catch (error) {
    return false
  }
}

async function e2eTests() {
  console.log('🧪 开始端到端测试...\n')
  console.log(`Base URL: ${BASE_URL}\n`)
  
  // 检查服务器是否运行
  console.log('检查开发服务器...')
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.error(`❌ 无法连接到 ${BASE_URL}`)
    console.error('请确保开发服务器正在运行: npm run dev')
    process.exit(1)
  }
  console.log('✅ 开发服务器运行中\n')

  // 测试 1: 主页可访问
  await runTest('主页可访问', async () => {
    const response = await fetch(`${BASE_URL}/`)
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }
  })

  // 测试 2: 公司注册表加载
  await runTest('公司注册表加载', async () => {
    const response = await fetch(`${BASE_URL}/`)
    const html = await response.text()
    if (!html.includes('好時有影') && !html.includes('goldenyears')) {
      throw new Error('Company registry not loaded')
    }
  })

  // 测试 3: Demo 页面
  await runTest('Demo 页面可访问', async () => {
    const response = await fetch(`${BASE_URL}/demo/goldenyears`)
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }
  })

  // 测试 4: Widget 页面
  await runTest('Widget 页面可访问', async () => {
    const response = await fetch(`${BASE_URL}/widget/chat?company=goldenyears`)
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }
  })

  // 测试 5: FAQ Menu API
  await runTest('FAQ Menu API', async () => {
    const response = await fetch(`${BASE_URL}/api/goldenyears/faq-menu`)
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }
    const data = await response.json()
    if (typeof data !== 'object') {
      throw new Error('Invalid response format')
    }
  })

  // 测试 6: Chat API（简单测试）
  await runTest('Chat API 响应', async () => {
    const response = await fetch(`${BASE_URL}/api/goldenyears/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'test',
        sessionId: `e2e-test-${Date.now()}`,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Status: ${response.status}, Error: ${errorText.substring(0, 100)}`)
    }
    
    // 检查是否是流式响应
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('text/plain')) {
      throw new Error('Expected text/plain stream response')
    }
  })

  // 测试 7: CORS 头
  await runTest('CORS 头设置', async () => {
    const response = await fetch(`${BASE_URL}/api/goldenyears/faq-menu`, {
      method: 'OPTIONS',
    })
    
    const corsHeader = response.headers.get('access-control-allow-origin')
    if (!corsHeader) {
      throw new Error('CORS header not set')
    }
  })

  // 测试 8: 无效公司 ID
  await runTest('无效公司 ID 处理', async () => {
    const response = await fetch(`${BASE_URL}/api/invalid-company/faq-menu`)
    if (response.status !== 404) {
      throw new Error(`Expected 404, got ${response.status}`)
    }
  })

  // 输出测试结果
  console.log('\n📊 测试结果总结:')
  console.log('='.repeat(50))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration}ms)` : ''
    console.log(`${icon} ${result.name}${duration}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  
  console.log('='.repeat(50))
  console.log(`总计: ${results.length} 个测试`)
  console.log(`通过: ${passed}`)
  console.log(`失败: ${failed}`)
  console.log(`总耗时: ${totalDuration}ms`)
  
  if (failed > 0) {
    console.log('\n❌ 部分测试失败')
    process.exit(1)
  } else {
    console.log('\n✅ 所有测试通过！')
    process.exit(0)
  }
}

// 运行测试
e2eTests().catch((error) => {
  console.error('测试执行失败:', error)
  process.exit(1)
})

