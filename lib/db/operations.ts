// lib/db/operations.ts
// 数据库管理器

import { createAdminClient } from './admin'
import { generateId } from '@/lib/utils'
import type {
  ConversationRecord,
  MessageRecord,
  UserRecord,
  PerformanceMetric,
  WorkflowExecution,
  FAQQueryRecord,
} from '@/types/database'

export class DatabaseManager {
  private supabase = createAdminClient()

  /**
   * 保存会话记录
   */
  async saveConversation(data: ConversationRecord): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .insert({
        ...data,
        start_time: typeof data.start_time === 'string' ? data.start_time : data.start_time.toISOString(),
        end_time: data.end_time ? (typeof data.end_time === 'string' ? data.end_time : data.end_time.toISOString()) : null,
      })
    
    if (error) throw error
  }

  /**
   * 获取会话
   */
  async getConversation(conversationId: string) {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * 更新会话
   */
  async updateConversation(conversationId: string, updates: Partial<ConversationRecord>): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .update(updates)
      .eq('conversation_id', conversationId)
    
    if (error) throw error
  }

  /**
   * 保存消息
   */
  async saveMessage(data: MessageRecord): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .insert({
        ...data,
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toISOString(),
      })
    
    if (error) throw error
  }

  /**
   * 获取会话的所有消息
   */
  async getConversationMessages(conversationId: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })
    
    if (error) throw error
    return data
  }

  /**
   * 保存用户记录
   */
  async saveUser(data: UserRecord): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .upsert({
        ...data,
        first_seen: typeof data.first_seen === 'string' ? data.first_seen : data.first_seen.toISOString(),
        last_seen: typeof data.last_seen === 'string' ? data.last_seen : data.last_seen.toISOString(),
      }, {
        onConflict: 'company_id,user_id',
      })
    
    if (error) throw error
  }

  /**
   * 获取用户
   */
  async getUser(companyId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * 保存性能指标
   */
  async savePerformanceMetric(data: PerformanceMetric): Promise<void> {
    const { error } = await this.supabase
      .from('performance_metrics')
      .insert({
        ...data,
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toISOString(),
      })
    
    if (error) throw error
  }

  /**
   * 保存工作流执行记录
   */
  async saveWorkflowExecution(data: WorkflowExecution): Promise<void> {
    const { error } = await this.supabase
      .from('workflow_executions')
      .insert({
        ...data,
        start_time: typeof data.start_time === 'string' ? data.start_time : data.start_time.toISOString(),
        end_time: data.end_time ? (typeof data.end_time === 'string' ? data.end_time : data.end_time.toISOString()) : null,
      })
    
    if (error) throw error
  }

  /**
   * 保存 FAQ 查询记录
   */
  async saveFAQQuery(data: FAQQueryRecord): Promise<void> {
    const { error } = await this.supabase
      .from('faq_queries')
      .insert({
        ...data,
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toISOString(),
      })
    
    if (error) throw error
  }

  /**
   * 更新意图统计
   */
  async updateIntentStatistic(companyId: string, intentName: string, success: boolean, responseTime: number): Promise<void> {
    const { data: existing } = await this.supabase
      .from('intent_statistics')
      .select('*')
      .eq('company_id', companyId)
      .eq('intent_name', intentName)
      .single()

    if (existing) {
      // 更新现有记录
      const newCount = existing.count + 1
      const newSuccessCount = existing.success_count + (success ? 1 : 0)
      const newAvgResponseTime = (existing.avg_response_time * existing.count + responseTime) / newCount

      const { error } = await this.supabase
        .from('intent_statistics')
        .update({
          count: newCount,
          success_count: newSuccessCount,
          avg_response_time: newAvgResponseTime,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // 创建新记录
      const { error } = await this.supabase
        .from('intent_statistics')
        .insert({
          id: generateId('intent'),
          company_id: companyId,
          intent_name: intentName,
          count: 1,
          success_count: success ? 1 : 0,
          avg_response_time: responseTime,
        })

      if (error) throw error
    }
  }

  /**
   * 增加消息计数（使用数据库函数）
   */
  async incrementMessageCount(conversationId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_message_count', {
      conv_id: conversationId,
    })
    
    if (error) throw error
  }

  /**
   * 获取公司统计信息
   */
  async getCompanyStats(companyId: string, days: number = 7) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    // 获取会话 ID 列表
    const { data: conversationsData } = await this.supabase
      .from('conversations')
      .select('conversation_id')
      .eq('company_id', companyId)
      .gte('created_at', since.toISOString())

    const conversationIds = conversationsData?.map(c => c.conversation_id) || []

    const [conversations, messages, users] = await Promise.all([
      this.supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', since.toISOString()),
      conversationIds.length > 0
        ? this.supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'user')
            .gte('created_at', since.toISOString())
            .in('conversation_id', conversationIds)
        : { count: 0, error: null },
      this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('last_seen', since.toISOString()),
    ])

    return {
      conversations: conversations.count || 0,
      messages: messages.count || 0,
      activeUsers: users.count || 0,
    }
  }
}
