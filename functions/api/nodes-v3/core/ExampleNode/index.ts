/**
 * Example Node - 示例节点
 * 
 * 用于演示和测试 Pipeline v3 的基本功能
 * 
 * @version 1.0.0
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import metadata from './metadata.json';

/**
 * 示例节点类
 * 
 * @example
 * ```typescript
 * const node = new ExampleNode({
 *   toUpperCase: true,
 *   addTimestamp: true,
 *   prefix: 'Processed: '
 * });
 * 
 * const result = await node.execute({
 *   message: 'hello world'
 * }, context);
 * 
 * console.log(result.output);
 * // { message: 'Processed: HELLO WORLD', timestamp: 1234567890 }
 * ```
 */
export class ExampleNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      // 1. 验证输入
      this.validateInput(input);

      // 2. 提取输入数据
      let { message, options = {} } = input;

      // 3. 应用配置
      if (this.config.toUpperCase) {
        message = message.toUpperCase();
      }

      if (this.config.prefix) {
        message = this.config.prefix + message;
      }

      // 4. 构建输出
      const output: any = {
        message,
        processed: true,
      };

      if (this.config.addTimestamp) {
        output.timestamp = Date.now();
      }

      // 5. 可选：合并用户选项
      if (options && Object.keys(options).length > 0) {
        output.options = options;
      }

      // 6. 记录到上下文（演示数据共享）
      context.setData('lastProcessedMessage', message);
      context.setData('processCount', (context.getData('processCount', 0) as number) + 1);

      this.log(`Processed message: ${message}`);

      // 7. 返回成功结果
      return this.createSuccessResult(
        output,
        'success',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`Error processing message: ${error}`, 'error');

      // 返回错误结果
      return this.createErrorResult(
        error instanceof Error ? error : new Error(String(error)),
        Date.now() - startTime
      );
    }
  }
}

/**
 * 导出节点类（用于注册）
 */
export default ExampleNode;
