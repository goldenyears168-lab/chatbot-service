/**
 * Flow Diagram Generator - 流程图生成器
 * 
 * 生成 Mermaid 格式的工作流流程图
 * 
 * @version 3.0.0
 */

import { WorkflowDefinition, NodeDefinition, ConnectionDefinition } from '../ExecutionContext.js';

/**
 * 节点样式配置
 */
interface NodeStyle {
  shape: 'rectangle' | 'roundedRectangle' | 'stadium' | 'subroutine' | 'cylindrical' | 'circle' | 'diamond' | 'hexagon';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * 流程图配置
 */
interface FlowDiagramConfig {
  direction: 'TD' | 'TB' | 'BT' | 'RL' | 'LR';  // Top-Down, Bottom-Top, Right-Left, Left-Right
  theme: 'default' | 'dark' | 'forest' | 'neutral';
  showMetadata: boolean;
  showConfig: boolean;
  nodeStyles?: Record<string, NodeStyle>;
}

/**
 * 流程图生成器类
 */
export class FlowDiagram {
  private config: FlowDiagramConfig;

  constructor(config?: Partial<FlowDiagramConfig>) {
    this.config = {
      direction: 'TD',
      theme: 'default',
      showMetadata: false,
      showConfig: false,
      ...config,
    };
  }

