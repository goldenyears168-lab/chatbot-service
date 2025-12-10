/**
 * Database Schema Definitions
 * 
 * 定义 chatbot-service 的数据模型
 * 
 * @version 1.0.0
 */

/**
 * 会话记录
 */
export interface ConversationRecord {
  id: string;
  companyId: string;
  conversationId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  status: 'active' | 'completed' | 'abandoned';
  metadata?: Record<string, any>;
}

/**
 * 消息记录
 */
export interface MessageRecord {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  entities?: Record<string, any>;
  responseTime?: number;
  metadata?: Record<string, any>;
}

/**
 * 用户记录
 */
export interface UserRecord {
  id: string;
  companyId: string;
  userId: string;
  firstSeen: Date;
  lastSeen: Date;
  conversationCount: number;
  messageCount: number;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * 性能指标记录
 */
export interface PerformanceMetric {
  id: string;
  companyId: string;
  workflowId: string;
  timestamp: Date;
  executionTime: number;
  nodeMetrics: {
    nodeId: string;
    executionTime: number;
    status: 'success' | 'error';
    errorMessage?: string;
  }[];
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * 工作流执行记录
 */
export interface WorkflowExecution {
  id: string;
  sessionId: string;
  workflowId: string;
  companyId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  nodesExecuted: number;
  nodesFailed: number;
  totalExecutionTime?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * FAQ 查询记录
 */
export interface FAQQueryRecord {
  id: string;
  companyId: string;
  conversationId: string;
  question: string;
  matchedFAQ?: string;
  confidence?: number;
  timestamp: Date;
  source: 'menu' | 'chat';
}

/**
 * 意图统计
 */
export interface IntentStatistic {
  id: string;
  companyId: string;
  intent: string;
  count: number;
  successRate: number;
  avgResponseTime: number;
  lastUpdated: Date;
}

/**
 * 数据库表定义
 */
export const DATABASE_SCHEMA = {
  conversations: `
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      user_id TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      message_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      metadata TEXT,
      UNIQUE(company_id, conversation_id)
    )
  `,
  
  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      intent TEXT,
      entities TEXT,
      response_time INTEGER,
      metadata TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    )
  `,
  
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      first_seen DATETIME NOT NULL,
      last_seen DATETIME NOT NULL,
      conversation_count INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      preferences TEXT,
      metadata TEXT,
      UNIQUE(company_id, user_id)
    )
  `,
  
  performance_metrics: `
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      execution_time INTEGER NOT NULL,
      node_metrics TEXT NOT NULL,
      memory_usage INTEGER,
      cpu_usage REAL
    )
  `,
  
  workflow_executions: `
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      status TEXT NOT NULL,
      nodes_executed INTEGER DEFAULT 0,
      nodes_failed INTEGER DEFAULT 0,
      total_execution_time INTEGER,
      error_message TEXT,
      metadata TEXT
    )
  `,
  
  faq_queries: `
    CREATE TABLE IF NOT EXISTS faq_queries (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      question TEXT NOT NULL,
      matched_faq TEXT,
      confidence REAL,
      timestamp DATETIME NOT NULL,
      source TEXT NOT NULL
    )
  `,
  
  intent_statistics: `
    CREATE TABLE IF NOT EXISTS intent_statistics (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      intent TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 0,
      avg_response_time INTEGER DEFAULT 0,
      last_updated DATETIME NOT NULL,
      UNIQUE(company_id, intent)
    )
  `,
  
  // 索引
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_conversations_company ON conversations(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)',
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_performance_company ON performance_metrics(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_workflow_exec_company ON workflow_executions(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_workflow_exec_status ON workflow_executions(status)',
    'CREATE INDEX IF NOT EXISTS idx_faq_company ON faq_queries(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_intent_stats_company ON intent_statistics(company_id)',
  ],
};

export default DATABASE_SCHEMA;
