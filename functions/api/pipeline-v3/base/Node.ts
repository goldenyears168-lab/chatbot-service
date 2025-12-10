/**
 * Pipeline v3 - 节点基类
 * 
 * 所有 Pipeline 节点的抽象基类，定义了节点的核心接口和行为
 * 
 * @version 3.0.0
 * @author Pipeline Team
 */

/**
 * 节点输入定义
 */
export interface NodeInput {
  /** 输入名称 */
  name: string;
  /** 输入类型（TypeScript 类型字符串） */
  type: string;
  /** 是否必需 */
  required: boolean;
  /** 描述 */
  description: string;
  /** 默认值（可选） */
  default?: any;
}

/**
 * 节点输出定义
 */
export interface NodeOutput {
  /** 输出名称 */
  name: string;
  /** 输出类型（TypeScript 类型字符串） */
  type: string;
  /** 描述 */
  description: string;
}

/**
 * 节点元数据
 * 
 * 定义节点的身份、功能和配置
 */
export interface NodeMetadata {
  /** 节点唯一 ID */
  id: string;
  /** 节点显示名称 */
  name: string;
  /** 版本号 */
  version: string;
  /** 分类（core/custom/integration） */
  category: string;
  /** 描述 */
  description: string;
  /** 图标（emoji 或 icon class） */
  icon: string;
  /** 主题颜色（hex） */
  color: string;
  /** 输入定义 */
  inputs: NodeInput[];
  /** 输出定义 */
  outputs: NodeOutput[];
  /** 配置选项（可选） */
  config?: Record<string, any>;
  /** 作者（可选） */
  author?: string;
  /** 标签（可选） */
  tags?: string[];
}

/**
 * 节点执行结果
 */
export interface NodeExecutionResult {
  /** 执行是否成功 */
  success: boolean;
  /** 输出数据 */
  output: any;
  /** 输出名称（对应 metadata.outputs 中的 name） */
  outputName: string;
  /** 执行元数据 */
  metadata: {
    /** 执行时间（毫秒） */
    executionTime: number;
    /** 时间戳 */
    timestamp: string;
    /** 节点 ID */
    nodeId: string;
    /** 执行 ID（可选） */
    executionId?: string;
  };
  /** 错误信息（如果失败） */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * 执行上下文接口
 * （完整定义在 ExecutionContext.ts 中）
 */
export interface ExecutionContext {
  /** 执行 ID */
  executionId: string;
  /** 工作流 ID */
  workflowId: string;
  /** 共享数据 */
  data: Map<string, any>;
  /** 设置数据 */
  setData(key: string, value: any): void;
  /** 获取数据 */
  getData(key: string): any;
  /** 记录节点开始 */
  recordNodeStart(nodeId: string): void;
  /** 记录节点完成 */
  recordNodeComplete(nodeId: string, result: NodeExecutionResult): void;
  /** 记录节点错误 */
  recordNodeError(nodeId: string, error: any): void;
}

/**
 * 节点基类
 * 
 * 所有自定义节点都应该继承这个类
 * 
 * @example
 * ```typescript
 * export class MyCustomNode extends BaseNode {
 *   constructor(config?: Record<string, any>) {
 *     super({
 *       id: 'my-custom-node',
 *       name: 'My Custom Node',
 *       // ... other metadata
 *     }, config);
 *   }
 *   
 *   async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
 *     // Your logic here
 *     return {
 *       success: true,
 *       output: result,
 *       outputName: 'success',
 *       metadata: { ... }
 *     };
 *   }
 * }
 * ```
 */
export abstract class BaseNode {
  /** 节点元数据 */
  protected metadata: NodeMetadata;
  
  /** 节点配置 */
  protected config: Record<string, any>;
  
  /** 是否启用详细日志 */
  protected verbose: boolean = false;

  /**
   * 构造函数
   * 
   * @param metadata 节点元数据
   * @param config 节点配置（会与 metadata.config 合并）
   */
  constructor(metadata: NodeMetadata, config?: Record<string, any>) {
    this.metadata = metadata;
    this.config = { ...metadata.config, ...config };
    this.verbose = this.config.verbose || false;
  }

  /**
   * 执行节点逻辑（抽象方法，必须由子类实现）
   * 
   * @param input 输入数据
   * @param context 执行上下文
   * @returns 执行结果
   */
  abstract execute(
    input: any,
    context: ExecutionContext
  ): Promise<NodeExecutionResult>;

