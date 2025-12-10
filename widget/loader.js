/**
 * 多租户 AI 客服 Widget 载入器
 * 支持多个公司的 chatbot service
 */
(function() {
  'use strict';
  
  // 防止重複載入
  if (window.GYChatbotLoader) {
    console.warn('[GYChatbot] Loader already initialized');
    return;
  }
  
  // 從 script tag 讀取配置
  const script = document.currentScript || 
    document.querySelector('script[data-widget-loader="gy-chatbot"]');
  
  if (!script) {
    console.error('[GYChatbot] Loader script not found');
    return;
  }
  
  // 获取公司 ID（必需）
  const companyId = script.dataset.company;
  if (!companyId) {
    console.error('[GYChatbot] Company ID is required. Please set data-company attribute.');
    console.error('[GYChatbot] Example: <script data-company="goldenyears" ...></script>');
    return;
  }
  
  // 验证公司 ID 格式
  if (!/^[a-z0-9-]{2,50}$/.test(companyId)) {
    console.error('[GYChatbot] Invalid company ID format:', companyId);
    console.error('[GYChatbot] Company ID must be 2-50 characters, lowercase letters, numbers, and hyphens only');
    return;
  }
  
  const config = {
    // 公司 ID
    companyId: companyId,
    
    // API 端點（包含公司 ID）
    apiEndpoint: script.dataset.apiEndpoint || 
      `${script.src.replace('/widget/loader.js', '')}/api/${companyId}/chat`,
    
    // API 基礎 URL
    apiBaseUrl: script.dataset.apiBaseUrl || 
      script.src.replace('/widget/loader.js', ''),
    
    // Widget 檔案位置（可配置 CDN 位置）
    widgetBaseUrl: script.dataset.widgetBaseUrl || 
      script.src.replace('/loader.js', ''),
    
    // 主題和語言
    theme: script.dataset.theme || 'light',
    locale: script.dataset.locale || 'zh-TW',
    
    // 頁面類型
    pageType: script.dataset.pageType || 'embed',
    
    // 是否自動打開（預設 false，避免干擾）
    autoOpen: script.dataset.autoOpen === 'true',
  };
  
  // 记录配置（用于调试）
  console.log(`[GYChatbot] Initializing for company: ${companyId}`);
  console.log(`[GYChatbot] API endpoint: ${config.apiEndpoint}`);
  
  // 載入 CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = `${config.widgetBaseUrl}/widget.css`;
  cssLink.onerror = () => {
    console.error('[GYChatbot] Failed to load CSS from:', cssLink.href);
  };
  document.head.appendChild(cssLink);
  
  // 載入核心 Widget JS
  const widgetScript = document.createElement('script');
  widgetScript.src = `${config.widgetBaseUrl}/widget.js`;
  widgetScript.async = true;
  widgetScript.onload = function() {
    // Widget JS 載入完成後初始化
    if (window.GYChatbot) {
      window.GYChatbot.init(config).then(() => {
        console.log(`[GYChatbot] Widget initialized successfully for ${companyId}`);
        // 如果需要自動打開
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
  
  // 標記已載入
  window.GYChatbotLoader = { config, companyId };
})();
