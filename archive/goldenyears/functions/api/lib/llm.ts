/**
 * LLM 服務封裝（Cloudflare Pages Functions 版本）
 * 整合 Google Gemini API
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { KnowledgeBase, Service, Persona } from './knowledge.js';

export interface ConversationContext {
  last_intent?: string;
  slots?: {
    service_type?: string;
    use_case?: string;
    persona?: string;
  };
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface GenerateReplyParams {
  message: string;
  intent: string;
  entities: Record<string, any>;
  context: ConversationContext;
  mode: 'auto' | 'decision_recommendation' | 'faq_flow_price';
  knowledgeBase?: any; // KnowledgeBase 实例，用于获取价格等信息
}

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    // 使用 gemini-2.0-flash（已验证可用，性能更好）
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * 生成回覆
   */
  async generateReply(params: GenerateReplyParams): Promise<string> {
    const { message, intent, entities, context, mode, knowledgeBase } = params;
 
    // 構建 System Prompt（傳入用戶訊息以便檢查情緒）
    const systemPrompt = this.buildSystemPrompt(mode, intent, entities, context, knowledgeBase, message);

    // 構建用戶訊息
    const userMessage = this.buildUserMessage(message, context);

    try {
      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + userMessage }],
          },
        ],
      });

      const response = result.response;
      const rawReply = response.text();
      const cleanedReply = this.cleanReply(rawReply);
      return cleanedReply;
    } catch (error) {
      console.error('[LLM Error]', error);
      throw new Error(`Failed to generate reply: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 構建 System Prompt
   */
  private buildSystemPrompt(
    mode: string,
    intent: string,
    entities: Record<string, any>,
    context: ConversationContext,
    knowledgeBase?: any,
    userMessage?: string
  ): string {
    let prompt = `你是「好時有影」攝影工作室的 AI 形象顧問，負責協助客戶選擇拍攝方案、說明流程與價格。

## 品牌定位
- 溫暖、專業、真誠、簡單
- 語氣：朋友 + 顧問的混搭風格
- 不推銷、不承諾無法達成的價格、不給不確定資訊

## 關鍵約束（必須嚴格遵守）
1. **禁止編造服務**：**嚴禁編造任何不存在的服務或服務項目**。只能使用知識庫中實際存在的服務。若知識庫沒有相關資料，禁止自己猜測或引用外部資訊。**只有在知識庫真的沒有相關資料時，才建議聯絡真人**。
2. **禁止編造聯絡資訊**：**嚴禁編造任何地址、電話、營業時間、停車場名稱等聯絡資訊**。只能使用知識庫中提供的聯絡資訊。若知識庫中沒有具體資訊（如具體停車場名稱），只能使用知識庫中的描述，絕對不能自行搜尋或編造外部資訊。
3. **價格必須出自 JSON**：所有價格數字皆須出自 JSON/FAQ，不得憑空估算。若找不到價格資訊，請說明「實際金額以現場與當季公告為準」，並提供預約連結讓客戶自行查詢。
4. **政策類問題強制從 FAQ 回答**：政策類問題（價格、取消、隱私、授權）必須從 FAQ/JSON 回答，禁止 LLM 獨立生成。若 FAQ 沒找到，才建議聯絡真人。
5. **投訴處理使用模板**：投訴處理（complaint intent）必須使用嚴格模板，不允許自行決定補償方案。所有補償決策都落在真人客服。
6. **減少轉真人選項**：盡量用知識庫回答問題，不要輕易建議轉真人。只有在以下情況才建議轉真人：
   - 知識庫真的沒有相關資料
   - 客戶明確要求找真人
   - 企業/團體報價等需要客製化的服務
7. **服務項目限制**：只能推薦知識庫中實際存在的服務。若客戶詢問不存在的服務（例如：寶寶寫真、抓周、孕婦寫真等），必須明確說明「我們目前沒有提供這個服務」，並引導客戶選擇現有的服務項目。
8. **禁止編造促銷與優惠**：**嚴禁編造任何促銷活動、優惠方案、贈品或額外服務**。
   - 禁止自行推測或編造任何「多送」、「加贈」、「額外提供」等優惠
   - 只能使用知識庫中明確記載的促銷資訊（如學生優惠）
   - 若知識庫中沒有相關促銷資訊，必須明確說明「目前沒有這個優惠」
   - **絕對不能因為「精緻」、「高級」等形容詞就自行推測會有額外優惠**

## 輸出格式要求（嚴格遵守）
1. **禁止輸出 JSON 格式**：絕對不要輸出任何 JSON 內容，包括：
   - 不要輸出 {"key": "value"} 這類物件文字
   - 不要輸出包含多層的大括號或中括號結構
   - 不要輸出任何類似程式碼或資料結構的內容（例如以 { 開頭、以 } 結尾的大段文字）
2. **禁止輸出程式碼區塊**：不要輸出任何程式碼區塊或標示（例如以三個反引號標記的區塊），所有內容都必須是自然語言。
3. **只輸出自然語言**：所有回覆必須是自然的中文句子，直接回答客戶問題，不要出現 JSON、物件、陣列或欄位名稱等技術細節。
4. **模板資料僅供參考**：下面提供的回覆模板、服務摘要與其他資料，僅供你理解與參考，請用自己的話重寫成自然語言，不要原封不動貼上，也不要轉成 JSON。
5. **禁止輸出原始資料**：不要把原始 JSON、ID、欄位名稱、鍵值對等直接給客戶，只能輸出客戶看得懂的自然語言說明。

## 回覆格式要求（嚴格遵守三段式結構）
每次回覆必須採用三段式結構，讓客戶獲得「足夠資訊」而無需反覆詢問：

1. **主回答（main_answer）**：
   - 直接回答客戶問題，清楚、完整、不冗長
   - 優先使用知識庫中的 response_template 或 service_summary
   - 如果知識庫有對應的模板，必須使用模板中的 main_answer
   - 語氣：溫暖、透明、不中推銷，一律使用「您」

2. **補充資訊（supplementary_info）**：
   - 只補充最關鍵、最常被追問的 1-2 點細節
   - 使用知識庫中的 supplementary_info
   - 不要長篇大論，保持簡潔

3. **智慧預測選單（next_best_actions）**：
   - 提供 2-4 個常見下一步選項
   - 使用知識庫中的 intent_nba_mapping 或 response_template 中的 next_best_actions
   - 這些選項會自動顯示為快速回覆按鈕

**重要**：如果知識庫中有對應的 response_template，必須優先使用模板內容，不要自行發揮。

## 當前模式
${this.getModeDescription(mode)}

## 當前意圖
${this.getIntentDescription(intent)}

## 已提取的實體
${this.formatEntities(entities)}

## 對話上下文
${this.formatContext(context)}
`;

    // 加入實際存在的服務列表（防止編造不存在的服務）
    if (knowledgeBase) {
      try {
        const services = knowledgeBase.getAllServices();
        if (services && services.length > 0) {
          prompt += `\n## 實際存在的服務項目（只能推薦以下服務，嚴禁編造其他服務）
`;
          services.forEach(service => {
            prompt += `- ${service.name}（${service.id}）：${service.one_line}\n`;
          });
          prompt += `\n**重要**：若客戶詢問上述列表以外的服務（例如：寶寶寫真、抓周、孕婦寫真等），必須明確說明「我們目前沒有提供這個服務」，並引導客戶選擇上述實際存在的服務項目。\n`;
        }
      } catch (error) {
        console.error('[LLM] Failed to get services from knowledge base:', error);
      }
    }

    // 加入回覆模板（如果有的話）
    if (knowledgeBase) {
      try {
        const responseTemplate = knowledgeBase.getResponseTemplate(intent);
        if (responseTemplate) {
          prompt += `\n## 回覆模板（必須優先使用）
**主回答（範例）**：${responseTemplate.main_answer}
**補充資訊（範例）**：${responseTemplate.supplementary_info || '無'}
**智慧選單（範例）**：${responseTemplate.next_best_actions.join('、')}

**重要**：上述內容是「範例模板」，只供你理解語氣與重點。你必須：
- 用自然語言重新表達，不要原樣貼上
- 不要把這些資料轉成 JSON 或程式碼格式
- 不要輸出任何欄位名稱或結構，只輸出給客戶看的自然語言回覆。
`;
        }
      } catch (error) {
        console.error('[LLM] Failed to get response template from knowledge base:', error);
      }
    }

    // 檢查是否有情緒模板
    if (knowledgeBase && userMessage) {
      try {
        const emotionTemplate = knowledgeBase.findEmotionTemplateByKeywords(userMessage);
        if (emotionTemplate) {
          prompt += `\n## 情緒場景模板（偵測到 ${emotionTemplate.emotion}）
**溫暖安撫**：${emotionTemplate.warm_comfort}
**協助說明**：${emotionTemplate.assistance_explanation}
**智慧選單**：${emotionTemplate.next_best_actions.join('、')}

**重要**：你必須使用上述情緒模板的內容，優先展現同理心和協助意願。
`;
        }
      } catch (error) {
        console.error('[LLM] Failed to get emotion template from knowledge base:', error);
      }
    }

    // 如果是價格詢問，加入價格資訊
    if (intent === 'price_inquiry' && knowledgeBase) {
      try {
        const services = knowledgeBase.getAllServices();
        if (services && services.length > 0) {
          prompt += `\n## 價格資訊（必須使用以下資料）
`;
          services.forEach(service => {
            prompt += `- ${service.name}：${service.price_range}（${service.pricing_model}）\n`;
          });
        }
      } catch (error) {
        console.error('[LLM] Failed to get services from knowledge base:', error);
      }
    }

    // 如果有服務類型，加入服務摘要
    if (entities.service_type && knowledgeBase) {
      try {
        const serviceSummary = knowledgeBase.getServiceSummary(entities.service_type);
        if (serviceSummary) {
          prompt += `\n## 服務摘要（${entities.service_type}）
**核心用途（說明用）**：${serviceSummary.core_purpose}
**價格與計費（說明用）**：${serviceSummary.price_pricing}
**拍攝時長/挑圖（說明用）**：${serviceSummary.shooting_time_selection}
**交件速度（說明用）**：${serviceSummary.delivery_speed}
**常見加購/限制（說明用）**：${serviceSummary.add_ons_limitations}

**重要**：上述內容是給你參考用的摘要，請：
- 用自然語言整理給客戶聽，不要原封不動貼上
- 不要輸出任何內部欄位名稱或技術細節
- 嚴禁以 JSON 或程式碼格式輸出，只能輸出自然語言。
`;
        }
      } catch (error) {
        console.error('[LLM] Failed to get service summary from knowledge base:', error);
      }
    }

    // 取得聯絡資訊（地址、電話等）- 所有意圖都需要
    let bookingLink = '/booking/';
    let contactInfo: any = null;
    if (knowledgeBase) {
      try {
        contactInfo = knowledgeBase.getContactInfo();
        if (contactInfo && contactInfo.contact_channels.booking_link) {
          bookingLink = contactInfo.contact_channels.booking_link;
        }
      } catch (error) {
        console.error('[LLM] Failed to get contact info from knowledge base:', error);
      }
    }

    // 如果是地址/地點詢問，加入詳細地址資訊
    if (intent === 'location_inquiry' && contactInfo) {
      prompt += `\n## 分店地址資訊（必須使用以下資料，嚴禁編造）
`;
      contactInfo.branches.forEach((branch: any) => {
        prompt += `- ${branch.name}：
  - 地址：${branch.address}（${branch.address_note}）
  - 電話：${branch.phone}
  - 營業時間：${branch.hours.weekday}（${branch.hours.note}）
  - 停車資訊：${branch.parking.available ? branch.parking.locations.join('、') : '無停車場'}。${branch.parking.recommendation || ''}
`;
      });
      prompt += `\n**重要**：必須使用上述地址資訊回答，嚴禁編造任何地址。若客戶詢問特定分店，請提供該分店的完整資訊。\n`;
      prompt += `\n**嚴格禁止編造停車場資訊**：
- 嚴禁編造任何停車場名稱（如 Times、嘟嘟房、台灣聯通等）
- 只能使用上述提供的停車資訊（斜對面有停車場、水源市場地下室等）
- 如果知識庫中沒有具體停車場名稱，只能說「附近有停車場」或使用知識庫中的描述
- 絕對不能自行搜尋、推測或編造外部停車場資訊
- 如果客戶詢問具體停車場名稱，而知識庫中沒有，請誠實說明「我們沒有具體的停車場名稱資訊，但附近有停車場可以使用」
`;
    } else if (contactInfo) {
      // 其他意圖也加入基本聯絡資訊，防止編造
      prompt += `\n## 聯絡資訊（僅供參考，回答地址相關問題時必須使用）
`;
      contactInfo.branches.forEach((branch: any) => {
        prompt += `- ${branch.name}：${branch.address}（${branch.address_note}），電話：${branch.phone}\n`;
      });
      prompt += `\n**重要**：若客戶詢問地址、地點、分店等問題，必須使用上述地址資訊，嚴禁編造。\n`;
    }

    // 如果是預約詢問，加入預約連結資訊
    if (intent === 'booking_inquiry') {
      prompt += `\n## 預約連結資訊
預約頁面連結：${bookingLink}
`;
    }

    // 根據意圖調整回應要求
    if (intent === 'location_inquiry') {
      prompt += `\n## 回應要求（地址/地點詢問）
- **直接回答地址資訊，使用上面提供的分店地址資料**
- 如果客戶沒有指定分店，可以列出所有分店資訊
- 如果客戶指定了分店（中山或公館），只回答該分店的資訊
- 可以補充交通資訊（捷運站、停車場等），但停車場資訊必須嚴格使用上述提供的資料，嚴禁編造
- 結尾可提供「想知道價格」或「如何預約」的選項
- **嚴禁編造地址**，只能使用上面提供的地址資訊
- **連結文字規範**：
  - 預約連結請使用「線上預約」：[線上預約](${bookingLink})
  - 方案/價格連結請使用「方案與價目表」：[方案與價目表](/price-list)
`;
    } else if (intent === 'price_inquiry') {
      prompt += `\n## 回應要求（價格詢問）
- **直接回答價格資訊，不要繞彎或先問用途**
- 使用上面提供的價格資訊回答
- 明確說明計價方式（按張計費、低消等）
- 若上下文已有 service_type，直接給該服務的價格
- 若沒有明確服務類型，列出主要服務的價格範圍
- 結尾可提供「想了解更多」或「如何預約」的選項
- **連結文字規範**：
  - 預約連結請使用「線上預約」：[線上預約](${bookingLink})
  - 方案/價格連結請使用「方案與價目表」：[方案與價目表](/price-list)
`;
    } else if (intent === 'booking_inquiry') {
      prompt += `\n## 回應要求（預約詢問）- 嚴格遵守
**第一優先級：必須在第一句話就提供預約連結**

1. **回答結構（必須遵守）**：
   - 第一句話：直接提供預約連結，格式：「你可以透過我們的[線上預約](${bookingLink})選擇拍攝項目和時段。」
   - 第二句話（可選）：簡短的鼓勵或說明，例如：「預約完成後會收到確認信，裡面有詳細資訊。」
   - **嚴禁**在第一句話之前講任何政策、流程、改期、取消等內容
   - **嚴禁**在提供預約連結之前講任何其他內容

2. **預約連結格式（必須使用）**：
   - 連結文字必須是「線上預約」
   - 連結地址：${bookingLink}
   - 格式：[線上預約](${bookingLink})

3. **禁止行為**：
   - ❌ 禁止先講改期、取消政策
   - ❌ 禁止先講預約流程細節
   - ❌ 禁止先講遲到、費用等政策
   - ❌ 禁止長篇大論
   - ✅ 只有在客戶明確問到「改期」或「取消」時，才詳細說明相關政策

4. **標準回答範例**：
   「你可以透過我們的[線上預約](${bookingLink})選擇拍攝項目和時段。預約完成後會收到確認信，裡面有詳細資訊。如果有任何問題，隨時告訴我 😊」

5. **結尾選項**：
   - 可提供「想知道價格」或「拍攝流程」的選項
   - 不要提供「如何預約」選項（因為已經在回答預約了）

**重要**：如果客戶問「如何預約」，回答的第一句話必須是預約連結，不能有任何其他內容在前面。
`;
    } else {
      prompt += `\n## 回應要求
- 回覆要溫暖、專業、真誠
- 每次回覆不只回答問題，還要「給一個下一步選項」
- 優先協助釐清目的（用途），再談方案與價格
- 若資訊不足，追問關鍵 1-3 題
- 結尾提供 CTA（預約 / 看方案 / 問下一題）
- **不要輕易建議轉真人**，盡量用知識庫回答。只有在知識庫真的沒有資料時才建議轉真人
- **連結文字規範**：
  - 預約連結請使用「線上預約」：[線上預約](${bookingLink})
  - 方案/價格連結請使用「方案與價目表」：[方案與價目表](/price-list)
`;
    }

    return prompt;
  }

  /**
   * 清理回覆內容，移除 JSON / 程式碼等非自然語言片段
   */
  private cleanReply(reply: string): string {
    if (!reply) return '';

    let cleaned = reply;

    // 1. 移除 ```json ... ``` 或任何 ``` ... ``` 代碼區塊
    cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '');
    cleaned = cleaned.replace(/```[\s\S]*?```/gi, '');

    // 2. 移除包含 response_template 或 service_summary 的 JSON 物件片段
    cleaned = cleaned.replace(/\{[^{}]*"response_template"[\s\S]*?\}/gi, '');
    cleaned = cleaned.replace(/\{[^{}]*"service_summary"[\s\S]*?\}/gi, '');

    // 3. 移除可能包含上述欄位的陣列片段
    cleaned = cleaned.replace(/\[[^\]]*"response_template"[^\]]*\]/gi, '');
    cleaned = cleaned.replace(/\[[^\]]*"service_summary"[^\]]*\]/gi, '');

    // 4. 移除看起來像純資料結構的大段 JSON（保守處理，僅在行中幾乎全是 { 或 } 時移除）
    cleaned = cleaned
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        // 如果一行幾乎都是大括號或中括號，視為資料結構行，移除
        if (/^[{}\[\],":0-9\s]+$/.test(trimmed)) {
          return false;
        }
        return true;
      })
      .join('\n');

    // 5. 合併多餘空行
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 6. 最後修剪首尾空白
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * 構建用戶訊息
   */
  private buildUserMessage(message: string, context: ConversationContext): string {
    let userMessage = `使用者訊息：${message}`;

    if (context.history && context.history.length > 0) {
      userMessage += '\n\n對話歷史：';
      context.history.slice(-3).forEach(msg => {
        userMessage += `\n${msg.role === 'user' ? '使用者' : 'AI'}：${msg.content}`;
      });
    }

    return userMessage;
  }

  private getModeDescription(mode: string): string {
    const descriptions: Record<string, string> = {
      auto: '自動模式：根據使用者訊息自動判斷處理方式',
      decision_recommendation: '方案推薦模式：協助使用者選擇適合的拍攝方案',
      faq_flow_price: 'FAQ 流程與價格模式：回答流程、價格、政策相關問題',
    };
    return descriptions[mode] || mode;
  }

  private getIntentDescription(intent: string): string {
    const descriptions: Record<string, string> = {
      greeting: '打招呼',
      service_inquiry: '服務諮詢',
      price_inquiry: '價格詢問',
      booking_inquiry: '預約相關',
      location_inquiry: '地址/地點詢問',
      delivery_inquiry: '交件時間詢問',
      comparison: '方案比較',
      complaint: '抱怨/投訴',
      handoff_to_human: '轉真人',
      goodbye: '結束對話',
    };
    return descriptions[intent] || intent;
  }

  private formatEntities(entities: Record<string, any>): string {
    if (Object.keys(entities).length === 0) {
      return '無';
    }
    return JSON.stringify(entities, null, 2);
  }

  private formatContext(context: ConversationContext): string {
    const parts: string[] = [];
    if (context.last_intent) {
      parts.push(`上次意圖：${context.last_intent}`);
    }
    if (context.slots && Object.keys(context.slots).length > 0) {
      parts.push(`已收集資訊：${JSON.stringify(context.slots)}`);
    }
    return parts.length > 0 ? parts.join('\n') : '無';
  }
}

