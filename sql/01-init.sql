-- Supabase 数据库初始化脚本
-- 包含所有表结构和索引

-- 启用 pgvector 扩展（用于向量嵌入）
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 会话表 (conversations)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- 2. 消息表 (messages) - 包含向量嵌入
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  intent TEXT,
  entities JSONB,
  response_time INTEGER,
  embedding vector(768),  -- 为 RAG 预留的向量嵌入
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
-- 向量相似度搜索索引（使用 HNSW 算法）
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages USING hnsw (embedding vector_cosine_ops);

-- 3. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  conversation_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  preferences JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- 4. 性能指标表 (performance_metrics)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_time INTEGER NOT NULL,
  node_metrics JSONB NOT NULL,
  memory_usage INTEGER,
  cpu_usage REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_company_id ON performance_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_workflow_id ON performance_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- 5. 工作流执行表 (workflow_executions)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  nodes_executed INTEGER DEFAULT 0,
  nodes_failed INTEGER DEFAULT 0,
  total_execution_time INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_session_id ON workflow_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_company_id ON workflow_executions(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);

-- 6. FAQ 查询表 (faq_queries)
CREATE TABLE IF NOT EXISTS faq_queries (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  matched_faq_id TEXT,
  confidence REAL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_queries_company_id ON faq_queries(company_id);
CREATE INDEX IF NOT EXISTS idx_faq_queries_timestamp ON faq_queries(timestamp);
CREATE INDEX IF NOT EXISTS idx_faq_queries_confidence ON faq_queries(confidence);

-- 7. 意图统计表 (intent_statistics)
CREATE TABLE IF NOT EXISTS intent_statistics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  intent_name TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  avg_response_time REAL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, intent_name)
);

CREATE INDEX IF NOT EXISTS idx_intent_statistics_company_id ON intent_statistics(company_id);
CREATE INDEX IF NOT EXISTS idx_intent_statistics_intent_name ON intent_statistics(intent_name);

-- 8. 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要 updated_at 的表创建触发器
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建辅助函数：增加消息计数
CREATE OR REPLACE FUNCTION increment_message_count(conv_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE conversation_id = conv_id;
END;
$$ LANGUAGE plpgsql;

