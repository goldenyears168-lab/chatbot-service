/**
 * Pipeline v3 - 数据流管理器
 * 
 * 管理节点间的数据传递、转换和验证
 * 
 * @version 3.0.0
 * @author Pipeline Team
 */

/**
 * 数据转换器接口
 */
export interface DataTransformer {
  /** 转换器名称 */
  name: string;
  /** 转换函数 */
  transform: (data: any) => any;
  /** 验证函数（可选） */
  validate?: (data: any) => boolean;
}

/**
 * 数据流配置
 */
export interface DataFlowConfig {
  /** 是否启用类型检查 */
  strictTypeChecking?: boolean;
  /** 是否启用数据转换 */
  enableTransformers?: boolean;
  /** 最大数据大小（字节） */
  maxDataSize?: number;
  /** 是否记录数据流 */
  logDataFlow?: boolean;
}

/**
 * 数据流记录
 */
export interface DataFlowRecord {
  /** 源节点 ID */
  fromNode: string;
  /** 源节点输出名称 */
  fromOutput: string;
  /** 目标节点 ID */
  toNode: string;
  /** 目标节点输入名称 */
  toInput: string;
  /** 数据 */
  data: any;
  /** 时间戳 */
  timestamp: number;
  /** 数据大小（字节） */
  dataSize: number;
}

/**
 * 数据流管理器类
 * 
 * 负责管理节点间的数据传递
 * 
 * @example
 * ```typescript
 * const manager = new DataFlowManager({
 *   strictTypeChecking: true,
 *   enableTransformers: true,
 *   logDataFlow: true
 * });
 * 
 * // 注册转换器
 * manager.registerTransformer({
 *   name: 'toUpperCase',
 *   transform: (data) => data.toUpperCase()
 * });
 * 
 * // 传递数据
 * const result = manager.passData(
 *   'node-1', 'success',
 *   'node-2', 'input',
 *   { message: 'hello' }
 * );
 * ```
 */
export class DataFlowManager {
  /** 配置 */
  private config: Required<DataFlowConfig>;

  /** 注册的转换器 */
  private transformers: Map<string, DataTransformer>;

  /** 数据流记录 */
  private flowRecords: DataFlowRecord[];

  /** 最大记录数 */
  private maxRecords: number = 1000;

  /**
   * 构造函数
   * 
   * @param config 配置选项
   */
  constructor(config?: DataFlowConfig) {
    this.config = {
      strictTypeChecking: config?.strictTypeChecking ?? true,
      enableTransformers: config?.enableTransformers ?? true,
      maxDataSize: config?.maxDataSize ?? 10 * 1024 * 1024, // 10MB
      logDataFlow: config?.logDataFlow ?? false,
    };

    this.transformers = new Map();
    this.flowRecords = [];

    this.log('DataFlowManager initialized');
  }

  /**
   * 传递数据
   * 
   * 从一个节点传递数据到另一个节点
   * 
   * @param fromNode 源节点 ID
   * @param fromOutput 源节点输出名称
   * @param toNode 目标节点 ID
   * @param toInput 目标节点输入名称
   * @param data 数据
   * @returns 处理后的数据
   * @throws Error 如果数据无效或转换失败
   */
  passData(
    fromNode: string,
    fromOutput: string,
    toNode: string,
    toInput: string,
    data: any
  ): any {
    this.log(`Passing data: ${fromNode}.${fromOutput} -> ${toNode}.${toInput}`);

    // 1. 验证数据大小
    this.validateDataSize(data);

    // 2. 克隆数据（防止意外修改）
    let processedData = this.cloneData(data);

    // 3. 应用转换器（如果启用）
    if (this.config.enableTransformers) {
      processedData = this.applyTransformers(processedData, fromOutput, toInput);
    }

    // 4. 类型检查（如果启用）
    if (this.config.strictTypeChecking) {
      this.validateDataType(processedData, toInput);
    }

    // 5. 记录数据流
    if (this.config.logDataFlow) {
      this.recordDataFlow({
        fromNode,
        fromOutput,
        toNode,
        toInput,
        data: processedData,
        timestamp: Date.now(),
        dataSize: this.calculateDataSize(processedData),
      });
    }

    return processedData;
  }

  /**
   * 注册数据转换器
   * 
   * @param transformer 转换器
   */
  registerTransformer(transformer: DataTransformer): void {
    this.transformers.set(transformer.name, transformer);
    this.log(`Transformer registered: ${transformer.name}`);
  }

  /**
   * 应用转换器
   * 
   * @param data 数据
   * @param fromOutput 源输出名称
   * @param toInput 目标输入名称
   * @returns 转换后的数据
   */
  private applyTransformers(data: any, fromOutput: string, toInput: string): any {
    let result = data;

    // 这里可以根据 fromOutput 和 toInput 应用特定的转换器
    // 目前简单实现，返回原始数据
    for (const transformer of this.transformers.values()) {
      try {
        // 可以添加条件逻辑来决定何时应用转换器
        if (transformer.validate && transformer.validate(result)) {
          result = transformer.transform(result);
          this.log(`Transformer applied: ${transformer.name}`);
        }
      } catch (error) {
        console.error(`[DataFlowManager] Transformer error (${transformer.name}):`, error);
        // 继续执行，不中断流程
      }
    }

    return result;
  }

