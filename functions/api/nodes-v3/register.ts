/**
 * Pipeline v3 - 节点注册
 * 
 * 注册所有可用的节点类型
 * 
 * @version 3.0.0
 */

import { NodeRegistry } from '../pipeline-v3/base/Node.js';

// 导入所有节点
import ExampleNode from './core/ExampleNode/index.js';
import ValidateNode from './core/ValidateNode/index.js';
import InitializeNode from './core/InitializeNode/index.js';
import ContextNode from './core/ContextNode/index.js';
import IntentNode from './core/IntentNode/index.js';
import StateTransitionNode from './core/StateTransitionNode/index.js';
import SpecialIntentNode from './core/SpecialIntentNode/index.js';
import FAQNode from './core/FAQNode/index.js';
import LLMNode from './core/LLMNode/index.js';
import ResponseNode from './core/ResponseNode/index.js';

/**
 * 注册所有核心节点
 */
export function registerCoreNodes(): void {
  console.log('[NodeRegistry] Registering core nodes...');

  // 注册示例节点
  NodeRegistry.register(ExampleNode);

  // 注册核心业务节点
  NodeRegistry.register(ValidateNode);
  NodeRegistry.register(InitializeNode);
  NodeRegistry.register(ContextNode);
  NodeRegistry.register(IntentNode);
  NodeRegistry.register(StateTransitionNode);
  NodeRegistry.register(SpecialIntentNode);
  NodeRegistry.register(FAQNode);
  NodeRegistry.register(LLMNode);
  NodeRegistry.register(ResponseNode);

  console.log('[NodeRegistry] All core nodes registered successfully');
  console.log('[NodeRegistry] Available nodes:', NodeRegistry.list());
}

/**
 * 获取所有已注册的节点列表
 */
export function getRegisteredNodes(): string[] {
  return NodeRegistry.list();
}

/**
 * 自动注册（模块加载时）
 */
registerCoreNodes();
