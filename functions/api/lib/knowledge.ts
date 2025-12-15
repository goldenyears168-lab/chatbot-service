/**
 * 知識庫載入服務（Cloudflare Pages Functions 版本）
 * 使用動態載入 JSON 檔案
 */

// 注意：在 Cloudflare Pages Functions 中，JSON 文件需要通過 fetch 或動態 import 載入
// 這裡使用動態 import，確保在運行時載入

// 類型定義
export interface Service {
  id: string;
  name: string;
  name_en: string;
  one_line: string;
  target_audience: string[];
  use_cases: string[];
  price_range: string;
  price_min?: number;
  price_max?: number;
  price_unit: string;
  pricing_model: string;
  shooting_time: string;
  includes_makeup: boolean;
  retouching_count: string;
  add_ons: string[];
  pros: string[];
  not_suitable: string[];
}

export interface Persona {
  id: string;
  name: string;
  goals: string[];
  concerns: string[];
  budget_level: string;
  recommended_services: string[];
  reasoning: string;
}

export interface Policy {
  id: string;
  category: string;
  critical: boolean;
  question: string;
  answer: string;
  keywords: string[];
}

export interface ContactInfo {
  branches: Array<{
    id: string;
    name: string;
    address: string;
    address_note: string;
    phone: string;
    hours: {
      weekday: string;
      note: string;
    };
    parking: {
      available: boolean;
      locations: string[];
      recommendation: string;
    };
  }>;
  contact_channels: {
    email: string;
    ig: string;
    line: {
      available: boolean;
      message: string;
    };
    booking_link: string;
  };
  ai_response_rules: {
    line_inquiry: string;
    handoff_to_human: {
      email: string;
      phone: {
        zhongshan: string;
        gongguan: string;
      };
      ig: string;
      booking_link: string;
    };
  };
}

export interface ResponseTemplate {
  main_answer: string;
  supplementary_info: string;
  next_best_actions: string[];
}

export interface ServiceSummary {
  core_purpose: string;
  price_pricing: string;
  shooting_time_selection: string;
  delivery_speed: string;
  add_ons_limitations: string;
}

export interface EmotionTemplate {
  emotion: string;
  keywords: string[];
  warm_comfort: string;
  assistance_explanation: string;
  next_best_actions: string[];
}

export interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  critical_note?: string;
  handling_guideline?: string;
}

export interface FAQCategory {
  title: string;
  phone_handling?: {
    title: string;
    guidelines: Array<{
      situation: string;
      steps?: string[];
      response?: string;
    }>;
  };
  questions: FAQQuestion[];
  internal_operations?: {
    title: string;
    items: Array<{
      id: string;
      topic: string;
      instructions: string;
      link?: string;
      sample_responses?: string[];
    }>;
  };
}

export interface FAQDetailed {
  version: string;
  last_updated: string;
  data_source: string;
  categories: {
    booking?: FAQCategory;
    delivery?: FAQCategory;
    shooting?: FAQCategory;
    other?: FAQCategory;
  };
}

export interface IntentConfig {
  version: string;
  last_updated: string;
  data_source: string;
  intents: Array<{
    id: string;
    priority: number;
    keywords: string[];
    excludeKeywords: string[];
    contextKeywords: string[];
    specialConditions?: {
      shortMessage?: boolean;
      shortMessageThreshold?: number;
    };
  }>;
  fallback: {
    useContextIntent: boolean;
    contextIntentThreshold: number;
    defaultIntent: string;
  };
}

export interface EntityPatterns {
  version: string;
  last_updated: string;
  data_source: string;
  patterns: {
    service_type: Array<{ id: string; keywords: string[] }>;
    use_case: Array<{ id: string; keywords: string[] }>;
    persona: Array<{ id: string; keywords: string[] }>;
    branch: Record<string, { keywords: string[] }>;
    booking_action: Record<string, { keywords: string[] }>;
  };
}


export interface StateTransitionsConfig {
  version: string;
  last_updated: string;
  data_source: string;
  states: string[];
  transitions: Record<string, Record<string, string>>;
  requiredSlotsCheck?: {
    fields: string[];
    requireAny: boolean;
  };
}

export class KnowledgeBase {
  private companyId: string;
  private services: Service[] = [];
  private personas: Persona[] = [];
  private policies: Policy[] = [];
  private contactInfo: ContactInfo | null = null;
  private responseTemplates: Record<string, ResponseTemplate> = {};
  private faqDetailed: FAQDetailed | null = null;
  private intentConfig: IntentConfig | null = null;
  private entityPatterns: EntityPatterns | null = null;
  private loaded = false;

