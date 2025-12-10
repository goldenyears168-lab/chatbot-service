/**
 * MVP 驗證測試
 * 驗證關鍵修正點和功能正確性
 */

// 注意：這是一個驗證腳本，用於手動驗證關鍵功能
// 在實際環境中運行以確保 Pipeline MVP 正常工作

import { Pipeline, PipelineContext } from '../lib/pipeline.js';
import { node_validateRequest, node_initializeServices, handlePipelineError } from '../nodes/index.js';

/**
 * 驗證關鍵修正點 1: setKnowledgeBase 調用時機
 */
export function verifySetKnowledgeBaseTiming(): boolean {
  console.log('🔍 驗證關鍵修正點 1: setKnowledgeBase 調用時機');
  
  // 檢查代碼中 setKnowledgeBase 是否在知識庫載入後立即調用
  // 這需要檢查 nodes/02-initialize-services.ts 的執行順序
  
  const fs = require('fs');
  const path = require('path');
  
  const nodeFile = path.join(__dirname, '../nodes/02-initialize-services.ts');
  const content = fs.readFileSync(nodeFile, 'utf-8');
  
  // 檢查順序：loadKnowledgeBase → setKnowledgeBase
  const loadIndex = content.indexOf('loadKnowledgeBase');
  const setIndex = content.indexOf('setKnowledgeBase');
  
  if (loadIndex === -1 || setIndex === -1) {
    console.error('❌ 未找到關鍵函數調用');
    return false;
  }
  
  if (setIndex < loadIndex) {
    console.error('❌ setKnowledgeBase 在 loadKnowledgeBase 之前調用');
    return false;
  }
  
  // 檢查是否在 try-catch 後立即調用
  const loadEndIndex = content.indexOf('loaded successfully');
  if (setIndex - loadEndIndex > 100) {
    console.warn('⚠️ setKnowledgeBase 調用距離知識庫載入完成較遠，可能不是立即調用');
    return false;
  }
  
  console.log('✅ setKnowledgeBase 在知識庫載入後立即調用');
  return true;
}

/**
 * 驗證關鍵修正點 4: 錯誤重新拋出
 */
export function verifyErrorRethrow(): boolean {
  console.log('🔍 驗證關鍵修正點 4: 錯誤重新拋出機制');
  
  const fs = require('fs');
  const path = require('path');
  
  const nodeFile = path.join(__dirname, '../nodes/02-initialize-services.ts');
  const content = fs.readFileSync(nodeFile, 'utf-8');
  
  // 檢查知識庫錯誤是否重新拋出
  const catchBlock = content.match(/catch\s*\([^)]+\)\s*\{[\s\S]*?\n\s*throw\s+error;/);
  
  if (!catchBlock) {
    console.error('❌ 未找到錯誤重新拋出邏輯');
    return false;
  }
  
  // 檢查是否有日誌記錄
  if (!content.includes('Failed to load knowledge base')) {
    console.warn('⚠️ 缺少錯誤日誌記錄');
  }
  
  console.log('✅ 錯誤重新拋出機制正確實施');
  return true;
}

/**
 * 驗證關鍵修正點 5: 錯誤處理格式
 */
export function verifyErrorHandling(): boolean {
  console.log('🔍 驗證關鍵修正點 5: 錯誤處理格式');
  
  const fs = require('fs');
  const path = require('path');
  
  const errorHandlerFile = path.join(__dirname, '../nodes/99-error-handler.ts');
  const content = fs.readFileSync(errorHandlerFile, 'utf-8');
  
  // 檢查是否包含所有必要的錯誤日誌
  const requiredLogs = [
    'ERROR START',
    'ERROR END',
    'Error type:',
    'Error message:',
    'Error stack preview:',
    'Knowledge base loading failed',
    'LLM service initialization failed',
  ];
  
  const missingLogs = requiredLogs.filter(log => !content.includes(log));
  
  if (missingLogs.length > 0) {
    console.error('❌ 缺少必要的錯誤日誌:', missingLogs);
    return false;
  }
  
  // 檢查錯誤響應格式
  if (!content.includes('status: 500')) {
    console.error('❌ 錯誤響應狀態碼不正確');
    return false;
  }
  
  if (!content.includes('handoff_to_human')) {
    console.error('❌ 錯誤響應 intent 不正確');
    return false;
  }
  
  console.log('✅ 錯誤處理格式正確');
  return true;
}