  /**
   * 验证输入数据
   * 
   * 检查输入是否符合 metadata.inputs 的定义
   * 
   * @param input 输入数据
   * @returns 是否有效
   * @throws Error 如果验证失败
   */
  protected validateInput(input: any): boolean {
    this.log('Validating input...');

    for (const inputDef of this.metadata.inputs) {
      const value = input[inputDef.name];

      // 检查必需字段
      if (inputDef.required && (value === undefined || value === null)) {
        throw new Error(
          `Missing required input: ${inputDef.name} (${this.metadata.name})`
        );
      }

      // 类型检查（基础）
      if (value !== undefined && value !== null) {
        const actualType = typeof value;
        const expectedType = inputDef.type.toLowerCase();

        // 简单类型匹配
        if (
          expectedType.includes('string') && actualType !== 'string' ||
          expectedType.includes('number') && actualType !== 'number' ||
          expectedType.includes('boolean') && actualType !== 'boolean' ||
          expectedType.includes('object') && actualType !== 'object' ||
          expectedType.includes('array') && !Array.isArray(value)
        ) {
          this.log(
            `Warning: Input ${inputDef.name} type mismatch. Expected ${expectedType}, got ${actualType}`
          );
        }
      }
    }

    this.log('Input validation passed');
    return true;
  }

  /**
   * 创建成功结果
   * 
   * 辅助方法，用于创建标准的成功结果
   * 
   * @param output 输出数据
   * @param outputName 输出名称（默认 'success'）
   * @param executionTime 执行时间（毫秒）
   * @returns 节点执行结果
   */
  protected createSuccessResult(
    output: any,
    outputName: string = 'success',
    executionTime: number = 0
  ): NodeExecutionResult {
    return {
      success: true,
      output,
      outputName,
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
        nodeId: this.metadata.id,
      },
    };
  }

  /**
   * 创建错误结果
   * 
   * 辅助方法，用于创建标准的错误结果
   * 
   * @param error 错误对象或消息
   * @param executionTime 执行时间（毫秒）
   * @returns 节点执行结果
   */
  protected createErrorResult(
    error: Error | string,
    executionTime: number = 0
  ): NodeExecutionResult {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    return {
      success: false,
      output: null,
      outputName: 'error',
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
        nodeId: this.metadata.id,
      },
      error: {
        message: errorObj.message,
        stack: errorObj.stack,
      },
    };
  }

  /**
   * 日志输出
   * 
   * @param message 日志消息
   * @param level 日志级别
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.verbose && level === 'info') {
      return;
    }

    const prefix = `[${this.metadata.name}]`;
    const timestamp = new Date().toISOString();

    switch (level) {
      case 'error':
        console.error(`${timestamp} ${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefix} ${message}`);
        break;
      default:
        console.log(`${timestamp} ${prefix} ${message}`);
    }
  }

  /**
   * 获取节点元数据
   * 
   * @returns 节点元数据
   */
  getMetadata(): NodeMetadata {
    return this.metadata;
  }

  /**
   * 获取节点配置
   * 
   * @returns 节点配置
   */
  getConfig(): Record<string, any> {
    return this.config;
  }

  /**
   * 获取节点 ID
   * 
   * @returns 节点 ID
   */
  getId(): string {
    return this.metadata.id;
  }

  /**
   * 获取节点名称
   * 
   * @returns 节点名称
   */
  getName(): string {
    return this.metadata.name;
  }

  /**
   * 设置配置
   * 
   * @param key 配置键
   * @param value 配置值
   */
  setConfig(key: string, value: any): void {
    this.config[key] = value;
  }

  /**
   * 启用/禁用详细日志
   * 
   * @param enabled 是否启用
   */
  setVerbose(enabled: boolean): void {
    this.verbose = enabled;
  }
}

/**
 * 节点注册表
 * 
 * 用于注册和获取节点类
 */
export class NodeRegistry {
  private static nodes: Map<string, typeof BaseNode> = new Map();

  /**
   * 注册节点
   * 
   * @param nodeClass 节点类
   */
  static register(nodeClass: typeof BaseNode): void {
    // 创建临时实例以获取元数据
    const tempInstance = new (nodeClass as any)();
    const metadata = tempInstance.getMetadata();
    
    this.nodes.set(metadata.id, nodeClass);
    console.log(`[NodeRegistry] Registered node: ${metadata.id}`);
  }

  /**
   * 获取节点类
   * 
   * @param nodeId 节点 ID
   * @returns 节点类
   */
  static get(nodeId: string): typeof BaseNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * 获取所有已注册节点
   * 
   * @returns 节点 ID 列表
   */
  static list(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * 清空注册表
   */
  static clear(): void {
    this.nodes.clear();
  }
}
