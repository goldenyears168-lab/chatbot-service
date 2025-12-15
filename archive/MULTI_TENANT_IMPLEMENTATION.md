# 多租户架构实施指南

## 📋 实施概览

本指南详细说明如何将现有的单租户架构重构为多租户架构。

---

## 🎯 目标架构

```
/api/{company}/chat          → 处理聊天请求
/api/{company}/faq-menu      → 处理 FAQ 菜单请求
/knowledge/{company}/        → 公司特定知识库
/widget/                     → 共享 Widget 文件
```

---

## 📁 步骤 1: 重构目录结构

### 1.1 创建新目录

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service

# 创建多租户目录结构
mkdir -p knowledge/goldenyears
mkdir -p knowledge/shared
mkdir -p functions/api/\[company\]
```

### 1.2 移动现有文件

```bash
# 移动 goldenyears 的知识库
mv goldenyears/knowledge/* knowledge/goldenyears/

# 保留 widget 在根目录（共享）
# widget/ 目录保持不变
```

### 1.3 创建公司配置文件

```bash
# 创建公司配置
touch knowledge/companies.json
```

---

## 🔧 步骤 2: 创建公司配置

### 2.1 创建 `knowledge/companies.json`

```json
{
  "goldenyears": {
    "id": "goldenyears",
    "name": "好時有影",
    "name_en": "Golden Years Photo",
    "allowedOrigins": [
      "https://www.goldenyearsphoto.com",
      "https://goldenyearsphoto.com",
      "http://localhost:8080"
    ],
    "widgetConfig": {
      "theme": "light",
      "locale": "zh-TW"
    },
    "apiConfig": {
      "useSharedApiKey": true,
      "apiKeyEnv": "GEMINI_API_KEY"
    }
  },
  "company2": {
    "id": "company2",
    "name": "公司 2",
    "name_en": "Company 2",
    "allowedOrigins": [
      "https://www.company2.com"
    ],
    "widgetConfig": {
      "theme": "dark",
      "locale": "en-US"
    },
    "apiConfig": {
      "useSharedApiKey": true,
      "apiKeyEnv": "GEMINI_API_KEY"
    }
  }
}
```

---

## 💻 步骤 3: 创建动态路由

### 3.1 创建 `functions/api/[company]/chat.ts`

```typescript
/**
 * 多租户 Chat API
 * 路径: /api/{company}/chat
 */

import { Pipeline, PipelineContext } from '../lib/pipeline.js';
import { loadCompanyKnowledgeBase } from '../lib/knowledge.js';
import { initLLMService } from '../lib/llm.js';
import { ContextManager } from '../lib/contextManager.js';
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
} from '../nodes/index.js';
import { getCompanyConfig } from '../lib/companyConfig.js';

/**
 * POST /api/{company}/chat
 */