  constructor(companyId: string = 'goldenyears') {
    this.companyId = companyId;
  }

  /**
   * 載入所有知識庫資料
   * 使用動態 import 載入 JSON 文件
   * @param baseUrl 可選的基礎 URL，用於構建完整的文件路徑
   * @param assets 可選的 Cloudflare Pages ASSETS 對象
   */
  async load(baseUrl?: string, assets?: any): Promise<void> {
    try {
      // 在 Cloudflare Pages Functions 中，優先使用 fetch 載入 JSON 文件
      // 因為動態 import 在生產環境中可能無法正確解析路徑
      
      // 構建基礎 URL（添加安全驗證）
      let fetchBaseUrl = baseUrl;
      if (!fetchBaseUrl) {
        // 嘗試從 request URL 構建（應該在 chat.ts 中傳入）
        // 如果沒有，嘗試使用相對路徑
        fetchBaseUrl = '';
      }
      
      // 驗證 baseUrl 格式（防止 SSRF）
      if (fetchBaseUrl) {
        try {
          const url = new URL(fetchBaseUrl);
          // 只允許 http/https 協議
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error(`Invalid protocol: ${url.protocol}`);
          }
          // 驗證主機名（可選：限制為特定域名）
          // 這裡允許任何域名，但可以根據需要限制
        } catch (error) {
          console.error('[Knowledge] Invalid baseUrl:', fetchBaseUrl);
          throw new Error(`Invalid baseUrl format: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // 確保 baseUrl 不以 / 結尾
      if (fetchBaseUrl && fetchBaseUrl.endsWith('/')) {
        fetchBaseUrl = fetchBaseUrl.slice(0, -1);
      }
      
      // 从注册表获取公司路径（新架构）
      let companyPath: string;
      try {
        const registryUrl = `${fetchBaseUrl}/projects/registry.json`;
        const registryResponse = await fetch(registryUrl);
        
        if (!registryResponse.ok) {
          // 如果加载失败，尝试使用旧路径（向后兼容）
          console.warn('[Knowledge] Failed to load registry, falling back to old path');
          companyPath = `knowledge/${this.companyId}`;
        } else {
          const registry = await registryResponse.json();
          const companyInfo = registry.companies?.[this.companyId];
          
          if (!companyInfo || !companyInfo.active) {
            throw new Error(`Company ${this.companyId} not found or not active in registry`);
          }
          
          companyPath = `projects/${companyInfo.path}/knowledge`;
          console.log(`[Knowledge] Loading knowledge base for company: ${this.companyId} (path: ${companyPath})`);
        }
      } catch (error) {
        // 向后兼容：如果加载注册表失败，使用旧路径
        console.warn('[Knowledge] Error loading registry, using fallback path:', error);
        companyPath = `knowledge/${this.companyId}`;
      }
      
      // 構建完整的知識庫文件路徑
      const knowledgeBasePath = `${fetchBaseUrl}/${companyPath}`.replace(/\/$/, '');
      
      console.log('[Knowledge] Loading knowledge files from:', knowledgeBasePath);
      
      // 使用 Cloudflare Pages ASSETS 或 fetch
      const fetchFn = assets ? (url: string) => assets.fetch(url) : fetch;
      
      console.log('[Knowledge] Using', assets ? 'ASSETS.fetch' : 'global fetch');
      console.log('[Knowledge] Loading knowledge files from:', knowledgeBasePath);
      
      // 辅助函数：安全地获取文件
      const safeFetch = async (filename: string, required: boolean = true) => {
        const url = `${knowledgeBasePath}/${filename}`;
        try {
          const response = await fetchFn(url);
          if (!response.ok) {
            const msg = `Failed to fetch ${filename}: ${response.status} ${response.statusText}`;
            if (required) {
              throw new Error(msg);
            } else {
              console.warn(`[Knowledge]`, msg);
              return null;
            }
          }
          return response;
        } catch (err) {
          const msg = `Failed to fetch ${filename}: ${err}`;
          if (required) {
            throw new Error(msg);
          } else {
            console.warn(`[Knowledge]`, msg);
            return null;
          }
        }
      };
      
      // 批量加载所有文件（保持简单，不依赖配置文件）
      const [
        servicesRes,
        companyInfoRes,
        aiConfigRes,
        personasRes,
        responseTemplatesRes,
        faqDetailedRes
      ] = await Promise.all([
        safeFetch('1-services.json', false),
        safeFetch('2-company_info.json'),
        safeFetch('3-ai_config.json'),
        safeFetch('3-personas.json', false),
        safeFetch('4-response_templates.json', false),
        safeFetch('5-faq_detailed.json', false)
      ]);

      // 解析 JSON
      console.log('[Knowledge] Parsing JSON responses...');
      
      const [servicesData, companyInfoData, aiConfigData, personasData, responseTemplatesData, faqDetailedData] = await Promise.all([
        servicesRes ? servicesRes.json().catch(() => ({ services: [] })) : Promise.resolve({ services: [] }),
        companyInfoRes!.json(),
        aiConfigRes!.json(),
        personasRes ? personasRes.json().catch(() => ({ personas: [] })) : Promise.resolve({ personas: [] }),
        responseTemplatesRes ? responseTemplatesRes.json().catch(() => ({ templates: {} })) : Promise.resolve({ templates: {} }),
        faqDetailedRes ? faqDetailedRes.json().catch(() => null) : Promise.resolve(null)
      ]);

      // 載入資料
      this.services = servicesData.services || [];
      
      // 从 company_info.json 提取联系信息和政策
      this.contactInfo = {
        branches: companyInfoData.branches || [],
        contact_channels: companyInfoData.contact_channels || {
          email: '',
          ig: '',
          line: { available: false, message: '' },
          booking_link: '',
        },
        ai_response_rules: companyInfoData.ai_response_rules || {
          line_inquiry: '',
          handoff_to_human: {
            email: '',
            phone: { zhongshan: '', gongguan: '' },
            ig: '',
            booking_link: '',
          },
        },
      };
      this.policies = companyInfoData.policies || [];
      
      // 从 ai_config.json 提取意图和实体配置
      this.intentConfig = aiConfigData.intents ? {
        version: aiConfigData.version || '1.0.0',
        last_updated: aiConfigData.last_updated || '',
        data_source: aiConfigData.data_source || '',
        intents: aiConfigData.intents || [],
        fallback: aiConfigData.fallback || {
          useContextIntent: true,
          contextIntentThreshold: 10,
          defaultIntent: 'service_inquiry'
        }
      } : null;
      
      this.entityPatterns = aiConfigData.entity_patterns ? {
        version: aiConfigData.version || '1.0.0',
        last_updated: aiConfigData.last_updated || '',
        data_source: aiConfigData.data_source || '',
        patterns: aiConfigData.entity_patterns || {}
      } : null;
      
      // 从 personas.json 提取客户画像
      this.personas = personasData.personas || [];

      // 載入資料結構
      this.responseTemplates = responseTemplatesData.templates || {};
      this.faqDetailed = faqDetailedData || null;

      console.log('[Knowledge] Knowledge base loaded successfully');
      console.log(`[Knowledge] Loaded ${this.services.length} services, ${this.personas.length} personas, ${this.policies.length} policies`);
      if (this.intentConfig) {
        console.log(`[Knowledge] Loaded intent config with ${this.intentConfig.intents.length} intents`);
      }
      if (this.entityPatterns) {
        console.log('[Knowledge] Loaded entity patterns config');
      }

      this.loaded = true;
      console.log('[Knowledge] Knowledge base loaded successfully');
    } catch (error) {
      // 如果載入失敗，重置 loaded 狀態，以便下次重試
      this.loaded = false;
      console.error('[Knowledge] Failed to load knowledge base:', error);
      console.error('[Knowledge] Error details:', error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : String(error));
      throw new Error(`Failed to load knowledge base: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 取得服務資訊
   */
  getService(id: string): Service | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.services.find(s => s.id === id) || null;
  }

  /**
   * 取得所有服務
   */
  getAllServices(): Service[] {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.services;
  }

  /**
   * 取得客戶角色
   */
  getPersona(id: string): Persona | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.personas.find(p => p.id === id) || null;
  }

  /**
   * 搜尋 FAQ（關鍵字匹配）
   */
  searchFAQ(query: string): Policy[] {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    const lowerQuery = query.toLowerCase();
    const results: Array<{ policy: Policy; score: number }> = [];

    for (const policy of this.policies) {
      let score = 0;

      // 關鍵字匹配
      for (const keyword of policy.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      // 問題內容匹配
      if (policy.question.toLowerCase().includes(lowerQuery)) {
        score += 2;
      }

      // 答案內容匹配
      if (policy.answer.toLowerCase().includes(lowerQuery)) {
        score += 1;
      }

      if (score > 0) {
        results.push({ policy, score });
      }
    }

    // 按分數排序，回傳前 3 個
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.policy);
  }

  /**
   * 取得聯絡資訊
   */
  getContactInfo(): ContactInfo | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.contactInfo;
  }

  /**
   * 檢查是否已載入
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * 取得回覆模板
   * 支持两种格式：
   * 1. 对象格式：{ main_answer, supplementary_info, next_best_actions }
   * 2. 字符串格式（向后兼容）：直接是字符串
   */
  getResponseTemplate(intent: string): ResponseTemplate | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    const template = this.responseTemplates[intent];
    if (!template) {
      return null;
    }
    
    // 如果是字符串格式（向后兼容），转换为对象格式
    if (typeof template === 'string') {
      return {
        main_answer: template,
        supplementary_info: '',
        next_best_actions: []
      };
    }
    
    // 已经是对象格式，直接返回
    return template as ResponseTemplate;
  }

