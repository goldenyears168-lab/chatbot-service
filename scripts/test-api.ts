// scripts/test-api.ts
// 测试 API 端点

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function testAPI() {
  console.log('🧪 开始测试 API...\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  // 测试 1: FAQ Menu API
  console.log('1. 测试 FAQ Menu API...')
  try {
    const faqResponse = await fetch(`${BASE_URL}/api/goldenyears/faq-menu`)
    const faqData = await faqResponse.json()
    console.log(`   Status: ${faqResponse.status}`)
    console.log(`   Response: ${JSON.stringify(faqData).substring(0, 100)}...`)
    console.log('   ✅ FAQ Menu API 测试通过\n')
  } catch (error: any) {
    console.log(`   ❌ FAQ Menu API 测试失败: ${error.message}\n`)
  }

  // 测试 2: Chat API（简单测试）
  console.log('2. 测试 Chat API...')
  try {
    const chatResponse = await fetch(`${BASE_URL}/api/goldenyears/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '你好',
        sessionId: `test_${Date.now()}`,
      }),
    })
    
    console.log(`   Status: ${chatResponse.status}`)
    
    if (chatResponse.ok) {
      // 读取流式响应
      const reader = chatResponse.body?.getReader()
      if (reader) {
        const decoder = new TextDecoder()
        let received = false
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          if (chunk) {
            received = true
            console.log(`   ✅ 收到流式响应: ${chunk.substring(0, 50)}...`)
            break // 只读取第一个 chunk 作为测试
          }
        }
        
        if (!received) {
          console.log('   ⚠️  未收到流式响应')
        }
      } else {
        console.log('   ⚠️  响应体为空')
      }
    } else {
      const errorText = await chatResponse.text()
      console.log(`   ❌ Chat API 错误: ${errorText.substring(0, 200)}`)
    }
    console.log('')
  } catch (error: any) {
    console.log(`   ❌ Chat API 测试失败: ${error.message}\n`)
  }

  // 测试 3: 主页
  console.log('3. 测试主页...')
  try {
    const homeResponse = await fetch(`${BASE_URL}/`)
    console.log(`   Status: ${homeResponse.status}`)
    if (homeResponse.ok) {
      console.log('   ✅ 主页可访问\n')
    } else {
      console.log('   ❌ 主页返回错误状态\n')
    }
  } catch (error: any) {
    console.log(`   ❌ 主页测试失败: ${error.message}\n`)
  }

  // 测试 4: Widget 页面
  console.log('4. 测试 Widget 页面...')
  try {
    const widgetResponse = await fetch(`${BASE_URL}/widget/chat?company=goldenyears`)
    console.log(`   Status: ${widgetResponse.status}`)
    if (widgetResponse.ok) {
      console.log('   ✅ Widget 页面可访问\n')
    } else {
      console.log('   ❌ Widget 页面返回错误状态\n')
    }
  } catch (error: any) {
    console.log(`   ❌ Widget 页面测试失败: ${error.message}\n`)
  }

  console.log('✅ 所有测试完成！')
}

// 运行测试
testAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('测试失败:', error)
    process.exit(1)
  })