/**
 * 驗證 Pipeline 框架功能
 */
export async function verifyPipelineFramework(): Promise<boolean> {
  console.log('🔍 驗證 Pipeline 框架功能');
  
  try {
    const pipeline = new Pipeline();
    
    // 測試節點註冊
    let nodeExecuted = false;
    const testNode = async (ctx: PipelineContext) => {
      nodeExecuted = true;
      return ctx;
    };
    
    pipeline.addNode('test', testNode);
    
    const ctx: PipelineContext = {
      request: new Request('http://localhost/test'),
      env: {},
      corsHeaders: {},
      startTime: Date.now(),
      logs: [],
    };
    
    try {
      await pipeline.execute(ctx);
      console.error('❌ Pipeline 應該在節點未返回 Response 時拋出錯誤');
      return false;
    } catch (error) {
      if (error instanceof Error && error.message.includes('without returning a response')) {
        // 這是預期的錯誤
        if (!nodeExecuted) {
          console.error('❌ 節點未執行');
          return false;
        }
        console.log('✅ Pipeline 框架基本功能正常');
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Pipeline 框架測試失敗:', error);
    return false;
  }
}

/**
 * 驗證節點 1: 請求驗證
 */
export async function verifyRequestValidation(): Promise<boolean> {
  console.log('🔍 驗證節點 1: 請求驗證');
  
  try {
    // 測試 OPTIONS 請求
    const optionsRequest = new Request('http://localhost/test', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
      },
    });
    
    const ctx: PipelineContext = {
      request: optionsRequest,
      env: {},
      corsHeaders: {},
      startTime: Date.now(),
      logs: [],
    };
    
    const result = await node_validateRequest(ctx);
    
    if (!(result instanceof Response)) {
      console.error('❌ OPTIONS 請求應該返回 Response');
      return false;
    }
    
    if (result.status !== 204) {
      console.error(`❌ OPTIONS 請求狀態碼錯誤: ${result.status}, 預期: 204`);
      return false;
    }
    
    console.log('✅ 請求驗證節點基本功能正常');
    return true;
  } catch (error) {
    console.error('❌ 請求驗證節點測試失敗:', error);
    return false;
  }
}

/**
 * 主驗證函數
 */
export async function runMVPVerification(): Promise<boolean> {
  console.log('🚀 開始 MVP 驗證測試\n');
  
  const results: Array<{ name: string; passed: boolean }> = [];
  
  // 1. 驗證關鍵修正點 1
  results.push({
    name: '關鍵修正點 1: setKnowledgeBase 調用時機',
    passed: verifySetKnowledgeBaseTiming(),
  });
  
  // 2. 驗證關鍵修正點 4
  results.push({
    name: '關鍵修正點 4: 錯誤重新拋出',
    passed: verifyErrorRethrow(),
  });
  
  // 3. 驗證關鍵修正點 5
  results.push({
    name: '關鍵修正點 5: 錯誤處理格式',
    passed: verifyErrorHandling(),
  });
  
  // 4. 驗證 Pipeline 框架
  results.push({
    name: 'Pipeline 框架功能',
    passed: await verifyPipelineFramework(),
  });
  
  // 5. 驗證請求驗證節點
  results.push({
    name: '請求驗證節點',
    passed: await verifyRequestValidation(),
  });
  
  // 輸出結果
  console.log('\n📊 驗證結果:');
  console.log('='.repeat(60));
  
  let allPassed = true;
  results.forEach(({ name, passed }) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (!passed) allPassed = false;
  });
  
  console.log('='.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ 所有驗證測試通過！');
    console.log('✅ MVP 階段 0 驗證成功，可以繼續階段 1');
    return true;
  } else {
    console.log('\n❌ 部分驗證測試失敗，請修復問題後重新驗證');
    return false;
  }
}

// 如果直接運行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runMVPVerification().then(passed => {
    process.exit(passed ? 0 : 1);
  });
}