  /**
   * 生成完整的 Mermaid 流程图
   */
  generateMermaid(workflow: WorkflowDefinition): string {
    const lines: string[] = [];

    // 1. 图表类型和方向
    lines.push(`graph ${this.config.direction}`);
    lines.push('');

    // 2. 节点定义
    lines.push('  %% 节点定义');
    for (const node of workflow.nodes) {
      lines.push(this.generateNodeDefinition(node));
    }
    lines.push('');

    // 3. 连接定义
    lines.push('  %% 连接定义');
    for (const connection of workflow.connections) {
      lines.push(this.generateConnectionDefinition(connection, workflow));
    }
    lines.push('');

    // 4. 样式定义
    if (this.config.nodeStyles) {
      lines.push('  %% 样式定义');
      for (const [nodeType, style] of Object.entries(this.config.nodeStyles)) {
        const nodes = workflow.nodes.filter(n => n.type === nodeType);
        if (nodes.length > 0) {
          lines.push(this.generateStyleDefinition(nodes, style));
        }
      }
      lines.push('');
    }

    // 5. 类定义（根据节点类别）
    lines.push('  %% 类定义');
    lines.push('  classDef validation fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff');
    lines.push('  classDef processing fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff');
    lines.push('  classDef decision fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff');
    lines.push('  classDef output fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff');
    lines.push('  classDef error fill:#F44336,stroke:#D32F2F,stroke-width:2px,color:#fff');
    lines.push('');

    // 6. 应用类到节点
    lines.push('  %% 应用类');
    for (const node of workflow.nodes) {
      const className = this.getNodeClassName(node);
      if (className) {
        lines.push(`  class ${node.id} ${className}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 生成节点定义
   */
  private generateNodeDefinition(node: NodeDefinition): string {
    const icon = this.getNodeIcon(node);
    const label = `${icon} ${node.name}`;
    const shape = this.getNodeShape(node);

    switch (shape) {
      case 'roundedRectangle':
        return `  ${node.id}("${label}")`;
      case 'stadium':
        return `  ${node.id}(["${label}"])`;
      case 'subroutine':
        return `  ${node.id}[["${label}"]]`;
      case 'cylindrical':
        return `  ${node.id}[("${label}")]`;
      case 'circle':
        return `  ${node.id}(("${label}"))`;
      case 'diamond':
        return `  ${node.id}{"${label}"}`;
      case 'hexagon':
        return `  ${node.id}{{"${label}"}}`;
      case 'rectangle':
      default:
        return `  ${node.id}["${label}"]`;
    }
  }

  /**
   * 生成连接定义
   */
  private generateConnectionDefinition(connection: ConnectionDefinition, workflow: WorkflowDefinition): string {
    const fromNode = workflow.nodes.find(n => n.id === connection.from);
    const toNode = workflow.nodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) {
      return `  %% Warning: Connection from ${connection.from} to ${connection.to} has missing nodes`;
    }

    // 构建标签
    let label = '';
    if (connection.fromOutput) {
      label = connection.fromOutput;
    }
    if (connection.comment) {
      label = label ? `${label}<br/>${connection.comment}` : connection.comment;
    }

    // 根据输出类型选择箭头样式
    const arrowStyle = this.getArrowStyle(connection.fromOutput);

    if (label) {
      return `  ${connection.from} ${arrowStyle}|"${label}"| ${connection.to}`;
    } else {
      return `  ${connection.from} ${arrowStyle} ${connection.to}`;
    }
  }

  /**
   * 生成样式定义
   */
  private generateStyleDefinition(nodes: NodeDefinition[], style: NodeStyle): string {
    const nodeIds = nodes.map(n => n.id).join(',');
    const styleProps: string[] = [];

    if (style.fill) styleProps.push(`fill:${style.fill}`);
    if (style.stroke) styleProps.push(`stroke:${style.stroke}`);
    if (style.strokeWidth) styleProps.push(`stroke-width:${style.strokeWidth}px`);

    return `  style ${nodeIds} ${styleProps.join(',')}`;
  }

  /**
   * 获取节点图标
   */
  private getNodeIcon(node: NodeDefinition): string {
    // 优先使用节点自己的 icon
    if (node.icon) {
      return node.icon;
    }

    // 根据类型返回默认图标
    const iconMap: Record<string, string> = {
      'validate-request': '🔍',
      'initialize-services': '⚙️',
      'context-management': '💬',
      'intent-extraction': '🎯',
      'state-transition': '🔄',
      'special-intents': '⚡',
      'faq-check': '❓',
      'llm-generation': '🤖',
      'build-response': '📦',
    };

    return iconMap[node.type] || '📌';
  }

  /**
   * 获取节点形状
   */
  private getNodeShape(node: NodeDefinition): NodeStyle['shape'] {
    // 根据节点类型返回合适的形状
    if (node.type.includes('decision') || node.type.includes('check')) {
      return 'diamond';
    }
    if (node.type.includes('start') || node.type.includes('end')) {
      return 'stadium';
    }
    if (node.type.includes('validate')) {
      return 'subroutine';
    }
    if (node.type.includes('response') || node.type.includes('output')) {
      return 'roundedRectangle';
    }
    return 'rectangle';
  }

  /**
   * 获取节点类名（用于样式）
   */
  private getNodeClassName(node: NodeDefinition): string | null {
    if (node.type.includes('validate')) return 'validation';
    if (node.type.includes('check') || node.type.includes('decision')) return 'decision';
    if (node.type.includes('response') || node.type.includes('output')) return 'output';
    if (node.type.includes('error')) return 'error';
    return 'processing';
  }

  /**
   * 获取箭头样式
   */
  private getArrowStyle(outputName?: string): string {
    if (!outputName) return '-->';
    
    if (outputName === 'error') return '-.->'; // 虚线箭头（错误路径）
    if (outputName === 'success') return '-->'; // 实线箭头（成功路径）
    if (outputName === 'response') return '==>'; // 粗箭头（直接响应）
    if (outputName === 'continue') return '-->'; // 实线箭头（继续流程）
    
    return '-->';
  }

  /**
   * 生成简化的流程图（只显示主要路径）
   */
  generateSimplifiedMermaid(workflow: WorkflowDefinition): string {
    const lines: string[] = [];

    lines.push(`graph ${this.config.direction}`);
    lines.push('');

    // 只显示成功路径的连接
    const successConnections = workflow.connections.filter(
      c => !c.fromOutput || c.fromOutput === 'success' || c.fromOutput === 'continue'
    );

    // 收集用到的节点
    const usedNodeIds = new Set<string>();
    for (const conn of successConnections) {
      usedNodeIds.add(conn.from);
      usedNodeIds.add(conn.to);
    }

    const usedNodes = workflow.nodes.filter(n => usedNodeIds.has(n.id));

    // 节点定义
    for (const node of usedNodes) {
      lines.push(this.generateNodeDefinition(node));
    }
    lines.push('');

    // 连接定义
    for (const connection of successConnections) {
      lines.push(this.generateConnectionDefinition(connection, workflow));
    }

    return lines.join('\n');
  }

  /**
   * 生成节点详情（用于交互式展示）
   */
  generateNodeDetails(node: NodeDefinition): string {
    const details: string[] = [];

    details.push(`### ${node.name}`);
    details.push('');
    details.push(`**ID**: \`${node.id}\``);
    details.push(`**类型**: \`${node.type}\``);
    details.push('');

    if (node.description) {
      details.push(`**描述**: ${node.description}`);
      details.push('');
    }

    if (node.config && this.config.showConfig) {
      details.push('**配置**:');
      details.push('```json');
      details.push(JSON.stringify(node.config, null, 2));
      details.push('```');
      details.push('');
    }

    if (node.position) {
      details.push(`**位置**: x=${node.position.x}, y=${node.position.y}`);
      details.push('');
    }

    return details.join('\n');
  }

  /**
   * 生成连接详情
   */
  generateConnectionDetails(connection: ConnectionDefinition): string {
    const details: string[] = [];

    details.push(`### 连接: ${connection.from} → ${connection.to}`);
    details.push('');

    if (connection.fromOutput) {
      details.push(`**输出**: \`${connection.fromOutput}\``);
    }

    if (connection.comment) {
      details.push(`**说明**: ${connection.comment}`);
    }

    if (connection.condition) {
      details.push(`**条件**: \`${connection.condition}\``);
    }

    return details.join('\n');
  }

  /**
   * 生成工作流统计信息
   */
  generateWorkflowStats(workflow: WorkflowDefinition): Record<string, any> {
    return {
      id: workflow.id,
      name: workflow.name,
      version: workflow.version,
      totalNodes: workflow.nodes.length,
      totalConnections: workflow.connections.length,
      nodeTypes: this.getNodeTypeStats(workflow),
      connectionTypes: this.getConnectionTypeStats(workflow),
      complexity: this.calculateComplexity(workflow),
    };
  }

  /**
   * 获取节点类型统计
   */
  private getNodeTypeStats(workflow: WorkflowDefinition): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const node of workflow.nodes) {
      stats[node.type] = (stats[node.type] || 0) + 1;
    }
    return stats;
  }

  /**
   * 获取连接类型统计
   */
  private getConnectionTypeStats(workflow: WorkflowDefinition): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const conn of workflow.connections) {
      const type = conn.fromOutput || 'default';
      stats[type] = (stats[type] || 0) + 1;
    }
    return stats;
  }

