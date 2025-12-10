/**
 * Performance Optimizer - 性能优化器
 * 
 * 提供性能优化和监控功能
 * 
 * @version 3.0.0
 */

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage?: number;
  nodeMetrics: Map<string, NodePerformanceMetrics>;
}

/**
 * 节点性能指标
 */
export interface NodePerformanceMetrics {
  nodeId: string;
  nodeName: string;
  executionCount: number;
  totalExecutionTime: number;
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  errorCount: number;
  errorRate: number;
}

/**
 * 优化建议
 */
export interface OptimizationSuggestion {
  type: 'warning' | 'error' | 'info';
  category: 'performance' | 'memory' | 'reliability';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
  code?: string;
}

/**
 * 性能优化器类
 */
export class PerformanceOptimizer {
  private metrics: Map<string, PerformanceMetrics>;
  private performanceThresholds: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    maxNodeExecutionTime: number;
  };

  constructor() {
    this.metrics = new Map();
    this.performanceThresholds = {
      maxExecutionTime: 5000, // 5 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxNodeExecutionTime: 1000, // 1 second
    };
  }

  /**
   * 记录执行指标
   */
  recordMetrics(workflowId: string, metrics: PerformanceMetrics): void {
    this.metrics.set(workflowId, metrics);
  }

  /**
   * 分析性能
   */
  analyzePerformance(workflowId: string): OptimizationSuggestion[] {
    const metrics = this.metrics.get(workflowId);
    if (!metrics) {
      return [];
    }

    const suggestions: OptimizationSuggestion[] = [];

    // 1. 检查总执行时间
    if (metrics.executionTime > this.performanceThresholds.maxExecutionTime) {
      suggestions.push({
        type: 'warning',
        category: 'performance',
        title: '工作流执行时间过长',
        description: `工作流执行时间为 ${metrics.executionTime}ms，超过阈值 ${this.performanceThresholds.maxExecutionTime}ms`,
        impact: 'high',
        suggestion: '考虑优化慢节点或使用并行执行',
      });
    }

    // 2. 检查内存使用
    if (metrics.memoryUsage > this.performanceThresholds.maxMemoryUsage) {
      suggestions.push({
        type: 'error',
        category: 'memory',
        title: '内存使用过高',
        description: `内存使用 ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB，超过阈值`,
        impact: 'high',
        suggestion: '检查数据传递，避免大对象在节点间传递',
      });
    }

    // 3. 分析每个节点
    for (const [nodeId, nodeMetrics] of metrics.nodeMetrics.entries()) {
      // 3.1 慢节点
      if (nodeMetrics.avgExecutionTime > this.performanceThresholds.maxNodeExecutionTime) {
        suggestions.push({
          type: 'warning',
          category: 'performance',
          title: `节点 ${nodeMetrics.nodeName} 执行缓慢`,
          description: `平均执行时间 ${nodeMetrics.avgExecutionTime}ms`,
          impact: 'medium',
          suggestion: '优化节点逻辑或增加超时设置',
          code: `// 考虑添加缓存\nconst cached = cache.get(key);\nif (cached) return cached;`,
        });
      }

      // 3.2 高错误率
      if (nodeMetrics.errorRate > 0.1) { // 10% error rate
        suggestions.push({
          type: 'error',
          category: 'reliability',
          title: `节点 ${nodeMetrics.nodeName} 错误率高`,
          description: `错误率 ${(nodeMetrics.errorRate * 100).toFixed(1)}%`,
          impact: 'high',
          suggestion: '添加重试机制或改进错误处理',
          code: `// 使用 NodeExecutor 的重试功能\nconst executor = new NodeExecutor({\n  retryOptions: {\n    maxRetries: 3,\n    retryDelay: 1000,\n  }\n});`,
        });
      }

      // 3.3 执行时间波动大
      const timeVariance = nodeMetrics.maxExecutionTime - nodeMetrics.minExecutionTime;
      if (timeVariance > nodeMetrics.avgExecutionTime * 2) {
        suggestions.push({
          type: 'info',
          category: 'performance',
          title: `节点 ${nodeMetrics.nodeName} 执行时间不稳定`,
          description: `执行时间波动范围: ${nodeMetrics.minExecutionTime}ms - ${nodeMetrics.maxExecutionTime}ms`,
          impact: 'low',
          suggestion: '检查是否有外部依赖影响性能',
        });
      }
    }

    return suggestions;
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(workflowId: string): string {
    const metrics = this.metrics.get(workflowId);
    if (!metrics) {
      return 'No metrics available';
    }

    const suggestions = this.analyzePerformance(workflowId);

    let report = `# 性能报告 - ${workflowId}\n\n`;
    report += `## 总体指标\n\n`;
    report += `- 执行时间: ${metrics.executionTime}ms\n`;
    report += `- 内存使用: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
    report += `\n## 节点性能\n\n`;

    for (const [nodeId, nodeMetrics] of metrics.nodeMetrics.entries()) {
      report += `### ${nodeMetrics.nodeName}\n\n`;
      report += `- 执行次数: ${nodeMetrics.executionCount}\n`;
      report += `- 平均执行时间: ${nodeMetrics.avgExecutionTime.toFixed(2)}ms\n`;
      report += `- 最小/最大时间: ${nodeMetrics.minExecutionTime}ms / ${nodeMetrics.maxExecutionTime}ms\n`;
      report += `- 错误率: ${(nodeMetrics.errorRate * 100).toFixed(1)}%\n\n`;
    }

    if (suggestions.length > 0) {
      report += `## 优化建议\n\n`;
      for (const suggestion of suggestions) {
        const icon = suggestion.type === 'error' ? '❌' : suggestion.type === 'warning' ? '⚠️' : 'ℹ️';
        report += `${icon} **${suggestion.title}**\n`;
        report += `- ${suggestion.description}\n`;
        report += `- 建议: ${suggestion.suggestion}\n`;
        if (suggestion.code) {
          report += `\`\`\`typescript\n${suggestion.code}\n\`\`\`\n`;
        }
        report += `\n`;
      }
    }

    return report;
  }

  /**
   * 优化建议：缓存策略
   */
  static suggestCaching(): string {
    return `
// 实现简单的内存缓存
class NodeCache {
  private cache = new Map<string, any>();
  private ttl: number;

  constructor(ttlMs: number = 60000) {
    this.ttl = ttlMs;
  }

  get(key: string): any | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// 使用示例
const cache = new NodeCache(300000); // 5 minutes

async execute(input, context) {
  const cacheKey = JSON.stringify(input);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await this.processData(input);
  cache.set(cacheKey, result);
  
  return result;
}
`;
  }

  /**
   * 优化建议：批处理
   */
  static suggestBatching(): string {
    return `
// 批处理优化示例
class BatchProcessor {
  private queue: any[] = [];
  private batchSize: number;
  private timeout: number;
  private timer: any;

  constructor(batchSize: number = 10, timeoutMs: number = 1000) {
    this.batchSize = batchSize;
    this.timeout = timeoutMs;
  }

  async add(item: any): Promise<any> {
    return new Promise((resolve) => {
      this.queue.push({ item, resolve });
      
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.processBatch(), this.timeout);
      }
    });
  }

  private async processBatch(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.batchSize);
    if (batch.length === 0) return;

    // 批量处理
    const results = await this.processBatchItems(
      batch.map(b => b.item)
    );

    // 返回结果
    batch.forEach((b, i) => b.resolve(results[i]));
  }

  private async processBatchItems(items: any[]): Promise<any[]> {
    // 实现批量处理逻辑
    return items.map(item => this.processItem(item));
  }
}
`;
  }

  /**
   * 优化建议：并行执行
   */
  static suggestParallelExecution(): string {
    return `
// 并行执行独立节点
async function executeParallel(nodes: BaseNode[], input: any, context: ExecutionContext) {
  // 识别可以并行执行的节点
  const independentNodes = nodes.filter(node => !hasDependencies(node));
  
  // 并行执行
  const results = await Promise.all(
    independentNodes.map(node => node.execute(input, context))
  );
  
  return results;
}

// 使用 Promise.allSettled 处理部分失败
async function executeWithFailureHandling(nodes: BaseNode[], input: any, context: ExecutionContext) {
  const results = await Promise.allSettled(
    nodes.map(node => node.execute(input, context))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  if (failed.length > 0) {
    console.warn(\`\${failed.length} nodes failed\`);
  }
  
  return succeeded.map(r => r.value);
}
`;
  }

  /**
   * 优化建议：内存优化
   */
  static suggestMemoryOptimization(): string {
    return `
// 内存优化建议

// 1. 避免大对象在节点间传递
async execute(input, context) {
  // ❌ 不好：传递大对象
  const largeData = await fetchLargeDataset();
  return { largeData, ...otherData };
  
  // ✅ 好：只传递引用或摘要
  const dataId = await storeLargeDataset(largeData);
  return { dataId, ...otherData };
}

// 2. 及时清理不需要的数据
async execute(input, context) {
  const result = await processData(input);
  
  // 清理不需要的数据
  context.removeData('temporaryData');
  
  return result;
}

// 3. 使用流式处理大数据
async processLargeFile(filePath: string) {
  const stream = fs.createReadStream(filePath);
  
  for await (const chunk of stream) {
    await processChunk(chunk);
    // 每个 chunk 处理完后自动释放内存
  }
}
`;
  }
}

export default PerformanceOptimizer;
