/**
 * Database Management
 * 
 * 使用 Cloudflare D1 数据库进行数据持久化
 * 
 * @version 1.0.0
 */

import { DATABASE_SCHEMA } from './schema.js';
import type {
  ConversationRecord,
  MessageRecord,
  UserRecord,
  PerformanceMetric,
  WorkflowExecution,
  FAQQueryRecord,
  IntentStatistic,
} from './schema.js';

/**
 * 数据库管理器
 */
export class DatabaseManager {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 初始化数据库表
   */
  async initialize(): Promise<void> {
    try {
      // 创建表
      await this.db.exec(DATABASE_SCHEMA.conversations);
      await this.db.exec(DATABASE_SCHEMA.messages);
      await this.db.exec(DATABASE_SCHEMA.users);
      await this.db.exec(DATABASE_SCHEMA.performance_metrics);
      await this.db.exec(DATABASE_SCHEMA.workflow_executions);
      await this.db.exec(DATABASE_SCHEMA.faq_queries);
      await this.db.exec(DATABASE_SCHEMA.intent_statistics);

      // 创建索引
      for (const indexSQL of DATABASE_SCHEMA.indexes) {
        await this.db.exec(indexSQL);
      }

      console.log('[Database] Initialized successfully');
    } catch (error) {
      console.error('[Database] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 保存会话记录
   */
  async saveConversation(record: ConversationRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO conversations 
         (id, company_id, conversation_id, user_id, start_time, end_time, message_count, status, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.companyId,
        record.conversationId,
        record.userId || null,
        record.startTime.toISOString(),
        record.endTime?.toISOString() || null,
        record.messageCount,
        record.status,
        JSON.stringify(record.metadata || {})
      )
      .run();
  }

  /**
   * 保存消息记录
   */
  async saveMessage(record: MessageRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO messages 
         (id, conversation_id, role, content, timestamp, intent, entities, response_time, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.conversationId,
        record.role,
        record.content,
        record.timestamp.toISOString(),
        record.intent || null,
        JSON.stringify(record.entities || {}),
        record.responseTime || null,
        JSON.stringify(record.metadata || {})
      )
      .run();
  }

  /**
   * 保存用户记录
   */
  async saveUser(record: UserRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO users 
         (id, company_id, user_id, first_seen, last_seen, conversation_count, message_count, preferences, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.companyId,
        record.userId,
        record.firstSeen.toISOString(),
        record.lastSeen.toISOString(),
        record.conversationCount,
        record.messageCount,
        JSON.stringify(record.preferences || {}),
        JSON.stringify(record.metadata || {})
      )
      .run();
  }

  /**
   * 保存性能指标
   */
  async savePerformanceMetric(metric: PerformanceMetric): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO performance_metrics 
         (id, company_id, workflow_id, timestamp, execution_time, node_metrics, memory_usage, cpu_usage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        metric.id,
        metric.companyId,
        metric.workflowId,
        metric.timestamp.toISOString(),
        metric.executionTime,
        JSON.stringify(metric.nodeMetrics),
        metric.memoryUsage || null,
        metric.cpuUsage || null
      )
      .run();
  }

  /**
   * 保存工作流执行记录
   */
  async saveWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO workflow_executions 
         (id, session_id, workflow_id, company_id, start_time, end_time, status, 
          nodes_executed, nodes_failed, total_execution_time, error_message, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        execution.id,
        execution.sessionId,
        execution.workflowId,
        execution.companyId,
        execution.startTime.toISOString(),
        execution.endTime?.toISOString() || null,
        execution.status,
        execution.nodesExecuted,
        execution.nodesFailed,
        execution.totalExecutionTime || null,
        execution.errorMessage || null,
        JSON.stringify(execution.metadata || {})
      )
      .run();
  }

  /**
   * 保存 FAQ 查询记录
   */
  async saveFAQQuery(record: FAQQueryRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO faq_queries 
         (id, company_id, conversation_id, question, matched_faq, confidence, timestamp, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.companyId,
        record.conversationId,
        record.question,
        record.matchedFAQ || null,
        record.confidence || null,
        record.timestamp.toISOString(),
        record.source
      )
      .run();
  }

  /**
   * 更新意图统计
   */
  async updateIntentStatistic(stat: IntentStatistic): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO intent_statistics 
         (id, company_id, intent, count, success_rate, avg_response_time, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        stat.id,
        stat.companyId,
        stat.intent,
        stat.count,
        stat.successRate,
        stat.avgResponseTime,
        stat.lastUpdated.toISOString()
      )
      .run();
  }