export async function onRequestPost(context: {
  request: Request;
  env: any;
  params: { company: string };
}): Promise<Response> {
  const { request, env, params } = context;
  const companyId = params.company;

  try {
    // 1. 验证公司 ID
    const companyConfig = await getCompanyConfig(companyId);
    if (!companyConfig) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. 验证 CORS
    const origin = request.headers.get('Origin');
    if (origin && !companyConfig.allowedOrigins.includes(origin)) {
      return new Response(
        JSON.stringify({ error: 'CORS not allowed' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. 创建 Pipeline Context
    const pipelineContext: PipelineContext = {
      request,
      env,
      companyId,
      companyConfig,
      knowledgeBase: null,
      llmService: null,
      contextManager: null,
      // ... 其他字段
    };

    // 4. 执行 Pipeline
    const pipeline = new Pipeline([
      node_validateRequest,
      node_initializeServices,
      node_contextManagement,
      node_intentExtraction,
      node_stateTransition,
      node_specialIntents,
      node_faqCheck,
      node_llmGeneration,
      node_buildResponse,
    ]);

    const response = await pipeline.execute(pipelineContext);
    return response;

  } catch (error) {
    console.error(`[${companyId}] Chat API error:`, error);
    return handlePipelineError(error, { companyId });
  }
}

/**
 * OPTIONS /api/{company}/chat (CORS 预检)
 */
export async function onRequestOptions(context: {
  request: Request;
  env: any;
  params: { company: string };
}): Promise<Response> {
  const { params } = context;
  const companyId = params.company;
  
  const companyConfig = await getCompanyConfig(companyId);
  if (!companyConfig) {
    return new Response(null, { status: 404 });
  }

  const origin = context.request.headers.get('Origin');
  const allowedOrigin = origin && companyConfig.allowedOrigins.includes(origin)
    ? origin
    : companyConfig.allowedOrigins[0];

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

### 3.2 创建 `functions/api/[company]/faq-menu.ts`

```typescript
/**
 * 多租户 FAQ Menu API
 * 路径: /api/{company}/faq-menu
 */

import { getCompanyConfig } from '../lib/companyConfig.js';
import { loadCompanyKnowledgeBase } from '../lib/knowledge.js';

export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { company: string };
}): Promise<Response> {
  const { request, env, params } = context;
  const companyId = params.company;

  try {
    // 验证公司 ID
    const companyConfig = await getCompanyConfig(companyId);
    if (!companyConfig) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 验证 CORS
    const origin = request.headers.get('Origin');
    if (origin && !companyConfig.allowedOrigins.includes(origin)) {
      return new Response(
        JSON.stringify({ error: 'CORS not allowed' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 加载知识库
    const knowledgeBase = await loadCompanyKnowledgeBase(companyId, request);
    const faqMenu = knowledgeBase.getFAQMenu();

    const allowedOrigin = origin && companyConfig.allowedOrigins.includes(origin)
      ? origin
      : companyConfig.allowedOrigins[0];

    return new Response(JSON.stringify(faqMenu), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
      },
    });

  } catch (error) {
    console.error(`[${companyId}] FAQ Menu API error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function onRequestOptions(context: {
  request: Request;
  env: any;
  params: { company: string };
}): Promise<Response> {
  // 类似 chat.ts 的 OPTIONS 处理
  // ...
}
```

---

## 📚 步骤 4: 修改知识库加载器

### 4.1 修改 `functions/api/lib/knowledge.ts`

```typescript
// 添加公司 ID 支持

export class KnowledgeBase {
  private companyId: string;
  private baseUrl: string;
  // ... 其他属性

  constructor(companyId: string, baseUrl?: string) {
    this.companyId = companyId;
    this.baseUrl = baseUrl;
  }

  async load(baseUrl?: string): Promise<void> {
    if (baseUrl) this.baseUrl = baseUrl;
    
    // 加载公司特定的知识库
    const knowledgePath = `/knowledge/${this.companyId}/`;
    
    // 加载 services.json
    const servicesUrl = `${this.baseUrl}${knowledgePath}services.json`;
    const servicesResponse = await fetch(servicesUrl);
    if (!servicesResponse.ok) {
      throw new Error(`Failed to load services.json for ${this.companyId}`);
    }
    this.services = await servicesResponse.json();
    
    // 加载其他知识库文件...
    // faq_detailed.json, policies.json, etc.
  }
}

// 工厂函数
export async function loadCompanyKnowledgeBase(
  companyId: string,
  request: Request
): Promise<KnowledgeBase> {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const kb = new KnowledgeBase(companyId, baseUrl);
  await kb.load();
  return kb;
}
```

### 4.2 创建 `functions/api/lib/companyConfig.ts`

```typescript
/**
 * 公司配置管理
 */

interface CompanyConfig {
  id: string;
  name: string;
  name_en: string;
  allowedOrigins: string[];
  widgetConfig: {
    theme: string;
    locale: string;
  };
  apiConfig: {
    useSharedApiKey: boolean;
    apiKeyEnv?: string;
  };
}

let companiesConfig: Record<string, CompanyConfig> | null = null;
let configLoading: Promise<Record<string, CompanyConfig>> | null = null;

/**
 * 加载公司配置
 */
async function loadCompaniesConfig(baseUrl: string): Promise<Record<string, CompanyConfig>> {
  if (companiesConfig) {
    return companiesConfig;
  }

  if (configLoading) {
    return await configLoading;
  }

  configLoading = (async () => {
    try {
      const configUrl = `${baseUrl}/knowledge/companies.json`;
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error('Failed to load companies.json');
      }
      companiesConfig = await response.json();
      return companiesConfig!;
    } catch (error) {
      console.error('Failed to load companies config:', error);
      throw error;
    } finally {
      configLoading = null;
    }
  })();

  return await configLoading;
}

/**
 * 获取公司配置
 */
export async function getCompanyConfig(
  companyId: string,
  baseUrl?: string
): Promise<CompanyConfig | null> {
  if (!baseUrl) {
    // 如果没有提供 baseUrl，尝试从全局获取
    // 这需要根据实际情况调整
    return null;
  }

  const config = await loadCompaniesConfig(baseUrl);
  return config[companyId] || null;
}

/**
 * 验证公司 ID
 */
export function isValidCompany(companyId: string): boolean {
  // 简单的验证：只允许字母、数字、连字符
  return /^[a-z0-9-]+$/.test(companyId);
}
```

---

## 🎨 步骤 5: 修改 Widget

### 5.1 修改 `widget/loader.js`

```javascript
// widget/loader.js

(function() {
  'use strict';
  
  // 防止重复加载
  if (window.GYChatbotLoader) {
    console.warn('[GYChatbot] Loader already initialized');
    return;
  }
  
  // 从 script tag 读取配置
  const script = document.currentScript || 
    document.querySelector('script[data-widget-loader="gy-chatbot"]');
  
  if (!script) {
    console.error('[GYChatbot] Loader script not found');
    return;
  }
  
  // 获取公司 ID（必需）
  const companyId = script.dataset.company;
  if (!companyId) {
    console.error('[GYChatbot] company ID is required. Please set data-company attribute.');
    return;
  }
  
  const config = {
    // 公司 ID
    companyId: companyId,
    
    // API 端点（包含公司 ID）
    apiEndpoint: script.dataset.apiEndpoint || 
      `${script.src.replace('/widget/loader.js', '')}/api/${companyId}/chat`,
    
    // API 基础 URL
    apiBaseUrl: script.dataset.apiBaseUrl || 
      script.src.replace('/widget/loader.js', ''),
    
    // Widget 文件位置
    widgetBaseUrl: script.dataset.widgetBaseUrl || 
      script.src.replace('/widget/loader.js', ''),
    
    // 主题和语言
    theme: script.dataset.theme || 'light',
    locale: script.dataset.locale || 'zh-TW',
    
    // 页面类型
    pageType: script.dataset.pageType || 'embed',
    
    // 是否自动打开
    autoOpen: script.dataset.autoOpen === 'true',
  };
  
  // 载入 CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = `${config.widgetBaseUrl}/widget.css`;
  cssLink.onerror = () => {
    console.error('[GYChatbot] Failed to load CSS from:', cssLink.href);
  };
  document.head.appendChild(cssLink);
  
  // 载入核心 Widget JS
  const widgetScript = document.createElement('script');
  widgetScript.src = `${config.widgetBaseUrl}/widget.js`;
  widgetScript.async = true;
  widgetScript.onload = function() {
    if (window.GYChatbot) {
      window.GYChatbot.init(config).then(() => {
        console.log(`[GYChatbot] Widget initialized for company: ${companyId}`);
        if (config.autoOpen && typeof window.GYChatbot.open === 'function') {
          setTimeout(() => {
            window.GYChatbot.open();
          }, 500);
        }
      }).catch((error) => {
        console.error('[GYChatbot] Initialization error:', error);
      });
    } else {
      console.error('[GYChatbot] Widget core script not available');
    }
  };
  widgetScript.onerror = () => {
    console.error('[GYChatbot] Failed to load widget script from:', widgetScript.src);
  };
  document.body.appendChild(widgetScript);
  
  // 标记已加载
  window.GYChatbotLoader = { config, companyId };
})();
```

### 5.2 修改 `widget/widget.js`

在 `widget.js` 中，确保 API 调用使用正确的端点：

```javascript
// widget/widget.js

// 在初始化时使用 config.apiEndpoint
// 确保 API 调用包含公司 ID
```

---

## 🌐 步骤 6: 更新网站引用

### 6.1 更新 `goldenyearsphoto/src/_includes/base-layout.njk`

```njk
{# AI 客服 Widget - 多租户版本 #}
<script 
  src="https://chatbot-api.example.com/widget/loader.js" 
  data-company="goldenyears"
  data-api-endpoint="https://chatbot-api.example.com/api/goldenyears/chat"
  data-api-base-url="https://chatbot-api.example.com"
  data-page-type="{{ pageType | default('other') }}"
  data-auto-open="{{ 'true' if pageType == 'home' else 'false' }}"
  defer
></script>
```

---

## ✅ 验证清单

### 代码结构
- [ ] 目录结构已重构
- [ ] `functions/api/[company]/chat.ts` 已创建
- [ ] `functions/api/[company]/faq-menu.ts` 已创建
- [ ] `knowledge/companies.json` 已创建
- [ ] 知识库已移动到 `knowledge/goldenyears/`

### 功能测试
- [ ] `/api/goldenyears/chat` 正常工作
- [ ] `/api/goldenyears/faq-menu` 正常工作
- [ ] CORS 配置正确
- [ ] Widget 加载正常
- [ ] 多公司隔离正常

### 部署
- [ ] 代码已提交
- [ ] 部署到 Cloudflare Pages
- [ ] 生产环境验证通过

---

## 🎉 完成

多租户架构实施完成！现在可以：

1. **添加新公司**: 只需添加 `knowledge/{company}/` 目录和配置
2. **统一部署**: 所有公司共享同一个部署
3. **独立管理**: 每个公司的知识库和配置独立

---

**最后更新**: 2024-01-XX
