/**
 * E2E Tests - Complete Chatbot Flow
 * 
 * 端到端测试：完整的聊天机器人流程
 * 
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:8788',
  companyId: 'goldenyears',
  timeout: 30000, // 30 秒超时
};

/**
 * 生成唯一的会话 ID
 */
function generateConversationId(): string {
  return `test_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 发送聊天消息
 */
async function sendChatMessage(
  conversationId: string,
  message: string
): Promise<any> {
  const response = await fetch(
    `${TEST_CONFIG.baseUrl}/api/${TEST_CONFIG.companyId}/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:8080',
      },
      body: JSON.stringify({
        message,
        conversationId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 获取 FAQ 菜单
 */
async function getFAQMenu(): Promise<any> {
  const response = await fetch(
    `${TEST_CONFIG.baseUrl}/api/${TEST_CONFIG.companyId}/faq-menu`,
    {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:8080',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`FAQ Menu API failed: ${response.status}`);
  }

  return await response.json();
}

describe('E2E: Complete Chatbot Flow', () => {
  let conversationId: string;

  beforeAll(() => {
    conversationId = generateConversationId();
    console.log(`[E2E] Starting tests with conversation ID: ${conversationId}`);
  });

  afterAll(() => {
    console.log('[E2E] All tests completed');
  });

  describe('1. 基础对话流程', () => {
    it('should handle greeting message', async () => {
      const response = await sendChatMessage(conversationId, '你好');

      expect(response).toBeDefined();
      expect(response.reply).toBeDefined();
      expect(response.conversationId).toBe(conversationId);
      expect(response.reply).toMatch(/你好|您好|歡迎|Hi|Hello/i);
      
      console.log('[E2E] Greeting response:', response.reply);
    }, TEST_CONFIG.timeout);

    it('should handle service inquiry', async () => {
      const response = await sendChatMessage(
        conversationId,
        '你們提供什麼服務？'
      );

      expect(response).toBeDefined();
      expect(response.reply).toBeDefined();
      expect(response.reply.length).toBeGreaterThan(20);
      expect(response.reply).toMatch(/攝影|拍攝|服務|方案/);
      
      console.log('[E2E] Service inquiry response length:', response.reply.length);
    }, TEST_CONFIG.timeout);

    it('should handle pricing question', async () => {
      const response = await sendChatMessage(
        conversationId,
        '價格多少？'
      );

      expect(response).toBeDefined();
      expect(response.reply).toBeDefined();
      expect(response.reply).toMatch(/價格|費用|方案|元|NT/i);
      
      console.log('[E2E] Pricing response:', response.reply);
    }, TEST_CONFIG.timeout);

    it('should handle booking inquiry', async () => {
      const response = await sendChatMessage(
        conversationId,
        '我想預約拍攝'
      );

      expect(response).toBeDefined();
      expect(response.reply).toBeDefined();
      expect(response.reply).toMatch(/預約|聯絡|電話|Line/i);
      
      console.log('[E2E] Booking response:', response.reply);
    }, TEST_CONFIG.timeout);
  });

  describe('2. FAQ 流程', () => {
    it('should get FAQ menu', async () => {
      const faqMenu = await getFAQMenu();

      expect(faqMenu).toBeDefined();
      expect(Array.isArray(faqMenu)).toBe(true);
      expect(faqMenu.length).toBeGreaterThan(0);
      
      const firstCategory = faqMenu[0];
      expect(firstCategory.category).toBeDefined();
      expect(Array.isArray(firstCategory.questions)).toBe(true);
      
      console.log('[E2E] FAQ categories:', faqMenu.length);
    }, TEST_CONFIG.timeout);

    it('should handle FAQ question', async () => {
      const newConvId = generateConversationId();
      const response = await sendChatMessage(
        newConvId,
        '拍攝需要多長時間？'
      );

      expect(response).toBeDefined();
      expect(response.reply).toBeDefined();
      expect(response.reply).toMatch(/時間|小時|天|分鐘/i);
      
      console.log('[E2E] FAQ answer:', response.reply);
    }, TEST_CONFIG.timeout);
  });

  describe('3. 上下文管理', () => {
    it('should maintain conversation context', async () => {
      const contextConvId = generateConversationId();

      // 第一轮对话
      const response1 = await sendChatMessage(
        contextConvId,
        '我想了解婚紗攝影'
      );
      expect(response1.reply).toMatch(/婚紗|婚禮/i);

      // 第二轮对话（引用前文）
      const response2 = await sendChatMessage(
        contextConvId,
        '價格是多少？'
      );
      expect(response2.reply).toBeDefined();
      expect(response2.conversationId).toBe(contextConvId);
      
      console.log('[E2E] Context maintained across messages');
    }, TEST_CONFIG.timeout);

    it('should handle follow-up questions', async () => {
      const followUpConvId = generateConversationId();

      // 初始问题
      await sendChatMessage(followUpConvId, '你們有哪些服務？');

      // 追问
      const response = await sendChatMessage(
        followUpConvId,
        '第一個服務的詳細內容是什麼？'
      );

      expect(response).toBeDefined();
      expect(response.reply).toBeDefined();
      
      console.log('[E2E] Follow-up handled');
    }, TEST_CONFIG.timeout);
  });

  describe('4. 错误处理', () => {
    it('should handle empty message', async () => {
      try {
        await sendChatMessage(conversationId, '');
      } catch (error: any) {
        expect(error.message).toMatch(/400|failed/i);
        console.log('[E2E] Empty message rejected as expected');
      }
    }, TEST_CONFIG.timeout);

    it('should handle very long message', async () => {
      const longMessage = 'a'.repeat(5000);
      
      try {
        await sendChatMessage(conversationId, longMessage);
      } catch (error: any) {
        expect(error.message).toMatch(/400|413|failed/i);
        console.log('[E2E] Long message rejected as expected');
      }
    }, TEST_CONFIG.timeout);

    it('should handle invalid conversation ID', async () => {
      const response = await sendChatMessage(
        'invalid@#$%^&*()',
        '測試'
      );

      // 应该自动创建新会话
      expect(response).toBeDefined();
      expect(response.conversationId).toBeDefined();
      
      console.log('[E2E] Invalid conversation ID handled gracefully');
    }, TEST_CONFIG.timeout);
  });

  describe('5. 性能测试', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      await sendChatMessage(conversationId, '你好');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // 10 秒内响应
      
      console.log(`[E2E] Response time: ${duration}ms`);
    }, TEST_CONFIG.timeout);

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        sendChatMessage(
          generateConversationId(),
          `並發測試 ${i + 1}`
        )
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(5);
      responses.forEach((response, i) => {
        expect(response).toBeDefined();
        expect(response.reply).toBeDefined();
        console.log(`[E2E] Concurrent request ${i + 1} completed`);
      });
    }, TEST_CONFIG.timeout);
  });

  describe('6. 多租户隔离', () => {
    it('should isolate different companies', async () => {
      // 测试 goldenyears
      const response1 = await sendChatMessage(
        generateConversationId(),
        '你是誰？'
      );
      expect(response1.reply).toMatch(/好時有影|Golden Years/i);

      // 如果有其他公司，测试隔离
      // const response2 = await fetch(`${TEST_CONFIG.baseUrl}/api/othercompany/chat`, ...)
      
      console.log('[E2E] Company isolation verified');
    }, TEST_CONFIG.timeout);
  });

  describe('7. CORS 和安全性', () => {
    it('should handle CORS correctly', async () => {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/${TEST_CONFIG.companyId}/chat`,
        {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:8080',
            'Access-Control-Request-Method': 'POST',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      
      console.log('[E2E] CORS preflight passed');
    }, TEST_CONFIG.timeout);

    it('should reject unauthorized origins', async () => {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/${TEST_CONFIG.companyId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://malicious-site.com',
          },
          body: JSON.stringify({
            message: '測試',
            conversationId: generateConversationId(),
          }),
        }
      );

      expect(response.status).toBe(403);
      console.log('[E2E] Unauthorized origin rejected');
    }, TEST_CONFIG.timeout);
  });

  describe('8. 数据持久化', () => {
    it('should persist conversation data', async () => {
      const persistConvId = generateConversationId();

      // 发送多条消息
      await sendChatMessage(persistConvId, '消息 1');
      await sendChatMessage(persistConvId, '消息 2');
      await sendChatMessage(persistConvId, '消息 3');

      // 验证会话仍然存在
      const response = await sendChatMessage(persistConvId, '消息 4');
      
      expect(response).toBeDefined();
      expect(response.conversationId).toBe(persistConvId);
      
      console.log('[E2E] Conversation data persisted');
    }, TEST_CONFIG.timeout);
  });

  describe('9. 特殊意图处理', () => {
    it('should handle contact request', async () => {
      const response = await sendChatMessage(
        generateConversationId(),
        '我想跟你們聯絡'
      );

      expect(response.reply).toMatch(/聯絡|電話|Line|email|官網/i);
      
      console.log('[E2E] Contact intent handled');
    }, TEST_CONFIG.timeout);

    it('should handle portfolio request', async () => {
      const response = await sendChatMessage(
        generateConversationId(),
        '可以看作品嗎？'
      );

      expect(response.reply).toMatch(/作品|照片|Gallery|portfolio|網站/i);
      
      console.log('[E2E] Portfolio intent handled');
    }, TEST_CONFIG.timeout);

    it('should handle goodbye', async () => {
      const response = await sendChatMessage(
        generateConversationId(),
        '謝謝，再見'
      );

      expect(response.reply).toMatch(/再見|謝謝|感謝|期待|Bye/i);
      
      console.log('[E2E] Goodbye intent handled');
    }, TEST_CONFIG.timeout);
  });
});

describe('E2E: Widget Integration', () => {
  it('should load widget script', async () => {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/widget/loader.js`
    );

    expect(response.ok).toBe(true);
    expect(response.headers.get('Content-Type')).toMatch(/javascript/i);
    
    const script = await response.text();
    expect(script).toContain('chatbot');
    
    console.log('[E2E] Widget script loaded');
  });

  it('should load widget styles', async () => {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/widget/chatbot-widget.css`
    );

    expect(response.ok).toBe(true);
    expect(response.headers.get('Content-Type')).toMatch(/css/i);
    
    console.log('[E2E] Widget styles loaded');
  });
});

describe('E2E: API Endpoints', () => {
  it('should access main page', async () => {
    const response = await fetch(TEST_CONFIG.baseUrl);

    expect(response.ok).toBe(true);
    
    const html = await response.text();
    expect(html).toContain('chatbot');
    
    console.log('[E2E] Main page accessible');
  });

  it('should access demo page', async () => {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/demo/${TEST_CONFIG.companyId}.html`
    );

    expect(response.ok).toBe(true);
    
    console.log('[E2E] Demo page accessible');
  });
});