  /**
   * 获取会话记录
   */
  async getConversation(conversationId: string): Promise<ConversationRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM conversations WHERE conversation_id = ?')
      .bind(conversationId)
      .first();

    if (!result) return null;

    return this.parseConversationRecord(result);
  }

  /**
   * 获取用户的所有会话
   */
  async getUserConversations(
    companyId: string,
    userId: string,
    limit: number = 10
  ): Promise<ConversationRecord[]> {
    const results = await this.db
      .prepare(
        `SELECT * FROM conversations 
         WHERE company_id = ? AND user_id = ? 
         ORDER BY start_time DESC 
         LIMIT ?`
      )
      .bind(companyId, userId, limit)
      .all();

    return results.results.map((r) => this.parseConversationRecord(r));
  }

  /**
   * 获取会话的所有消息
   */
  async getConversationMessages(conversationId: string): Promise<MessageRecord[]> {
    const results = await this.db
      .prepare(
        `SELECT * FROM messages 
         WHERE conversation_id = ? 
         ORDER BY timestamp ASC`
      )
      .bind(conversationId)
      .all();

    return results.results.map((r) => this.parseMessageRecord(r));
  }

  /**
   * 获取性能统计
   */
  async getPerformanceStats(
    companyId: string,
    workflowId?: string,
    days: number = 7
  ): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = `
      SELECT 
        COUNT(*) as total_executions,
        AVG(execution_time) as avg_execution_time,
        MIN(execution_time) as min_execution_time,
        MAX(execution_time) as max_execution_time
      FROM performance_metrics
      WHERE company_id = ? AND timestamp >= ?
    `;

    const bindings: any[] = [companyId, startDate.toISOString()];

    if (workflowId) {
      query += ' AND workflow_id = ?';
      bindings.push(workflowId);
    }

    const result = await this.db.prepare(query).bind(...bindings).first();

    return result;
  }

  /**
   * 获取意图统计
   */
  async getIntentStats(companyId: string): Promise<IntentStatistic[]> {
    const results = await this.db
      .prepare(
        `SELECT * FROM intent_statistics 
         WHERE company_id = ? 
         ORDER BY count DESC`
      )
      .bind(companyId)
      .all();

    return results.results.map((r) => this.parseIntentStatistic(r));
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData(days: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString();

    // 清理旧消息
    await this.db
      .prepare('DELETE FROM messages WHERE timestamp < ?')
      .bind(cutoffStr)
      .run();

    // 清理旧性能指标
    await this.db
      .prepare('DELETE FROM performance_metrics WHERE timestamp < ?')
      .bind(cutoffStr)
      .run();

    // 清理旧工作流执行
    await this.db
      .prepare('DELETE FROM workflow_executions WHERE start_time < ?')
      .bind(cutoffStr)
      .run();

    console.log(`[Database] Cleaned up data older than ${days} days`);
  }

  // 辅助解析方法
  private parseConversationRecord(row: any): ConversationRecord {
    return {
      id: row.id,
      companyId: row.company_id,
      conversationId: row.conversation_id,
      userId: row.user_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      messageCount: row.message_count,
      status: row.status,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
  }

  private parseMessageRecord(row: any): MessageRecord {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      timestamp: new Date(row.timestamp),
      intent: row.intent,
      entities: row.entities ? JSON.parse(row.entities) : {},
      responseTime: row.response_time,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
  }

  private parseIntentStatistic(row: any): IntentStatistic {
    return {
      id: row.id,
      companyId: row.company_id,
      intent: row.intent,
      count: row.count,
      successRate: row.success_rate,
      avgResponseTime: row.avg_response_time,
      lastUpdated: new Date(row.last_updated),
    };
  }
}

export default DatabaseManager;
