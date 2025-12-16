// scripts/migrate-d1-to-supabase.ts
// 可选：从 Cloudflare D1 迁移数据到 Supabase

// import { DatabaseManager } from '@/lib/db' // Reserved for future use

/**
 * 从 D1 导出数据并迁移到 Supabase
 * 
 * 使用说明：
 * 1. 首先需要从 Cloudflare D1 导出数据（使用 wrangler d1 execute）
 * 2. 将数据转换为 Supabase 格式
 * 3. 使用此脚本批量插入
 */

async function migrateData() {
  // const db = new DatabaseManager() // Reserved for future use
  
  try {
    console.log('开始数据迁移...')
    
    // TODO: 从 D1 导出数据
    // const d1Data = await exportD1Data()
    
    // 示例：迁移会话数据
    // const conversations = d1Data.conversations.map(conv => ({
    //   id: conv.id,
    //   company_id: conv.company_id,
    //   conversation_id: conv.conversation_id,
    //   user_id: conv.user_id,
    //   start_time: new Date(conv.start_time),
    //   end_time: conv.end_time ? new Date(conv.end_time) : null,
    //   message_count: conv.message_count,
    //   status: conv.status,
    //   metadata: conv.metadata ? JSON.parse(conv.metadata) : null,
    // }))
    
    // await db.saveConversation(conversations[0])
    
    console.log('✅ 数据迁移完成')
  } catch (error) {
    console.error('❌ 数据迁移失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { migrateData }

