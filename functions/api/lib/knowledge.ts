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
  private serviceSummaries: Record<string, ServiceSummary> = {};
  private emotionTemplates: Record<string, EmotionTemplate> = {};
  private intentNBAMapping: Record<string, string[]> = {};
  private faqDetailed: FAQDetailed | null = null;
  private intentConfig: IntentConfig | null = null;
  private entityPatterns: EntityPatterns | null = null;
  private stateTransitionsConfig: StateTransitionsConfig | null = null;
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
      
      // 多租户：使用公司特定的知识库路径
      const knowledgePath = `/knowledge/${this.companyId}/`;
      console.log(`[Knowledge] Loading knowledge base for company: ${this.companyId}`);
      
      // 確保 baseUrl 不以 / 結尾（因為路徑已經包含 /）
      if (fetchBaseUrl && fetchBaseUrl.endsWith('/')) {
        fetchBaseUrl = fetchBaseUrl.slice(0, -1);
      }
      
      // 構建完整的知識庫文件路徑（多租户）
      const knowledgeBasePath = `${fetchBaseUrl}${knowledgePath}`.replace(/\/$/, '');
      
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
      
      // 批量加载所有文件（使用队列避免连接限制）
      const [
        servicesRes,
        personasRes,
        policiesRes,
        contactInfoRes
      ] = await Promise.all([
        safeFetch('services.json'),
        safeFetch('personas.json'),
        safeFetch('policies.json'),
        safeFetch('contact_info.json')
      ]);
      
      const [
        intentConfigRes,
        entityPatternsRes,
        stateTransitionsConfigRes,
        faqDetailedRes
      ] = await Promise.all([
        safeFetch('intent_config.json', false),
        safeFetch('entity_patterns.json', false),
        safeFetch('state_transitions.json', false),
        safeFetch('faq_detailed.json', false)
      ]);
      
      const [
        responseTemplatesRes,
        serviceSummariesRes,
        emotionTemplatesRes,
        intentNBAMappingRes
      ] = await Promise.all([
        safeFetch('response_templates.json', false),
        safeFetch('service_summaries.json', false),
        safeFetch('emotion_templates.json', false),
        safeFetch('intent_nba_mapping.json', false)
      ]);

      // 解析 JSON
      console.log('[Knowledge] Parsing JSON responses...');
      
      const [servicesData, personasData, policiesData, contactInfoData] = await Promise.all([
        servicesRes!.json(),
        personasRes!.json(),
        policiesRes!.json(),
        contactInfoRes!.json()
      ]);
      
      const [intentConfigData, entityPatternsData, stateTransitionsConfigData, faqDetailedData] = await Promise.all([
        intentConfigRes ? intentConfigRes.json().catch(() => null) : Promise.resolve(null),
        entityPatternsRes ? entityPatternsRes.json().catch(() => null) : Promise.resolve(null),
        stateTransitionsConfigRes ? stateTransitionsConfigRes.json().catch(() => null) : Promise.resolve(null),
        faqDetailedRes ? faqDetailedRes.json().catch(() => null) : Promise.resolve(null)
      ]);
      
      const [responseTemplatesData, serviceSummariesData, emotionTemplatesData, intentNBAMappingData] = await Promise.all([
        responseTemplatesRes ? responseTemplatesRes.json().catch(() => ({ templates: {} })) : Promise.resolve({ templates: {} }),
        serviceSummariesRes ? serviceSummariesRes.json().catch(() => ({ summaries: {} })) : Promise.resolve({ summaries: {} }),
        emotionTemplatesRes ? emotionTemplatesRes.json().catch(() => ({ templates: {} })) : Promise.resolve({ templates: {} }),
        intentNBAMappingRes ? intentNBAMappingRes.json().catch(() => ({ mappings: {} })) : Promise.resolve({ mappings: {} })
      ]);

      // 載入資料
      this.services = servicesData.services || [];
      this.personas = personasData.personas || [];
      this.policies = policiesData.policies || [];
      
      this.contactInfo = {
        branches: contactInfoData.branches || [],
        contact_channels: contactInfoData.contact_channels || {
          email: '',
          ig: '',
          line: { available: false, message: '' },
          booking_link: '',
        },
        ai_response_rules: contactInfoData.ai_response_rules || {
          line_inquiry: '',
          handoff_to_human: {
            email: '',
            phone: { zhongshan: '', gongguan: '' },
            ig: '',
            booking_link: '',
          },
        },
      };

      // 載入新的資料結構
      this.responseTemplates = responseTemplatesData.templates || {};
      this.serviceSummaries = serviceSummariesData.summaries || {};
      this.emotionTemplates = emotionTemplatesData.templates || {};
      this.intentNBAMapping = intentNBAMappingData.mappings || {};
      this.faqDetailed = faqDetailedData || null;
      this.intentConfig = intentConfigData || null;
      this.entityPatterns = entityPatternsData || null;
      this.stateTransitionsConfig = stateTransitionsConfigData || null;

      console.log('[Knowledge] Knowledge base loaded successfully');
      console.log(`[Knowledge] Loaded ${this.services.length} services, ${this.personas.length} personas, ${this.policies.length} policies`);
      if (this.intentConfig) {
        console.log(`[Knowledge] Loaded intent config with ${this.intentConfig.intents.length} intents`);
      }
      if (this.entityPatterns) {
        console.log('[Knowledge] Loaded entity patterns config');
      }
      if (this.stateTransitionsConfig) {
        console.log(`[Knowledge] Loaded state transitions config with ${this.stateTransitionsConfig.states.length} states`);
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
   */
  getResponseTemplate(intent: string): ResponseTemplate | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.responseTemplates[intent] || null;
  }

  /**
   * 取得服務摘要
   */
  getServiceSummary(serviceId: string): ServiceSummary | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.serviceSummaries[serviceId] || null;
  }

  /**
   * 取得情緒模板
   */
  getEmotionTemplate(emotion: string): EmotionTemplate | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.emotionTemplates[emotion] || null;
  }

  /**
   * 根據關鍵字搜尋情緒模板
   */
  findEmotionTemplateByKeywords(message: string): EmotionTemplate | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    const lowerMessage = message.toLowerCase();
    
    for (const template of Object.values(this.emotionTemplates)) {
      if (template.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
        return template;
      }
    }
    return null;
  }

  /**
   * 取得意圖對應的 Next Best Actions
   */
  getNextBestActions(intent: string): string[] {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.intentNBAMapping[intent] || [];
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
   * 取得狀態轉換配置
   */
  getStateTransitionsConfig(): StateTransitionsConfig | null {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.stateTransitionsConfig;
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

