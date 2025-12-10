/**
 * Analytics and Reporting
 * 
 * 数据分析和报表功能
 * 
 * @version 1.0.0
 */

import { DatabaseManager } from './database.js';

/**
 * 统计数据接口
 */
export interface AnalyticsStats {
  totalConversations: number;
  totalMessages: number;
  totalUsers: number;
  avgMessagesPerConversation: number;
  avgResponseTime: number;
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
  conversationsByStatus: Array<{ status: string; count: number }>;
  messagesByHour: Array<{ hour: number; count: number }>;
  faqHitRate: number;
}

/**
 * 趋势数据接口
 */
export interface TrendData {
  date: string;
  conversations: number;
  messages: number;
  avgResponseTime: number;
}

/**
 * 数据分析服务
 */
export class AnalyticsService {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 获取公司统计数据
   */
  async getCompanyStats(companyId: string, days: number = 7): Promise<AnalyticsStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // 总会话数
    const totalConversations = await this.db.db
      .prepare(
        'SELECT COUNT(*) as count FROM conversations WHERE company_id = ? AND start_time >= ?'
      )
      .bind(companyId, startDateStr)
      .first();

    // 总消息数
    const totalMessages = await this.db.db
      .prepare(
        `SELECT COUNT(*) as count FROM messages 
         WHERE conversation_id IN (
           SELECT conversation_id FROM conversations 
           WHERE company_id = ? AND start_time >= ?
         )`
      )
      .bind(companyId, startDateStr)
      .first();

    // 总用户数
    const totalUsers = await this.db.db
      .prepare(
        'SELECT COUNT(DISTINCT user_id) as count FROM conversations WHERE company_id = ? AND start_time >= ?'
      )
      .bind(companyId, startDateStr)
      .first();

    // 平均响应时间
    const avgResponseTime = await this.db.db
      .prepare(
        `SELECT AVG(response_time) as avg FROM messages 
         WHERE response_time IS NOT NULL 
         AND role = 'assistant'
         AND conversation_id IN (
           SELECT conversation_id FROM conversations 
           WHERE company_id = ? AND start_time >= ?
         )`
      )
      .bind(companyId, startDateStr)
      .first();

    // 热门意图
    const topIntentsData = await this.db.db
      .prepare(
        `SELECT intent, COUNT(*) as count
         FROM messages
         WHERE intent IS NOT NULL
         AND conversation_id IN (
           SELECT conversation_id FROM conversations 
           WHERE company_id = ? AND start_time >= ?
         )
         GROUP BY intent
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(companyId, startDateStr)
      .all();

    const totalIntentCount = topIntentsData.results.reduce(
      (sum: number, item: any) => sum + item.count,
      0
    );

    const topIntents = topIntentsData.results.map((item: any) => ({
      intent: item.intent,
      count: item.count,
      percentage: totalIntentCount > 0 ? (item.count / totalIntentCount) * 100 : 0,
    }));

    // 按状态分组的会话
    const conversationsByStatusData = await this.db.db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM conversations
         WHERE company_id = ? AND start_time >= ?
         GROUP BY status`
      )
      .bind(companyId, startDateStr)
      .all();

    const conversationsByStatus = conversationsByStatusData.results.map((item: any) => ({
      status: item.status,
      count: item.count,
    }));

