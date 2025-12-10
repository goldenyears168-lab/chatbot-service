/**
 * Pipeline 版本的 onRequestPost
 * 使用 Pipeline 模式重構的主流程
 * 
 * Pipeline 執行流程：
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │               AI 客服機器人 Pipeline                     │
 * └─────────────────────────────────────────────────────────┘
 * 
 * [Request] → [1] → [2] → [3] → [4] → [5] → [6] → [7] → [8] → [9] → [Response]
 *             │     │     │     │     │     │     │     │     │
 *            驗證   初始化 上下文 意圖  狀態  特殊   FAQ   LLM   構建
 * 
 * 提前退出點：
 *   • 節點 6 (specialIntents): 特殊意圖匹配時提前返回
 *   • 節點 7 (faqCheck): FAQ 匹配時提前返回
 * 
 * 錯誤處理：
 *   任何節點錯誤 → [99. error-handler] → 統一錯誤響應
 * 
 * 視覺化優勢：
 *   • 清晰的執行流程追蹤
 *   • 結構化日誌輸出
 *   • 性能瓶頸識別
 *   • 易於調試和維護
 */

import { Pipeline, PipelineContext } from './lib/pipeline.js';
import {
  node_validateRequest,
  node_initializeServices,
  node_contextManagement,
  node_intentExtraction,
  node_stateTransition,
  node_specialIntents,
  node_faqCheck,
  node_llmGeneration,
  node_buildResponse,
  handlePipelineError,
} from './nodes/index.js';

/**
 * Pipeline 版本的 onRequestPost
 */
export async function onRequestPostPipeline(context: {
  request: Request;
  env: any;
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  const startTime = Date.now();

  // 創建 Pipeline
  const pipeline = new Pipeline({
    enableDetailedLogging: true,
    logLevel: 'INFO',
  });

  // 註冊所有節點（按順序）
  pipeline.addNode('validateRequest', node_validateRequest);
  pipeline.addNode('initializeServices', node_initializeServices);
  pipeline.addNode('contextManagement', node_contextManagement);
  pipeline.addNode('intentExtraction', node_intentExtraction);
  pipeline.addNode('stateTransition', node_stateTransition);
  pipeline.addNode('specialIntents', node_specialIntents);
  pipeline.addNode('faqCheck', node_faqCheck);
  pipeline.addNode('llmGeneration', node_llmGeneration);
  pipeline.addNode('buildResponse', node_buildResponse);

  // 初始化 PipelineContext
  const pipelineContext: PipelineContext = {
    request: context.request,
    env: context.env,
    corsHeaders: {},
    startTime,
    logs: [],
  };

  try {
    // 執行 Pipeline
    return await pipeline.execute(pipelineContext);
  } catch (error) {
    // 使用統一的錯誤處理
    return handlePipelineError(error, pipelineContext);
  }
}