  /**
   * 计算工作流复杂度
   */
  private calculateComplexity(workflow: WorkflowDefinition): number {
    // 简单的复杂度计算：节点数 + 连接数 + 分支数
    const branches = workflow.connections.filter(c => c.fromOutput && c.fromOutput !== 'success').length;
    return workflow.nodes.length + workflow.connections.length + branches * 2;
  }

  /**
   * 生成可交互的 HTML（包含 Mermaid.js）
   */
  generateInteractiveHTML(workflow: WorkflowDefinition): string {
    const mermaidCode = this.generateMermaid(workflow);
    const stats = this.generateWorkflowStats(workflow);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${workflow.name} - 流程图</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    .diagram-container {
      padding: 40px;
      overflow-x: auto;
    }
    .mermaid {
      display: flex;
      justify-content: center;
    }
    .controls {
      padding: 20px 30px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 10px;
    }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      background: #667eea;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    button:hover {
      background: #5568d3;
    }
    button.secondary {
      background: #95a5a6;
    }
    button.secondary:hover {
      background: #7f8c8d;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${workflow.name}</h1>
      <p>${workflow.description || '工作流可视化'} | 版本 ${workflow.version}</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">节点数</div>
        <div class="stat-value">${stats.totalNodes}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">连接数</div>
        <div class="stat-value">${stats.totalConnections}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">复杂度</div>
        <div class="stat-value">${stats.complexity}</div>
      </div>
    </div>

    <div class="diagram-container">
      <div class="mermaid">
${mermaidCode}
      </div>
    </div>

    <div class="controls">
      <button onclick="location.reload()">刷新</button>
      <button class="secondary" onclick="downloadSVG()">导出 SVG</button>
      <button class="secondary" onclick="downloadPNG()">导出 PNG</button>
    </div>
  </div>

  <script>
    mermaid.initialize({ 
      startOnLoad: true,
      theme: '${this.config.theme}',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });

    function downloadSVG() {
      const svg = document.querySelector('.mermaid svg');
      if (!svg) return;
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = '${workflow.id}-flowchart.svg';
      a.click();
      
      URL.revokeObjectURL(url);
    }

    function downloadPNG() {
      const svg = document.querySelector('.mermaid svg');
      if (!svg) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = '${workflow.id}-flowchart.png';
          a.click();
          URL.revokeObjectURL(pngUrl);
        });
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    }

    // 工作流数据（用于调试）
    const workflowData = ${JSON.stringify(workflow, null, 2)};
    console.log('Workflow Data:', workflowData);
  </script>
</body>
</html>`;
  }
}

export default FlowDiagram;
