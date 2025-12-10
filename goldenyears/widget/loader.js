/**
 * 好時有影 AI 客服 Widget 載入器
 * 獨立部署在 CDN，可嵌入任何網站
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
  
  const config = {
    // API 端點（必需）
    apiEndpoint: script.dataset.apiEndpoint || '',
    
    // API 基礎 URL（用於 FAQ 菜單）
    apiBaseUrl: script.dataset.apiBaseUrl || 
      (script.dataset.apiEndpoint ? script.dataset.apiEndpoint.replace('/api/chat', '') : ''),
    
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
  
  // 驗證必需配置
  if (!config.apiEndpoint) {
    console.error('[GYChatbot] apiEndpoint is required. Please set data-api-endpoint attribute.');
    return;
  }
  
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
        console.log('[GYChatbot] Widget initialized successfully');
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
  window.GYChatbotLoader = { config };
})();

