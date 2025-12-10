/**
 * 好時有影 AI 形象顧問 Widget
 * 前端聊天機器人介面
 */

(function () {
  'use strict';

  const GYChatbot = {
    config: {
      apiEndpoint: '/api/chat', // 可從外部配置完整 URL
      apiBaseUrl: '', // API 基礎 URL（用於 FAQ 菜單等）
      pageType: 'home',
      locale: 'zh-TW',
      theme: 'light',
      timeout: 10000, // 10 秒超時
    },

    state: {
      isOpen: false,
      isLoading: false,
      conversationId: null,
      retryCount: 0,
      maxRetries: 2,
      faqMenu: null,  // 存储FAQ菜单数据
      expandedCategory: null,  // 当前展开的分类ID
      scrollY: 0,  // 保存背景滚动位置（手机版）
      handleKeyboard: null,  // 键盘监听器（手机版）
    },

    els: {},

    /**
     * 初始化 Widget
     */
    async init(userConfig) {
      // 合併配置，確保 apiEndpoint 和 apiBaseUrl 正確設置
      this.config = { 
        ...this.config, 
        ...userConfig,
        // 確保 apiEndpoint 是完整 URL（如果提供了完整 URL）
        apiEndpoint: userConfig.apiEndpoint || this.config.apiEndpoint,
        // 確保 apiBaseUrl 有值（用於 FAQ 菜單等）
        apiBaseUrl: userConfig.apiBaseUrl || this.config.apiBaseUrl || '',
      };
      this.createDOM();
      this.bindEvents();
      // 載入 FAQ 菜單
      await this.loadFAQMenu();
      // 重新渲染菜單（如果已創建）
      if (this.els.quickActions) {
        this.els.quickActions.innerHTML = this.renderFAQMenu();
      }
    },

    /**
     * 建立 DOM 結構
     */
    createDOM() {
      const container = document.createElement('div');
      container.id = 'gy-chatbot-widget';
      container.innerHTML = `
        <button id="gy-chatbot-toggle" aria-label="打開 AI 顧問" aria-expanded="false">
          <span class="gy-chatbot-toggle-icon">💬</span>
          <span class="gy-chatbot-toggle-text">AI形象顧問</span>
        </button>
        <div id="gy-chatbot-window" aria-hidden="true" role="dialog" aria-labelledby="gy-chatbot-title" aria-modal="true">
          <div class="gy-chatbot-header">
            <div>
              <div class="gy-chatbot-title" id="gy-chatbot-title">好時有影 AI 形象顧問</div>
              <div class="gy-chatbot-subtitle">
                ${
                  this.config.pageType === 'home'
                    ? '選方案、解釋流程'
                    : '找不到答案？可以直接問我'
                }
              </div>
            </div>
            <button id="gy-chatbot-close" aria-label="關閉">✕</button>
          </div>
          <div class="gy-chatbot-body">
            <div class="gy-chatbot-message bot">
              ${
                this.config.pageType === 'home'
                  ? `嗨，我是好時有影的 AI 顧問。<br/>
                    可以幫你推薦方案、說明流程、解說價格。<br/>
                    你可以直接跟我說你的狀況，或先用下面的快速選項開始。`
                  : `找不到你要的答案嗎？<br/>
                    你可以直接問我流程、價格或預約相關的問題。<br/>
                    遇到需要真人處理的，我會提醒你。`
              }
            </div>
            <div class="gy-chatbot-quick-actions">
              ${this.renderQuickActions(this.config.pageType)}
            </div>
            <div id="gy-chatbot-messages" role="log" aria-live="polite" aria-label="對話訊息"></div>
          </div>
          <div class="gy-chatbot-input">
            <input
              id="gy-chatbot-input-field"
              type="text"
              placeholder="${
                this.config.pageType === 'home'
                  ? '直接跟我說你的狀況，例如：我是準畢業生，要拍 LinkedIn…'
                  : '你可以問任何拍攝流程、價格或預約相關問題'
              }"
              aria-label="輸入訊息"
            />
            <button id="gy-chatbot-send" aria-label="送出訊息">送出</button>
          </div>
        </div>
      `;
      
      // 檢查是否在 FAQ 頁面（內嵌模式）
      const faqContainer = document.getElementById('faq-chatbot-container');
      if (faqContainer) {
        // FAQ 頁面：插入到指定容器
        faqContainer.appendChild(container);
      } else {
        // 其他頁面：插入到 body
        document.body.appendChild(container);
      }

      this.els.container = container;
      this.els.toggle = container.querySelector('#gy-chatbot-toggle');
      this.els.window = container.querySelector('#gy-chatbot-window');
      this.els.close = container.querySelector('#gy-chatbot-close');
      this.els.messages = container.querySelector('#gy-chatbot-messages');
      this.els.quickActions = container.querySelector('.gy-chatbot-quick-actions');
      this.els.input = container.querySelector('#gy-chatbot-input-field');
      this.els.send = container.querySelector('#gy-chatbot-send');
    },

    /**
     * 獲取 API 基礎 URL
     * 使用配置的 apiBaseUrl，如果沒有則從 apiEndpoint 推導
     */
    getApiBaseUrl() {
      // 如果配置中已提供 apiBaseUrl，直接使用
      if (this.config.apiBaseUrl) {
        return this.config.apiBaseUrl;
      }
      
      // 從 apiEndpoint 推導基礎 URL
      if (this.config.apiEndpoint.startsWith('http://') || this.config.apiEndpoint.startsWith('https://')) {
        // 完整 URL，提取基礎部分
        try {
          const url = new URL(this.config.apiEndpoint);
          return `${url.protocol}//${url.host}`;
        } catch (e) {
          console.warn('[GYChatbot] Failed to parse apiEndpoint URL:', e);
          return '';
        }
      }
      
      // 相對路徑，返回空字串（使用當前域名）
      return '';
    },

    /**
     * 載入 FAQ 菜單
     */
    async loadFAQMenu() {
      try {
        const apiBaseUrl = this.getApiBaseUrl();
        const companyId = this.config.companyId;
        
        // 檢查 companyId 是否存在
        if (!companyId) {
          console.warn('[GYChatbot] Company ID not set, cannot load FAQ menu');
          return [];
        }
        
        // 構建完整的 FAQ 菜單 API URL（包含 company ID）
        const apiUrl = apiBaseUrl 
          ? `${apiBaseUrl}/api/${companyId}/faq-menu`
          : `/api/${companyId}/faq-menu`; // fallback: 相對路徑
        console.log('[GYChatbot] Loading FAQ menu from:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.state.faqMenu = data.categories || [];
        console.log('[GYChatbot] FAQ menu loaded:', this.state.faqMenu.length, 'categories');
        return this.state.faqMenu;
      } catch (error) {
        console.error('[GYChatbot] Failed to load FAQ menu:', error);
        // 如果API失敗，返回空數組，使用fallback
        return [];
      }
    },

    /**
     * 渲染 FAQ 分類菜單
     */
    renderFAQMenu() {
      if (!this.state.faqMenu || this.state.faqMenu.length === 0) {
        // 如果菜單未載入，顯示載入中或使用fallback
        return `
          <div class="gy-chatbot-faq-menu-loading">載入常見問題中...</div>
          <div class="gy-chatbot-faq-menu-fallback">
            <button class="gy-chatbot-quick-action" data-mode="faq_flow_price" data-template="我想大概了解不同拍攝的價位與計價方式。">💰 想知道價格</button>
            <button class="gy-chatbot-quick-action" data-mode="faq_flow_price" data-template="請跟我說一般拍攝的流程，大概要多久？">📷 想知道拍攝流程</button>
            <button class="gy-chatbot-quick-action" data-mode="decision_recommendation" data-template="我想請你幫我推薦適合的拍攝方案。">🧭 不知道選哪個方案</button>
          </div>
        `;
      }

      let html = '<div class="gy-chatbot-faq-menu">';
      this.state.faqMenu.forEach(category => {
        const isExpanded = this.state.expandedCategory === category.id;
        html += `
          <div class="gy-chatbot-faq-category ${isExpanded ? 'expanded' : ''}">
            <button class="gy-chatbot-faq-category-header" data-category-id="${category.id}">
              <span class="gy-chatbot-faq-category-title">${category.title}</span>
              <span class="gy-chatbot-faq-category-icon">${isExpanded ? '▼' : '▶'}</span>
            </button>
            ${isExpanded ? this.renderFAQQuestions(category.questions) : ''}
          </div>
        `;
      });
      html += '</div>';
      return html;
    },

    /**
     * 渲染 FAQ 問題列表
     */
    renderFAQQuestions(questions) {
      if (!questions || questions.length === 0) {
        return '<div class="gy-chatbot-faq-questions-empty">暫無問題</div>';
      }
      let html = '<div class="gy-chatbot-faq-questions">';
      questions.forEach(question => {
        html += `
          <button class="gy-chatbot-faq-question" data-question="${this.escapeHtml(question.question)}" data-question-id="${question.id}">
            ${this.escapeHtml(question.question)}
          </button>
        `;
      });
      html += '</div>';
      return html;
    },

    /**
     * HTML 轉義
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * 渲染快速選項按鈕（改為 FAQ 分類菜單）
     */
    renderQuickActions(pageType) {
      // 使用 FAQ 分類菜單
      return this.renderFAQMenu();
    },

    /**
     * 綁定事件
     */
    bindEvents() {
      this.els.toggle.addEventListener('click', () => {
        // 檢查是否在 FAQ 頁面（內嵌模式）
        const isFAQPage = document.querySelector('.faq-page') !== null;
        if (isFAQPage) {
          // 在 FAQ 頁面：滾動到 chatbot 位置
          const chatbotWindow = document.getElementById('gy-chatbot-window');
          if (chatbotWindow) {
            chatbotWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 確保 chatbot 是開啟狀態
            if (!this.state.isOpen) {
              this.open();
            }
            // 聚焦到輸入框
            setTimeout(() => {
              if (this.els.input) {
                this.els.input.focus();
              }
            }, 500);
          }
        } else {
          // 其他頁面：正常打開浮動視窗
          this.open();
        }
      });
      this.els.close.addEventListener('click', () => this.close());

      this.els.quickActions.addEventListener('click', (e) => {
        // ⚠️ 防止重複點擊：如果正在處理中，忽略新的點擊
        if (this.state.isLoading) {
          console.warn('[GYChatbot] Already processing a message, ignoring click');
          return;
        }

        // 處理分類展開/收合
        if (e.target.classList.contains('gy-chatbot-faq-category-header') || 
            e.target.closest('.gy-chatbot-faq-category-header')) {
          const header = e.target.closest('.gy-chatbot-faq-category-header') || e.target;
          const categoryId = header.getAttribute('data-category-id');
          this.toggleFAQCategory(categoryId);
          return;
        }

        // 處理問題點擊
        if (e.target.classList.contains('gy-chatbot-faq-question')) {
          const question = e.target.getAttribute('data-question');
          this.sendMessage(question, 'auto', 'menu');
          return;
        }

        // 處理舊的快速選項按鈕（fallback）
        if (e.target.classList.contains('gy-chatbot-quick-action')) {
          const mode = e.target.getAttribute('data-mode');
          const template = e.target.getAttribute('data-template');
          this.sendMessage(template, mode, 'menu');
        }
      });

      this.els.send.addEventListener('click', () => {
        const text = this.els.input.value.trim();
        if (!text) return;
        this.sendMessage(text, 'auto', 'input');
        this.els.input.value = '';
      });

      // 處理中文輸入法：使用 compositionend 事件檢測輸入完成
      let isComposing = false;
      this.els.input.addEventListener('compositionstart', () => {
        isComposing = true;
      });
      this.els.input.addEventListener('compositionend', () => {
        isComposing = false;
      });

      this.els.input.addEventListener('keydown', (e) => {
        // 如果是 Enter 鍵且不在輸入法組合狀態中，才發送
        if (e.key === 'Enter' && !isComposing) {
          e.preventDefault();
          const text = this.els.input.value.trim();
          if (text) {
            this.sendMessage(text, 'auto', 'input');
            this.els.input.value = '';
          }
        }
        // Escape 鍵關閉聊天窗
        if (e.key === 'Escape' && this.state.isOpen) {
          this.close();
        }
      });

      // 鍵盤導航支援
      this.els.toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // 檢查是否在 FAQ 頁面（內嵌模式）
          const isFAQPage = document.querySelector('.faq-page') !== null;
          if (isFAQPage) {
            // 在 FAQ 頁面：滾動到 chatbot 位置
            const chatbotWindow = document.getElementById('gy-chatbot-window');
            if (chatbotWindow) {
              chatbotWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // 確保 chatbot 是開啟狀態
              if (!this.state.isOpen) {
                this.open();
              }
              // 聚焦到輸入框
              setTimeout(() => {
                if (this.els.input) {
                  this.els.input.focus();
                }
              }, 500);
            }
          } else {
            // 其他頁面：正常打開浮動視窗
            this.open();
          }
        }
      });
    },

    /**
     * 開啟聊天窗
     */
    open() {
      // 確保元素存在
      if (!this.els.window || !this.els.toggle) {
        console.warn('[GYChatbot] Cannot open: elements not ready');
        return;
      }

      this.state.isOpen = true;
      this.els.window.setAttribute('aria-hidden', 'false');
      this.els.toggle.setAttribute('aria-expanded', 'true');
      // 文字顯示/隱藏由 CSS 根據 aria-expanded 屬性控制
      
      // 檢查是否在 FAQ 頁面（內嵌模式）
      const isFAQPage = document.querySelector('.faq-page') !== null;
      if (!isFAQPage) {
        // 非 FAQ 頁面：使用浮動視窗的動畫
        this.els.window.classList.add('open');
        // 強制觸發重排，確保 CSS 過渡動畫生效
        this.els.window.offsetHeight;
      } else {
        // FAQ 頁面：內嵌模式，不需要動畫類別
        // 但確保 window 是顯示的
        this.els.window.style.display = 'flex';
      }
      
      // 阻止背景滚动（只在手机版，除了 FAQ 頁面內嵌模式）
      if (!isFAQPage && window.innerWidth <= 480) {
        this.lockBackgroundScroll();
        // 手机版：額外處理鍵盤
        this.setupKeyboardHandling();
      }
      
      // 焦點移到輸入框
      setTimeout(() => {
        if (this.els.input) {
          this.els.input.focus();
        }
      }, 100);
    },

    /**
     * 關閉聊天窗
     */
    close() {
      this.state.isOpen = false;
      this.els.window.classList.remove('open');
      this.els.window.classList.remove('keyboard-open');
      this.els.window.setAttribute('aria-hidden', 'true');
      this.els.toggle.setAttribute('aria-expanded', 'false');
      // 文字顯示/隱藏由 CSS 根據 aria-expanded 屬性控制
      
      // 恢复背景滚动（只在手机版，除了 FAQ 頁面內嵌模式）
      const isFAQPage = document.querySelector('.faq-page') !== null;
      if (!isFAQPage && window.innerWidth <= 480) {
        this.unlockBackgroundScroll();
        // 手机版：移除鍵盤處理
        this.removeKeyboardHandling();
      }
      
      // 焦點回到 toggle 按鈕
      this.els.toggle.focus();
    },

    /**
     * 锁定背景滚动（手机版）
     */
    lockBackgroundScroll() {
      // 保存当前滚动位置
      this.state.scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // 添加锁定类
      document.body.classList.add('chatbot-open');
      document.body.style.top = `-${this.state.scrollY}px`;
    },

    /**
     * 解锁背景滚动（手机版）
     */
    unlockBackgroundScroll() {
      // 移除锁定类
      document.body.classList.remove('chatbot-open');
      const scrollY = document.body.style.top;
      document.body.style.top = '';
      
      // 恢复滚动位置
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      } else if (this.state.scrollY) {
        window.scrollTo(0, this.state.scrollY);
      }
      
      this.state.scrollY = 0;
    },

    /**
     * 设置键盘处理（手机版）
     */
    setupKeyboardHandling() {
      // 使用 Visual Viewport API 检测键盘
      if (window.visualViewport) {
        this.handleKeyboard = () => {
          const viewport = window.visualViewport;
          const keyboardHeight = window.innerHeight - viewport.height;
          
          if (keyboardHeight > 150) {
            // 键盘弹出
            this.els.window.classList.add('keyboard-open');
            // 滚动输入框到可见区域
            setTimeout(() => {
              if (this.els.input) {
                this.els.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          } else {
            // 键盘收起
            this.els.window.classList.remove('keyboard-open');
          }
        };
        
        window.visualViewport.addEventListener('resize', this.handleKeyboard);
      }
      
      // 监听输入框焦点（备用方案）
      if (this.els.input) {
        this.handleInputFocus = () => {
          setTimeout(() => {
            if (this.els.input) {
              this.els.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              this.els.window.classList.add('keyboard-open');
            }
          }, 300); // 等待键盘动画
        };
        
        this.handleInputBlur = () => {
          // 延迟移除，避免键盘收起动画时的闪烁
          setTimeout(() => {
            this.els.window.classList.remove('keyboard-open');
          }, 200);
        };
        
        this.els.input.addEventListener('focus', this.handleInputFocus);
        this.els.input.addEventListener('blur', this.handleInputBlur);
      }
    },

    /**
     * 移除键盘处理（手机版）
     */
    removeKeyboardHandling() {
      // 移除 Visual Viewport 监听
      if (window.visualViewport && this.handleKeyboard) {
        window.visualViewport.removeEventListener('resize', this.handleKeyboard);
        this.handleKeyboard = null;
      }
      
      // 移除输入框监听
      if (this.els.input) {
        if (this.handleInputFocus) {
          this.els.input.removeEventListener('focus', this.handleInputFocus);
          this.handleInputFocus = null;
        }
        if (this.handleInputBlur) {
          this.els.input.removeEventListener('blur', this.handleInputBlur);
          this.handleInputBlur = null;
        }
      }
    },

    /**
     * 將 Markdown 轉換為 HTML
     * 支援：粗体 (**text**)、链接 ([text](url))、换行、列表
     */
    markdownToHTML(text) {
      if (!text) return '';
      
      let html = String(text);
      
      // 檢查是否已經包含 HTML 標籤（如 <br/>、<br>）
      const hasHTMLTags = /<[^>]+>/.test(html);
      
      // 轉義現有的 HTML 標籤（防止 XSS，但保留我們要處理的格式）
      // 先標記我們要處理的特殊格式，避免被轉義
      const placeholders = {
        boldTriple: [],
        boldDouble: [],
        links: [],
        existingHTML: []
      };
      
      // 如果已經包含 HTML 標籤，先暫時替換它們
      if (hasHTMLTags) {
        html = html.replace(/<br\s*\/?>/gi, (match) => {
          const id = `__HTML_BR_${placeholders.existingHTML.length}__`;
          placeholders.existingHTML.push('<br>');
          return id;
        });
      }
      
      // 暫時替換粗體標記（三顆星）
      html = html.replace(/\*\*\*([^*]+)\*\*\*/g, (match, content) => {
        const id = `__BOLD_TRIPLE_${placeholders.boldTriple.length}__`;
        placeholders.boldTriple.push(content);
        return id;
      });
      
      // 暫時替換粗體標記（兩顆星）
      html = html.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
        const id = `__BOLD_DOUBLE_${placeholders.boldDouble.length}__`;
        placeholders.boldDouble.push(content);
        return id;
      });
      
      // 暫時替換連結
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        const id = `__LINK_${placeholders.links.length}__`;
        placeholders.links.push({ text: linkText, url: url.trim() });
        return id;
      });
      
      // 轉義 HTML（防止 XSS）
      const tempDiv = document.createElement('div');
      tempDiv.textContent = html;
      html = tempDiv.innerHTML;
      
      // 恢復已存在的 HTML 標籤
      placeholders.existingHTML.forEach((tag, index) => {
        html = html.replace(`__HTML_BR_${index}__`, tag);
      });
      
      // 恢復粗體（三顆星）
      placeholders.boldTriple.forEach((content, index) => {
        html = html.replace(`__BOLD_TRIPLE_${index}__`, `<strong>${content}</strong>`);
      });
      
      // 恢復粗體（兩顆星）
      placeholders.boldDouble.forEach((content, index) => {
        html = html.replace(`__BOLD_DOUBLE_${index}__`, `<strong>${content}</strong>`);
      });
      
      // 恢復連結
      placeholders.links.forEach((link, index) => {
        let actualUrl = link.url;
        
        // 處理描述性連結文字（例如："link to 方案頁面"）
        const urlLower = actualUrl.toLowerCase();
        
        // 檢查是否為描述性文字
        if (urlLower.includes('link to') || urlLower.includes('link to ')) {
          // 移除 "link to" 前綴並提取關鍵字
          const cleanUrl = actualUrl.replace(/^link to /i, '').trim();
          const cleanUrlLower = cleanUrl.toLowerCase();
          
          if (cleanUrlLower.includes('方案') || cleanUrlLower.includes('plan') || cleanUrlLower.includes('拍攝') || cleanUrlLower.includes('價格') || cleanUrlLower.includes('price')) {
            actualUrl = '/price-list';
          } else if (cleanUrlLower.includes('預約') || cleanUrlLower.includes('booking')) {
            actualUrl = '/booking/';
          } else if (cleanUrlLower.includes('中山') || cleanUrlLower.includes('zhongshan')) {
            actualUrl = '/booking/zhongshan';
          } else if (cleanUrlLower.includes('公館') || cleanUrlLower.includes('gongguan')) {
            actualUrl = '/booking/gongguan';
          } else {
            actualUrl = '#'; // 預設為空連結
          }
        }
        // 直接包含關鍵字的情況
        else if (urlLower.includes('方案') || urlLower.includes('plan') || urlLower.includes('拍攝方案') || urlLower.includes('價格') || urlLower.includes('price')) {
          actualUrl = '/price-list';
        } else if (urlLower.includes('預約') || urlLower.includes('booking')) {
          actualUrl = '/booking/';
        } else if (urlLower.includes('中山') || urlLower.includes('zhongshan')) {
          actualUrl = '/booking/zhongshan';
        } else if (urlLower.includes('公館') || urlLower.includes('gongguan')) {
          actualUrl = '/booking/gongguan';
        }
        // 如果不是完整 URL 且不是相對路徑
        else if (!actualUrl.startsWith('http://') && !actualUrl.startsWith('https://') && !actualUrl.startsWith('/') && !actualUrl.startsWith('#')) {
          actualUrl = '#'; // 預設為空連結
        }
        
        // 在同一窗口打開連結（不使用 target="_blank"）
        html = html.replace(`__LINK_${index}__`, `<a href="${actualUrl}">${link.text}</a>`);
      });
      
      // 處理換行：\n 轉換為 <br>
      html = html.replace(/\n/g, '<br>');
      
      // 處理列表（按行處理）
      const lines = html.split('<br>');
      const processedLines = [];
      let inOrderedList = false;
      let inUnorderedList = false;
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // 有序列表：1. text
        if (/^\d+\.\s+/.test(trimmedLine)) {
          const content = trimmedLine.replace(/^\d+\.\s+/, '');
          if (!inOrderedList) {
            processedLines.push('<ol>');
            inOrderedList = true;
            if (inUnorderedList) {
              processedLines.push('</ul>');
              inUnorderedList = false;
            }
          }
          processedLines.push(`<li>${content}</li>`);
        }
        // 無序列表：- text 或 * text
        else if (/^[-*]\s+/.test(trimmedLine)) {
          const content = trimmedLine.replace(/^[-*]\s+/, '');
          if (!inUnorderedList) {
            processedLines.push('<ul>');
            inUnorderedList = true;
            if (inOrderedList) {
              processedLines.push('</ol>');
              inOrderedList = false;
            }
          }
          processedLines.push(`<li>${content}</li>`);
        }
        // 普通行
        else {
          if (inOrderedList) {
            processedLines.push('</ol>');
            inOrderedList = false;
          }
          if (inUnorderedList) {
            processedLines.push('</ul>');
            inUnorderedList = false;
          }
          if (trimmedLine) {
            processedLines.push(trimmedLine);
          } else if (index < lines.length - 1) {
            // 空行保留為 <br>
            processedLines.push('<br>');
          }
        }
      });
      
      // 關閉未關閉的列表
      if (inOrderedList) {
        processedLines.push('</ol>');
      }
      if (inUnorderedList) {
        processedLines.push('</ul>');
      }
      
      return processedLines.join('');
    },

    /**
     * 新增訊息到對話區
     */
    appendMessage(text, role) {
      const div = document.createElement('div');
      div.className = `gy-chatbot-message ${role}`;
      
      // Bot 訊息：轉換 Markdown 為 HTML
      if (role === 'bot') {
        div.innerHTML = this.markdownToHTML(text);
      } else {
        // 使用者訊息：純文字（防止 XSS）
        div.textContent = text;
      }
      
      this.els.messages.appendChild(div);
      // 滾動到底部
      this.els.messages.scrollTop = this.els.messages.scrollHeight;
    },

    /**
     * 顯示載入狀態
     */
    showLoading() {
      // 如果已經有載入指示器，不重複創建
      if (this.els.messages.querySelector('#gy-chatbot-loading')) {
        return;
      }
      this.state.isLoading = true;
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'gy-chatbot-message bot gy-chatbot-loading';
      loadingDiv.id = 'gy-chatbot-loading';
      loadingDiv.innerHTML = '<span class="gy-chatbot-loading-dot"></span><span class="gy-chatbot-loading-dot"></span><span class="gy-chatbot-loading-dot"></span>';
      this.els.messages.appendChild(loadingDiv);
      this.els.messages.scrollTop = this.els.messages.scrollHeight;
    },

    /**
     * 隱藏載入狀態
     */
    hideLoading() {
      this.state.isLoading = false;
      const loading = this.els.messages.querySelector('#gy-chatbot-loading');
      if (loading) {
        loading.remove();
      }
    },

    /**
     * 切換 FAQ 分類展開/收合
     */
    toggleFAQCategory(categoryId) {
      if (this.state.expandedCategory === categoryId) {
        // 收合
        this.state.expandedCategory = null;
      } else {
        // 展開
        this.state.expandedCategory = categoryId;
      }
      // 重新渲染菜單
      if (this.els.quickActions) {
        this.els.quickActions.innerHTML = this.renderFAQMenu();
      }
    },

    /**
     * 發送訊息
     */
    async sendMessage(message, mode = 'auto', source = 'input') {
      // ⚠️ 防止重複發送：如果正在載入中，忽略新的請求
      if (this.state.isLoading) {
        console.warn('[GYChatbot] Message already being processed, ignoring duplicate request');
        return;
      }

      // 顯示使用者訊息
      this.appendMessage(message, 'user');
      this.hideLoading();
      this.showLoading();
      this.state.isLoading = true; // 設置載入狀態

      // 隱藏快速選項（第一次發送後）
      if (this.els.quickActions.style.display !== 'none') {
        this.els.quickActions.style.display = 'none';
      }

      // 設定超時
      const timeoutId = setTimeout(() => {
        if (this.state.isLoading) {
          this.hideLoading();
          this.state.isLoading = false; // 清除載入狀態
          this.appendMessage('這次回覆花的時間有點久，我怕系統卡住了。你可以重新提問一次，或直接用 Email 或電話找真人協助。', 'bot');
          this.state.retryCount = 0;
        }
      }, this.config.timeout);

      try {
        // 使用配置的 apiEndpoint（已經是完整 URL 或相對路徑）
        // 如果是相對路徑且需要完整 URL，則添加基礎 URL
        let apiUrl = this.config.apiEndpoint;
        if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
          // 相對路徑，需要添加基礎 URL
          const apiBaseUrl = this.getApiBaseUrl();
          apiUrl = apiBaseUrl ? `${apiBaseUrl}${apiUrl}` : apiUrl;
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            source,  // 添加 source 字段
            mode,
            pageType: this.config.pageType,
            conversationId: this.state.conversationId,
          }),
        });

        clearTimeout(timeoutId);

        // ⚠️ 重要：即使狀態碼不是 200，也要處理響應（503 等錯誤也會有 JSON 響應）
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          // 如果無法解析 JSON，拋出原始錯誤
          throw new Error(`HTTP error! status: ${response.status}, unable to parse response`);
        }

        // 更新 conversationId
        if (data.conversationId) {
          this.state.conversationId = data.conversationId;
        }

        // 顯示 AI 回覆
        this.hideLoading();
        this.state.isLoading = false; // 清除載入狀態
        this.appendMessage(data.reply, 'bot');

        // 顯示快速回覆建議（如果有）
        if (data.suggestedQuickReplies && data.suggestedQuickReplies.length > 0) {
          this.showQuickReplies(data.suggestedQuickReplies);
        }

        // 重置重試計數
        this.state.retryCount = 0;
      } catch (error) {
        clearTimeout(timeoutId);
        this.hideLoading();
        this.state.isLoading = false; // 清除載入狀態

        // 重試機制
        if (this.state.retryCount < this.state.maxRetries) {
          this.state.retryCount++;
          this.appendMessage('網路連線似乎有問題，讓我再試一次...', 'bot');
          setTimeout(() => {
            // ⚠️ 重要：重試時必須保留 source 參數，並重置 isLoading 狀態
            this.state.isLoading = false; // 允許重試
            this.sendMessage(message, mode, source);
          }, 1000);
        } else {
          this.appendMessage('糟糕，後台系統現在有點忙碌，我暫時拿不到正確的資訊 😣 你可以過幾分鐘再試一次，或直接透過 Email 或電話聯絡我們的真人夥伴。', 'bot');
          this.state.retryCount = 0;
        }
      }
    },

    /**
     * 顯示快速回覆建議
     */
    showQuickReplies(replies) {
      const quickRepliesDiv = document.createElement('div');
      quickRepliesDiv.className = 'gy-chatbot-quick-replies';
      replies.forEach((reply) => {
        const button = document.createElement('button');
        button.className = 'gy-chatbot-quick-reply';
        button.textContent = reply;
        button.addEventListener('click', () => {
          this.sendMessage(reply, 'auto', 'input');
          quickRepliesDiv.remove();
        });
        quickRepliesDiv.appendChild(button);
      });
      this.els.messages.appendChild(quickRepliesDiv);
      this.els.messages.scrollTop = this.els.messages.scrollHeight;
    },
  };

  // 導出到全域
  window.GYChatbot = GYChatbot;
})();

