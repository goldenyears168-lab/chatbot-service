// scripts/test-supabase.ts
// 测试 Supabase 连接

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '@/lib/db'

async function testConnection() {
  console.log('🔍 测试 Supabase 连接...\n')
  
  try {
    const supabase = createAdminClient()
    
    // 测试 1: 检查连接
    console.log('1. 测试数据库连接...')
    const { error } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ⚠️  表 conversations 不存在，请先执行数据库迁移')
        console.log('   📝  在 Supabase SQL Editor 中执行 sql/01-init.sql\n')
      } else {
        throw error
      }
    } else {
      console.log('   ✅ 数据库连接成功！\n')
    }
    
    // 测试 2: 检查 pgvector 扩展（通过查询 messages 表的 embedding 字段）
    console.log('2. 检查 pgvector 扩展...')
    try {
      const { error: extError } = await supabase
        .from('messages')
        .select('embedding')
        .limit(1)
      
      if (extError) {
        if (extError.code === '42703') {
          console.log('   ⚠️  embedding 字段不存在，请执行数据库迁移')
          console.log('   📝  在 Supabase SQL Editor 中执行 sql/01-init.sql\n')
        } else if (extError.message?.includes('vector')) {
          console.log('   ⚠️  pgvector 扩展未启用')
          console.log('   📝  在 Supabase SQL Editor 中执行: CREATE EXTENSION IF NOT EXISTS vector;\n')
        } else {
          console.log('   ⚠️  无法检查 pgvector 扩展:', extError.message)
        }
      } else {
        console.log('   ✅ pgvector 扩展可用\n')
      }
    } catch (error: any) {
      console.log('   ⚠️  无法检查 pgvector 扩展:', error.message)
      console.log('   📝  确保已在 Supabase 中执行: CREATE EXTENSION IF NOT EXISTS vector;\n')
    }
    
    // 测试 3: 检查环境变量
    console.log('3. 检查环境变量...')
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasGeminiKey = !!process.env.GEMINI_API_KEY
    
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? '✅' : '❌'}`)
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? '✅' : '❌'}`)
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? '✅' : '❌'}`)
    console.log(`   GEMINI_API_KEY: ${hasGeminiKey ? '✅' : '❌'}`)
    
    if (!hasGeminiKey) {
      console.log('\n   ⚠️  请配置 GEMINI_API_KEY 环境变量')
    }
    
    console.log('\n✅ 所有测试完成！')
    
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('\n可能的原因:')
    console.error('1. 环境变量未正确配置')
    console.error('2. Supabase 项目未创建或 URL 错误')
    console.error('3. 网络连接问题')
    process.exit(1)
  }
}

// 运行测试
testConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

