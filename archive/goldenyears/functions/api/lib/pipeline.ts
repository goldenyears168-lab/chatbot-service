/**
 * Pipeline 核心框架
 * 支持節點式執行、提前退出、錯誤重新拋出
 */

import { ConversationContext } from './contextManager.js';

/**
 * Pipeline 上下文 - 統一的數據流（類似 n8n 的 JSON payload）
 */
export interface PipelineContext {
  // 輸入數據
  request: Request;
  env: any;
  body?: any; // ChatRequestBody，在驗證節點後填充
  
  // 中間處理數據
  corsHeaders: Record<string, string>;
  knowledgeBase?: any; // KnowledgeBase
  llmService?: any; // LLMService
  contextManager?: any; // ContextManager
  conversationContext?: ConversationContext;
  
  // 處理結果
  intent?: string;
  entities?: Record<string, any>;
  mergedEntities?: Record<string, any>;
  nextState?: ConversationContext['state'];
  reply?: string;
  
  // 元數據
  startTime: number;
  logs: Array<{
    node: string;
    level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN';
    message: string;
    timestamp: number;
    duration?: number;
  }>;
}

/**
 * Pipeline 節點類型
 * 可以返回：
 * - PipelineContext: 繼續下一個節點
 * - Response: 提前結束流程
 */
export type PipelineNode = (ctx: PipelineContext) => Promise<PipelineContext | Response>;

/**
 * Pipeline 配置
 */
interface PipelineConfig {
  enableDetailedLogging?: boolean;
  logLevel?: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN';
}

/**
 * Pipeline 主類
 */
export class Pipeline {
  private nodes: Array<{ name: string; node: PipelineNode }> = [];
  private config: PipelineConfig;

  constructor(config: PipelineConfig = {}) {
    this.config = {
      enableDetailedLogging: true,
      logLevel: 'INFO',
      ...config,
    };
  }

  /**
   * 添加節點
   */
  addNode(name: string, node: PipelineNode): void {
    this.nodes.push({ name, node });
  }

  /**
   * 執行 Pipeline
   */
  async execute(context: PipelineContext): Promise<Response> {
    for (const { name, node } of this.nodes) {
      const startNodeTime = Date.now();
      
      try {
        // 節點前日誌
        this.log(context, name, 'INFO', `開始執行節點: ${name}`);
        
        // 執行節點
        const result = await node(context);
        
        // 如果是 Response，直接返回（提前結束流程）
        if (result instanceof Response) {
          const duration = Date.now() - startNodeTime;
          this.log(context, name, 'SUCCESS', `節點 ${name} 返回響應，流程結束`, duration);
          return result;
        }
        
        // 更新上下文，繼續下一個節點
        context = result;
        const duration = Date.now() - startNodeTime;
        this.log(context, name, 'SUCCESS', `節點 ${name} 執行完成`, duration);
        
      } catch (error) {
        // ⚠️ 關鍵：節點錯誤必須重新拋出，由外層統一處理
        const duration = Date.now() - startNodeTime;
        this.log(context, name, 'ERROR', `節點 ${name} 執行失敗: ${error instanceof Error ? error.message : String(error)}`, duration);
        throw error; // 不要捕獲，讓外層處理
      }
    }
    
    // 所有節點執行完畢（理論上不應該到這裡，應該在前面的節點返回 Response）
    throw new Error('Pipeline execution completed without returning a response');
  }

  /**
   * 記錄日誌
   */
  private log(
    ctx: PipelineContext,
    node: string,
    level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN',
    message: string,
    duration?: number
  ): void {
    const logEntry = {
      node,
      level,
      message,
      timestamp: Date.now(),
      duration,
    };
    
    ctx.logs.push(logEntry);
    
    // 同時輸出到 console（結構化日誌）
    if (this.shouldLog(level)) {
      const prefix = `[Pipeline:${node}]`;
      const durationStr = duration !== undefined ? ` (${duration}ms)` : '';
      const emoji = {
        INFO: 'ℹ️',
        SUCCESS: '✅',
        ERROR: '❌',
        WARN: '⚠️',
      }[level];
      
      console.log(`${emoji} ${prefix} [${level}] ${message}${durationStr}`);
    }
  }

  /**
   * 判斷是否應該記錄日誌
   */
  private shouldLog(level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN'): boolean {
    if (!this.config.enableDetailedLogging) {
      return level === 'ERROR' || level === 'WARN';
    }
    
    const levels = ['INFO', 'SUCCESS', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel || 'INFO');
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 獲取節點列表（用於調試）
   */
  getNodeNames(): string[] {
    return this.nodes.map(n => n.name);
  }

  /**
   * 清空所有節點（用於測試）
   */
  clear(): void {
    this.nodes = [];
  }
}

