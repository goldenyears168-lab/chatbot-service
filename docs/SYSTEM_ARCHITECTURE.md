# 系统架构流程图

## 完整系统流程图

```mermaid
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
```

## 文件关系图

```mermaid
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
```

## 检索机制详细流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Widget as ChatbotWidget
    participant API as Chat API Route
    participant Helper as chat-helpers.ts
    participant KB as knowledge.ts
    participant Cache as knowledge-cache.ts
    participant Public as Public Files
    participant AI as Gemini AI
    participant DB as Database

    User->>Widget: 输入问题
    Widget->>API: POST /api/[company]/chat
    API->>API: 速率限制检查
    API->>API: 验证公司ID
    API->>Helper: parseChatRequest()
    Helper-->>API: {message, conversationId}
    
    API->>DB: 保存用户消息
    DB-->>API: 保存成功
    
    API->>Helper: loadKnowledgeContext(company, baseUrl, message)
    Helper->>KB: getKnowledgeBase(company, baseUrl)
    KB->>Cache: getCachedKnowledgeBase()
    Cache-->>KB: null (未命中)
    KB->>Public: HTTP GET /projects/[company]/knowledge/*.json
    Public-->>KB: 返回所有JSON文件
    KB->>Cache: setCachedKnowledgeBase()
    KB-->>Helper: 完整知识库对象
    
    Helper->>Helper: retrieveRelevantChunks(message, knowledgeBase)
    Note over Helper: 1. 通过 q_triggers 匹配<br/>2. 通过 aliases 匹配<br/>3. 通过 tags 匹配
    Helper->>Helper: 提取相关知识块
    Helper->>Helper: 构建增强的 System Prompt
    Helper-->>API: {systemPrompt, knowledgeBase}
    
    API->>DB: getConversationMessages()
    DB-->>API: 历史消息列表
    
    API->>Helper: createGeminiModel()
    Helper-->>API: Gemini模型实例
    
    API->>Helper: generateAIResponse()
    Helper->>AI: streamText({systemPrompt, messages})
    Note over AI: 基于知识库内容<br/>生成回答
    AI-->>Helper: 流式响应
    Helper->>DB: 保存AI回答
    Helper-->>API: 流式响应对象
    API-->>Widget: 流式返回AI回答
    Widget-->>User: 显示AI回答
```

## 知识库检索机制

```mermaid
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
```

## 数据流向图

```mermaid
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
```

## 关键文件说明

### 核心文件
- **`app/api/[company]/chat/route.ts`**: 聊天API入口，处理HTTP请求
- **`lib/api/chat-helpers.ts`**: 聊天辅助函数，包含检索机制和AI调用
- **`lib/knowledge.ts`**: 知识库加载和管理
- **`lib/knowledge-cache.ts`**: 知识库缓存机制

### 知识库文件
- **`3-knowledge_base.json`**: 包含 `retrieval.chunks` 的核心知识库文件
- **`2-ai_config.json`**: AI配置，包含意图识别和实体提取
- **其他JSON文件**: 服务信息、公司信息、FAQ等

### 数据流
1. **构建时**: `projects/` → `public/projects/` (通过 copy-knowledge.sh)
2. **运行时**: HTTP请求 → 缓存检查 → 加载知识库 → 检索匹配 → AI生成

