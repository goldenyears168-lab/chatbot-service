// types/database.ts
// 数据库类型定义

export interface ConversationRecord {
  id: string
  company_id: string
  conversation_id: string
  user_id?: string
  start_time: Date | string
  end_time?: Date | string
  message_count: number
  status: 'active' | 'completed' | 'abandoned'
  metadata?: Record<string, any>
  created_at?: Date | string
  updated_at?: Date | string
}

export interface MessageRecord {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date | string
  intent?: string
  entities?: Record<string, any>
  response_time?: number
  embedding?: number[] // vector(768)
  metadata?: Record<string, any>
  created_at?: Date | string
}

export interface UserRecord {
  id: string
  company_id: string
  user_id: string
  first_seen: Date | string
  last_seen: Date | string
  conversation_count: number
  message_count: number
  preferences?: Record<string, any>
  metadata?: Record<string, any>
  created_at?: Date | string
  updated_at?: Date | string
}

export interface PerformanceMetric {
  id: string
  company_id: string
  workflow_id: string
  timestamp: Date | string
  execution_time: number
  node_metrics: Record<string, any>
  memory_usage?: number
  cpu_usage?: number
  created_at?: Date | string
}

export interface WorkflowExecution {
  id: string
  session_id: string
  workflow_id: string
  company_id: string
  start_time: Date | string
  end_time?: Date | string
  status: 'running' | 'completed' | 'failed'
  nodes_executed: number
  nodes_failed: number
  total_execution_time?: number
  error_message?: string
  metadata?: Record<string, any>
  created_at?: Date | string
}

export interface FAQQueryRecord {
  id: string
  company_id: string
  query_text: string
  matched_faq_id?: string
  confidence?: number
  timestamp: Date | string
  created_at?: Date | string
}

export interface IntentStatistic {
  id: string
  company_id: string
  intent_name: string
  count: number
  success_count: number
  avg_response_time: number
  last_updated: Date | string
  created_at?: Date | string
}

