'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { ConsoleCard } from '@/components/console/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 系统流程图
const systemFlowDiagram = `
graph TB
    subgraph "前端层 Frontend"
        A[用户输入问题] --> B[ChatbotWidget组件]
        B --> C[发送 POST 请求]
    end

    subgraph "API 路由层 API Routes"
        C --> D["/api/[company]/chat/route.ts"]
        D --> E{速率限制检查}
        E -->|通过| F[验证公司ID]
        E -->|失败| G[返回429错误]
        F --> H[解析请求体]
        H --> I[parseChatRequest]
    end

    subgraph "数据库层 Database"
        I --> J[DatabaseManager]
        J --> K[保存用户消息]
        J --> L[获取历史对话]
    end

    subgraph "知识库层 Knowledge Base"
        I --> M[loadKnowledgeContext]
        M --> N[getKnowledgeBase]
        N --> O{检查缓存}
        O -->|命中| P[返回缓存]
        O -->|未命中| Q[loadFromHTTP]
        Q --> R["从 /public/projects/[company]/knowledge/ 加载"]
        R --> S["1-services.json<br/>2-company_info.json<br/>3-ai_config.json<br/>3-knowledge_base.json<br/>4-response_templates.json<br/>5-faq_detailed.json"]
        S --> T[设置缓存]
        T --> P
        P --> U[retrieveRelevantChunks]
        U --> V{匹配知识块}
        V -->|q_triggers匹配| W[检索相关知识块]
        V -->|aliases匹配| W
        V -->|tags匹配| W
        W --> X[构建增强的System Prompt]
    end

    subgraph "AI 模型层 AI Model"
        X --> Y[createGeminiModel]
        Y --> Z[Google Generative AI]
        Z --> AA[Gemini 2.0 Flash]
        L --> AB[构建消息历史]
        AB --> AC[generateAIResponse]
        AC --> AD[streamText]
        AD --> AA
        AA --> AE[生成AI回答]
        AE --> AF[流式返回响应]
    end

    subgraph "响应处理 Response"
        AF --> AG[保存AI消息到数据库]
        AG --> AH[返回流式响应给前端]
        AH --> B
        B --> AI[显示AI回答]
    end

    style A fill:#e1f5ff
    style AA fill:#ffeb3b
    style AE fill:#ffeb3b
    style S fill:#c8e6c9
    style W fill:#c8e6c9
    style X fill:#c8e6c9
`

// 文件关系图
const fileRelationshipDiagram = `
graph LR
    subgraph "前端组件 Frontend Components"
        A1[ChatbotWidget.tsx]
        A2[Demo Page]
        A3[Knowledge Viewer]
    end

    subgraph "API 路由 API Routes"
        B1["app/api/[company]/chat/route.ts"]
        B2["app/api/[company]/config/route.ts"]
        B3["app/api/knowledge/[company]/route.ts"]
    end

    subgraph "核心库 Core Libraries"
        C1["lib/api/chat-helpers.ts"]
        C2["lib/knowledge.ts"]
        C3["lib/knowledge-cache.ts"]
        C4["lib/db/index.ts"]
    end

    subgraph "知识库文件 Knowledge Files"
        D1["projects/[company]/knowledge/<br/>1-services.json"]
        D2["projects/[company]/knowledge/<br/>2-company_info.json"]
        D3["projects/[company]/knowledge/<br/>3-ai_config.json"]
        D4["projects/[company]/knowledge/<br/>3-knowledge_base.json<br/>包含 retrieval.chunks"]
        D5["projects/[company]/knowledge/<br/>4-response_templates.json"]
        D6["projects/[company]/knowledge/<br/>5-faq_detailed.json"]
    end

    subgraph "公共文件 Public Files"
        E1["public/projects/[company]/knowledge/<br/>所有JSON文件副本"]
    end

    subgraph "外部服务 External Services"
        F1[Google Gemini API]
        F2[Supabase Database]
    end

    A1 -->|POST请求| B1
    A2 -->|GET请求| B3
    A3 -->|GET请求| B3

    B1 -->|调用| C1
    B1 -->|使用| C4
    B1 -->|调用| C2

    C1 -->|调用| C2
    C1 -->|创建| F1
    C1 -->|检索| D4

    C2 -->|读取| C3
    C2 -->|HTTP加载| E1
    C3 -->|缓存| E1

    C4 -->|连接| F2

    D1 -->|构建时复制| E1
    D2 -->|构建时复制| E1
    D3 -->|构建时复制| E1
    D4 -->|构建时复制| E1
    D5 -->|构建时复制| E1
    D6 -->|构建时复制| E1

    style D4 fill:#ffeb3b
    style C1 fill:#4caf50
    style C2 fill:#4caf50
    style F1 fill:#ff9800
    style F2 fill:#ff9800
`

// 检索机制流程图
const retrievalFlowDiagram = `
flowchart TD
    A[用户问题] --> B[retrieveRelevantChunks函数]
    B --> C{检查知识库}
    C -->|无retrieval数据| D[返回空数组]
    C -->|有retrieval数据| E[开始匹配流程]
    
    E --> F[方法1: q_triggers匹配]
    F --> G{问题包含<br/>q_triggers关键词?}
    G -->|是| H[添加匹配的chunk]
    G -->|否| I[方法2: aliases匹配]
    
    I --> J{问题包含<br/>aliases关键词?}
    J -->|是| K[查找相关tags的chunks]
    K --> H
    J -->|否| L[方法3: tags匹配]
    
    L --> M{问题包含<br/>tags关键词?}
    M -->|是| N[查找对应tags的chunks]
    N --> H
    M -->|否| O[返回空数组]
    
    H --> P[去重处理]
    P --> Q[返回相关知识块数组]
    
    Q --> R[构建System Prompt]
    R --> S[注入知识块内容]
    S --> T[发送给AI模型]
    
    style H fill:#4caf50
    style Q fill:#4caf50
    style T fill:#ffeb3b
`