    // FAQ 命中率
    const faqQueriesData = await this.db.db
      .prepare(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN matched_faq IS NOT NULL THEN 1 ELSE 0 END) as matched
         FROM faq_queries
         WHERE company_id = ? AND timestamp >= ?`
      )
      .bind(companyId, startDateStr)
      .first();

    const faqHitRate =
      faqQueriesData && faqQueriesData.total > 0
        ? (faqQueriesData.matched / faqQueriesData.total) * 100
        : 0;

    // 按小时分组的消息（最近24小时）
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const messagesByHourData = await this.db.db
      .prepare(
        `SELECT 
           CAST(strftime('%H', timestamp) AS INTEGER) as hour,
           COUNT(*) as count
         FROM messages
         WHERE conversation_id IN (
           SELECT conversation_id FROM conversations WHERE company_id = ?
         )
         AND timestamp >= ?
         GROUP BY hour
         ORDER BY hour`
      )
      .bind(companyId, last24Hours.toISOString())
      .all();

    const messagesByHour = messagesByHourData.results.map((item: any) => ({
      hour: item.hour,
      count: item.count,
    }));

    return {
      totalConversations: (totalConversations?.count as number) || 0,
      totalMessages: (totalMessages?.count as number) || 0,
      totalUsers: (totalUsers?.count as number) || 0,
      avgMessagesPerConversation:
        totalConversations?.count > 0
          ? totalMessages?.count / totalConversations?.count
          : 0,
      avgResponseTime: (avgResponseTime?.avg as number) || 0,
      topIntents,
      conversationsByStatus,
      messagesByHour,
      faqHitRate,
    };
  }

  /**
   * 获取趋势数据
   */
  async getTrendData(companyId: string, days: number = 30): Promise<TrendData[]> {
    const results = await this.db.db
      .prepare(
        `SELECT 
           DATE(start_time) as date,
           COUNT(DISTINCT conversation_id) as conversations,
           (SELECT COUNT(*) FROM messages m 
            WHERE m.conversation_id IN (
              SELECT conversation_id FROM conversations c2 
              WHERE c2.company_id = ? AND DATE(c2.start_time) = DATE(c.start_time)
            )) as messages,
           (SELECT AVG(response_time) FROM messages m 
            WHERE m.conversation_id IN (
              SELECT conversation_id FROM conversations c2 
              WHERE c2.company_id = ? AND DATE(c2.start_time) = DATE(c.start_time)
            ) AND m.role = 'assistant' AND m.response_time IS NOT NULL) as avgResponseTime
         FROM conversations c
         WHERE company_id = ?
         AND start_time >= date('now', '-' || ? || ' days')
         GROUP BY DATE(start_time)
         ORDER BY date ASC`
      )
      .bind(companyId, companyId, companyId, days)
      .all();

    return results.results.map((row: any) => ({
      date: row.date,
      conversations: row.conversations,
      messages: row.messages,
      avgResponseTime: row.avgResponseTime || 0,
    }));
  }

  /**
   * 获取用户行为分析
   */
  async getUserBehavior(companyId: string, userId: string): Promise<any> {
    // 用户会话统计
    const userStats = await this.db.db
      .prepare(
        `SELECT 
           COUNT(*) as total_conversations,
           SUM(message_count) as total_messages,
           AVG(message_count) as avg_messages_per_conversation,
           MIN(start_time) as first_interaction,
           MAX(start_time) as last_interaction
         FROM conversations
         WHERE company_id = ? AND user_id = ?`
      )
      .bind(companyId, userId)
      .first();

    // 用户常用意图
    const topIntents = await this.db.db
      .prepare(
        `SELECT intent, COUNT(*) as count
         FROM messages
         WHERE conversation_id IN (
           SELECT conversation_id FROM conversations 
           WHERE company_id = ? AND user_id = ?
         )
         AND intent IS NOT NULL
         GROUP BY intent
         ORDER BY count DESC
         LIMIT 5`
      )
      .bind(companyId, userId)
      .all();

    return {
      userStats,
      topIntents: topIntents.results,
    };
  }

  /**
   * 生成 CSV 报告
   */
  async generateCSVReport(companyId: string, days: number = 30): Promise<string> {
    const stats = await this.getCompanyStats(companyId, days);
    const trends = await this.getTrendData(companyId, days);

    let csv = 'Category,Metric,Value\n';

    // 总体统计
    csv += `Overall,Total Conversations,${stats.totalConversations}\n`;
    csv += `Overall,Total Messages,${stats.totalMessages}\n`;
    csv += `Overall,Total Users,${stats.totalUsers}\n`;
    csv += `Overall,Avg Messages per Conversation,${stats.avgMessagesPerConversation.toFixed(2)}\n`;
    csv += `Overall,Avg Response Time (ms),${stats.avgResponseTime.toFixed(2)}\n`;
    csv += `Overall,FAQ Hit Rate (%),${stats.faqHitRate.toFixed(2)}\n\n`;

    // 热门意图
    csv += 'Intent,Count,Percentage\n';
    stats.topIntents.forEach((intent) => {
      csv += `${intent.intent},${intent.count},${intent.percentage.toFixed(2)}%\n`;
    });
    csv += '\n';

    // 趋势数据
    csv += 'Date,Conversations,Messages,Avg Response Time\n';
    trends.forEach((trend) => {
      csv += `${trend.date},${trend.conversations},${trend.messages},${trend.avgResponseTime.toFixed(2)}\n`;
    });

    return csv;
  }
}

export default AnalyticsService;