  /**
   * 取得服務摘要（從 services.json 生成，已移除 service_summaries.json）
   */
  getServiceSummary(serviceId: string): ServiceSummary | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    // Fallback: 從 services.json 中的服務資訊生成摘要
    const service = this.services.find(s => s.id === serviceId);
    if (!service) {
      return null;
    }
    // 返回一個簡化的摘要結構（如果需要，可以從 service 物件中提取資訊）
    return {
      core_purpose: service.one_line || '',
      price_pricing: service.price_range || '',
      shooting_time_selection: (service as any).shooting_time || '',
      delivery_speed: (service as any).delivery_time || '',
      add_ons_limitations: ((service as any).add_ons || []).join('、')
    } as ServiceSummary;
  }

  /**
   * 取得情緒模板（已移除 emotion_templates.json，返回 null）
   */
  getEmotionTemplate(emotion: string): EmotionTemplate | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    // 已移除 emotion_templates.json，返回 null
    // LLM 會自行處理情緒場景
    return null;
  }

  /**
   * 根據關鍵字搜尋情緒模板（已移除 emotion_templates.json，返回 null）
   */
  findEmotionTemplateByKeywords(message: string): EmotionTemplate | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    // 已移除 emotion_templates.json，返回 null
    // LLM 會自行處理情緒場景
    return null;
  }

  /**
   * 取得意圖對應的 Next Best Actions（已移除 intent_nba_mapping.json，使用 response_templates 作為 fallback）
   */
  getNextBestActions(intent: string): string[] {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    // Fallback: 從 response_templates 中獲取 next_best_actions
    const template = this.getResponseTemplate(intent);
    if (template && template.next_best_actions && template.next_best_actions.length > 0) {
      return template.next_best_actions;
    }
    return [];
  }

  /**
   * 取得詳細FAQ資料
   */
  getFAQDetailed(): FAQDetailed | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.faqDetailed;
  }

  /**
   * 根據類別取得FAQ問題
   */
  getFAQByCategory(category: 'booking' | 'delivery' | 'shooting' | 'other'): FAQCategory | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.faqDetailed?.categories[category] || null;
  }

  /**
   * 根據關鍵字搜尋FAQ問題（優化版）
   */
  searchFAQDetailed(query: string): FAQQuestion[] {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    if (!this.faqDetailed) {
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();
    const results: Array<{ question: FAQQuestion; score: number }> = [];

    // 如果查詢為空，返回空數組
    if (!lowerQuery) {
      return [];
    }

    // 將查詢拆分成詞彙（處理中文和英文）
    const queryWords = this.extractWords(lowerQuery);

    // 遍歷所有類別
    for (const category of Object.values(this.faqDetailed.categories)) {
      if (!category || !category.questions) continue;

      for (const question of category.questions) {
        let score = 0;
        const lowerQuestion = question.question.toLowerCase();
        const lowerAnswer = question.answer.toLowerCase();

        // 1. 精確問題匹配（最高分）
        if (lowerQuestion === lowerQuery) {
          score += 10;
        } else if (lowerQuestion.includes(lowerQuery)) {
          score += 5;
        }

        // 2. 關鍵字匹配（提高權重）
        let keywordMatches = 0;
        for (const keyword of question.keywords) {
          const lowerKeyword = keyword.toLowerCase();
          if (lowerQuery.includes(lowerKeyword)) {
            score += 3;
            keywordMatches++;
          }
          // 反向匹配：如果關鍵字包含查詢詞
          if (lowerKeyword.includes(lowerQuery) && lowerQuery.length >= 2) {
            score += 2;
          }
        }

        // 3. 詞彙匹配（提高準確性）
        let wordMatches = 0;
        for (const word of queryWords) {
          if (word.length < 2) continue; // 跳過單字符
          if (lowerQuestion.includes(word)) {
            score += 2;
            wordMatches++;
          }
          if (lowerAnswer.includes(word)) {
            score += 1;
          }
        }

        // 4. 問題開頭匹配（提高相關性）
        if (lowerQuestion.startsWith(lowerQuery.substring(0, Math.min(5, lowerQuery.length)))) {
          score += 2;
        }

        // 5. 答案內容匹配（較低權重）
        if (lowerAnswer.includes(lowerQuery)) {
          score += 1;
        }

        // 6. 匹配詞彙比例（提高準確性）
        if (queryWords.length > 0) {
          const matchRatio = wordMatches / queryWords.length;
          score += Math.round(matchRatio * 2);
        }

        // 只返回有匹配的問題
        if (score > 0) {
          results.push({ question, score });
        }
      }
    }

    // 按分數排序，回傳前 5 個
    return results
      .sort((a, b) => {
        // 先按分數排序
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // 分數相同時，優先返回問題長度較短的（更精確）
        return a.question.question.length - b.question.question.length;
      })
      .slice(0, 5)
      .map(r => r.question);
  }

  /**
   * 提取查詢中的詞彙（支援中文和英文）
   */
  private extractWords(text: string): string[] {
    const words: string[] = [];
    
    // 提取中文字符（連續的中文字符作為一個詞）
    const chineseWords = text.match(/[\u4e00-\u9fa5]+/g);
    if (chineseWords) {
      words.push(...chineseWords);
    }
    
    // 提取英文單詞
    const englishWords = text.match(/[a-z]+/g);
    if (englishWords) {
      words.push(...englishWords);
    }
    
    // 提取數字
    const numbers = text.match(/\d+/g);
    if (numbers) {
      words.push(...numbers);
    }
    
    return words;
  }

  /**
   * 根據ID取得FAQ問題
   */
  getFAQQuestionById(id: string): FAQQuestion | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    if (!this.faqDetailed) {
      return null;
    }

    for (const category of Object.values(this.faqDetailed.categories)) {
      if (!category || !category.questions) continue;
      const question = category.questions.find(q => q.id === id);
      if (question) {
        return question;
      }
    }

    return null;
  }

  /**
   * 取得意圖分類配置
   */
  getIntentConfig(): IntentConfig | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.intentConfig;
  }

  /**
   * 取得實體提取配置
   */
  getEntityPatterns(): EntityPatterns | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.entityPatterns;
  }

  /**
   * 取得狀態轉換配置（已移除 state_transitions.json，返回 null）
   */
  getStateTransitionsConfig(): StateTransitionsConfig | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    // 已移除 state_transitions.json，返回 null
    // 狀態轉換邏輯將使用默認或硬編碼的方式處理
    return null;
  }

  /**
   * 获取 FAQ 菜单（用于前端显示）
   * 返回简化的分类和问题列表
   */
  getFAQMenu(): Array<{
    category: string;
    title: string;
    questions: Array<{ id: string; question: string }>;
  }> {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    
    if (!this.faqDetailed) {
      return [];
    }
    
    const menu: Array<{
      category: string;
      title: string;
      questions: Array<{ id: string; question: string }>;
    }> = [];
    
    const categoryMap: Record<string, string> = {
      booking: '預訂相關',
      delivery: '取件相關',
      shooting: '拍攝相關',
      other: '其他'
    };
    
    for (const [key, categoryData] of Object.entries(this.faqDetailed.categories)) {
      if (categoryData && categoryData.questions && categoryData.questions.length > 0) {
        menu.push({
          category: key,
          title: categoryData.title || categoryMap[key] || key,
          questions: categoryData.questions.map((q, index) => ({
            id: q.id || `${key}-${index}`,
            question: q.question
          }))
        });
      }
    }
    
    return menu;
  }

}