// 数据流向图
const dataFlowDiagram = `
graph TD
    subgraph "数据源 Data Sources"
        A1["projects/[company]/knowledge/<br/>原始知识库文件"]
        A2["public/projects/[company]/knowledge/<br/>公共访问文件"]
    end

    subgraph "运行时 Runtime"
        B1[Edge Runtime]
        B2[Node.js Runtime]
    end

    subgraph "加载流程 Loading Flow"
        C1[getKnowledgeBase]
        C2[检查缓存]
        C3[loadFromHTTP]
        C4[HTTP Fetch]
    end

    subgraph "处理流程 Processing Flow"
        D1[知识库对象]
        D2[retrieveRelevantChunks]
        D3[匹配知识块]
        D4[构建System Prompt]
    end

    subgraph "AI处理 AI Processing"
        E1[Gemini API]
        E2[生成回答]
    end

    A1 -->|构建时复制| A2
    A2 -->|运行时HTTP请求| C4
    C4 --> C3
    C3 --> C2
    C2 -->|缓存命中| D1
    C2 -->|缓存未命中| C1
    C1 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> E1
    E1 --> E2

    B1 -.->|使用| C3
    B2 -.->|使用| C3

    style A1 fill:#e3f2fd
    style A2 fill:#e3f2fd
    style D3 fill:#c8e6c9
    style E1 fill:#ffeb3b
    style E2 fill:#ffeb3b
`

interface MermaidDiagramProps {
  diagram: string
  title: string
}

function MermaidDiagram({ diagram, title }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 初始化 mermaid（只初始化一次）
    if (typeof window !== 'undefined' && !isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
        },
      })
      setIsInitialized(true)
    }
  }, [isInitialized])

  useEffect(() => {
    if (!ref.current || !isInitialized) return

    const renderDiagram = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 清空之前的内容
        if (ref.current) {
          ref.current.innerHTML = ''
        }

        // 生成唯一 ID
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`
        if (ref.current) {
          ref.current.id = id
          ref.current.textContent = diagram

          // 渲染图表
          await mermaid.run({
            nodes: [ref.current],
          })
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError(err instanceof Error ? err.message : '渲染图表时出错')
      } finally {
        setIsLoading(false)
      }
    }

    renderDiagram()
  }, [diagram, isInitialized])

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      <div className="border border-[var(--border-subtle)] rounded-lg p-4 bg-background overflow-auto min-h-[400px]">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">正在加载图表...</div>
          </div>
        )}
        {error && (
          <div className="text-red-500 py-4">
            <p className="font-medium">渲染错误：</p>
            <p className="text-sm">{error}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">查看详情</summary>
              <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                {error}
              </pre>
            </details>
          </div>
        )}
        <div ref={ref} className="mermaid" style={{ minHeight: '300px' }}>
          {!isLoading && !error && diagram}
        </div>
      </div>
    </div>
  )
}

export function SystemArchitecture() {
  return (
    <ConsoleCard>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">系统架构流程图</h2>
          <p className="text-sm text-muted-foreground">
            展示系统各组件之间的关系、数据流向以及 AI 如何参与整个流程
          </p>
        </div>

        <Tabs defaultValue="system-flow" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="system-flow">系统流程</TabsTrigger>
            <TabsTrigger value="file-relationship">文件关系</TabsTrigger>
            <TabsTrigger value="retrieval-flow">检索机制</TabsTrigger>
            <TabsTrigger value="data-flow">数据流向</TabsTrigger>
          </TabsList>

          <TabsContent value="system-flow" className="mt-0">
            <MermaidDiagram
              diagram={systemFlowDiagram}
              title="完整系统流程图"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>从用户输入问题到 AI 生成回答的完整流程，包括：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>前端组件发送请求</li>
                <li>API 路由处理和验证</li>
                <li>知识库检索和匹配</li>
                <li>AI 模型生成回答</li>
                <li>流式返回响应</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="file-relationship" className="mt-0">
            <MermaidDiagram
              diagram={fileRelationshipDiagram}
              title="文件关系图"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>展示系统中各个文件之间的依赖关系：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>前端组件 → API 路由 → 核心库</li>
                <li>知识库文件 → 公共文件（构建时复制）</li>
                <li>核心库 → 外部服务（Gemini API、Supabase）</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="retrieval-flow" className="mt-0">
            <MermaidDiagram
              diagram={retrievalFlowDiagram}
              title="知识库检索机制"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>知识库检索的三层匹配机制：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>方法1</strong>：通过 q_triggers 精确匹配（优先）</li>
                <li><strong>方法2</strong>：通过 aliases 关键词匹配</li>
                <li><strong>方法3</strong>：通过 tags 标签匹配</li>
                <li>匹配后去重并构建增强的 System Prompt</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="data-flow" className="mt-0">
            <MermaidDiagram
              diagram={dataFlowDiagram}
              title="数据流向图"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>数据从源文件到 AI 的完整流向：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>构建时：projects/ → public/projects/</li>
                <li>运行时：HTTP 请求 → 缓存检查 → 加载知识库</li>
                <li>处理：检索匹配 → 构建 Prompt → AI 生成</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ConsoleCard>
  )
}