  /**
   * 验证数据大小
   * 
   * @param data 数据
   * @throws Error 如果数据过大
   */
  private validateDataSize(data: any): void {
    const size = this.calculateDataSize(data);

    if (size > this.config.maxDataSize) {
      throw new Error(
        `Data size exceeds limit: ${size} > ${this.config.maxDataSize} bytes`
      );
    }
  }

  /**
   * 计算数据大小
   * 
   * @param data 数据
   * @returns 数据大小（字节）
   */
  private calculateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      console.error('[DataFlowManager] Failed to calculate data size:', error);
      return 0;
    }
  }

  /**
   * 验证数据类型
   * 
   * 简单的类型检查，可以扩展为更严格的验证
   * 
   * @param data 数据
   * @param inputName 输入名称
   */
  private validateDataType(data: any, inputName: string): void {
    // 简单实现，检查数据是否为 null/undefined
    if (data === null || data === undefined) {
      console.warn(
        `[DataFlowManager] Warning: Data is null/undefined for input: ${inputName}`
      );
    }

    // 可以添加更多类型检查逻辑
    // 例如：检查是否符合特定的 schema
  }

  /**
   * 克隆数据
   * 
   * 深度克隆，防止意外修改原始数据
   * 
   * @param data 数据
   * @returns 克隆的数据
   */
  private cloneData(data: any): any {
    try {
      // 简单的 JSON 克隆
      // 注意：这会丢失函数、Symbol、循环引用等
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.warn('[DataFlowManager] Failed to clone data, using original:', error);
      return data;
    }
  }

  /**
   * 记录数据流
   * 
   * @param record 数据流记录
   */
  private recordDataFlow(record: DataFlowRecord): void {
    this.flowRecords.push(record);

    // 限制记录数量
    if (this.flowRecords.length > this.maxRecords) {
      this.flowRecords.shift();
    }
  }

  /**
   * 获取数据流记录
   * 
   * @param fromNode 源节点 ID（可选）
   * @param toNode 目标节点 ID（可选）
   * @returns 数据流记录列表
   */
  getFlowRecords(fromNode?: string, toNode?: string): DataFlowRecord[] {
    let records = this.flowRecords;

    if (fromNode) {
      records = records.filter(r => r.fromNode === fromNode);
    }

    if (toNode) {
      records = records.filter(r => r.toNode === toNode);
    }

    return records;
  }

  /**
   * 清空数据流记录
   */
  clearFlowRecords(): void {
    this.flowRecords = [];
    this.log('Flow records cleared');
  }

  /**
   * 获取数据流统计
   * 
   * @returns 统计信息
   */
  getStatistics(): {
    totalFlows: number;
    totalDataSize: number;
    averageDataSize: number;
    transformersCount: number;
  } {
    const totalDataSize = this.flowRecords.reduce(
      (sum, record) => sum + record.dataSize,
      0
    );

    return {
      totalFlows: this.flowRecords.length,
      totalDataSize,
      averageDataSize: this.flowRecords.length > 0
        ? totalDataSize / this.flowRecords.length
        : 0,
      transformersCount: this.transformers.size,
    };
  }

  /**
   * 生成数据流可视化
   * 
   * 生成 Mermaid 格式的数据流图
   * 
   * @returns Mermaid 代码
   */
  generateVisualization(): string {
    if (this.flowRecords.length === 0) {
      return 'graph LR\n  Start[No Data Flow]';
    }

    let diagram = 'graph LR\n';

    // 收集所有节点
    const nodes = new Set<string>();
    this.flowRecords.forEach(record => {
      nodes.add(record.fromNode);
      nodes.add(record.toNode);
    });

    // 统计每条连接的数据流次数
    const flowCounts = new Map<string, number>();
    this.flowRecords.forEach(record => {
      const key = `${record.fromNode}->${record.toNode}`;
      flowCounts.set(key, (flowCounts.get(key) || 0) + 1);
    });

    // 生成连接
    flowCounts.forEach((count, key) => {
      const [from, to] = key.split('->');
      diagram += `  ${from} -->|${count}x| ${to}\n`;
    });

    return diagram;
  }

  /**
   * 批量传递数据
   * 
   * 一次性传递多个数据
   * 
   * @param flows 数据流列表
   * @returns 处理结果
   */
  passBatch(
    flows: Array<{
      fromNode: string;
      fromOutput: string;
      toNode: string;
      toInput: string;
      data: any;
    }>
  ): Array<{ success: boolean; data?: any; error?: string }> {
    const results = [];

    for (const flow of flows) {
      try {
        const result = this.passData(
          flow.fromNode,
          flow.fromOutput,
          flow.toNode,
          flow.toInput,
          flow.data
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * 日志输出
   * 
   * @param message 日志消息
   */
  private log(message: string): void {
    if (this.config.logDataFlow) {
      console.log(`[DataFlowManager] ${message}`);
    }
  }

  /**
   * 重置管理器
   */
  reset(): void {
    this.clearFlowRecords();
    this.transformers.clear();
    this.log('DataFlowManager reset');
  }
}
