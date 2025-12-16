// public/widget/widget.js
// Widget 加载器 - 纯 JavaScript，供客户嵌入

(function() {
  'use strict';
  
  // 从 window.smartBotConfig 读取配置，或从 script 标签的 data 属性读取
  const script = document.currentScript || 
    document.querySelector('script[data-widget="smartbot"]');
  
  const config = window.smartBotConfig || {
    companyId: script?.dataset?.companyId || script?.dataset?.company,
    themeColor: script?.dataset?.themeColor || '#667eea',
    apiBaseUrl: script?.dataset?.apiBaseUrl || 
      script?.src?.replace('/widget/widget.js', '') || 
      'https://chatbot-service-9qg.pages.dev',
    autoOpen: script?.dataset?.autoOpen === 'true',
  };
  
  if (!config.companyId) {
    console.error('[SmartBot] companyId is required');
    return;
  }
  
  // Widget 状态
  let isOpen = false;
  let iframe = null;
  let button = null;
  
  // 创建浮动按钮
  function createButton() {
    button = document.createElement('div');
    button.id = 'smartbot-button';
    button.innerHTML = '💬';
    button.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${config.themeColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2147483647;
      transition: transform 0.2s;
      user-select: none;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('click', toggleWidget);
    document.body.appendChild(button);
  }
  
  // 创建 Iframe
  function createIframe() {
    iframe = document.createElement('iframe');
    iframe.id = 'smartbot-iframe';
    iframe.src = `${config.apiBaseUrl}/widget/chat?company=${config.companyId}&theme=${encodeURIComponent(config.themeColor)}`;
    iframe.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 380px;
      height: 600px;
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 120px);
      border: none;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      z-index: 2147483646;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
    `;
    
    document.body.appendChild(iframe);
    
    // 监听来自 iframe 的消息（用于关闭等操作）
    window.addEventListener('message', handleMessage);
  }
  
  // 处理来自 iframe 的消息
  function handleMessage(event) {
    // 安全检查：确保消息来自我们的域名
    if (!event.origin.includes(config.apiBaseUrl.replace('https://', '').split('/')[0])) {
      return;
    }
    
    if (event.data.type === 'smartbot-close') {
      closeWidget();
    } else if (event.data.type === 'smartbot-ready') {
      // Iframe 加载完成
      if (config.autoOpen) {
        openWidget();
      }
    }
  }
  
  // 切换 Widget 显示/隐藏
  function toggleWidget() {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }
  
  // 打开 Widget
  function openWidget() {
    if (!iframe) {
      createIframe();
    }
    
    isOpen = true;
    iframe.style.opacity = '1';
    iframe.style.transform = 'translateY(0) scale(1)';
    iframe.style.pointerEvents = 'auto';
    
    // 更新按钮状态
    if (button) {
      button.style.transform = 'scale(0.9)';
    }
  }
  
  // 关闭 Widget
  function closeWidget() {
    if (!iframe) return;
    
    isOpen = false;
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(20px) scale(0.95)';
    iframe.style.pointerEvents = 'none';
    
    // 恢复按钮状态
    if (button) {
      button.style.transform = 'scale(1)';
    }
  }
  
  // 暴露 API 到 window 对象（可选，供客户程序化调用）
  window.SmartBot = {
    open: openWidget,
    close: closeWidget,
    toggle: toggleWidget,
    isOpen: () => isOpen,
  };
  
  // 初始化
  createButton();
  
  // 如果配置了自动打开，等待一小段时间后打开
  if (config.autoOpen) {
    setTimeout(() => {
      createIframe();
    }, 1000);
  }
})();

