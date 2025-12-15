/**
 * 回應模板
 * 包含投訴處理、轉真人等標準化回應模板
 */

import { KnowledgeBase } from './knowledge.js';

// 注意：這個函數需要 knowledgeBase 實例，但在模板中無法直接訪問
// 解決方案：在調用時傳入 knowledgeBase 實例，或使用全局單例
// 這裡先使用簡化版本，實際使用時需要傳入 knowledgeBase

let knowledgeBaseInstance: KnowledgeBase | null = null;

export function setKnowledgeBase(kb: KnowledgeBase) {
  knowledgeBaseInstance = kb;
}

/**
 * 投訴處理模板
 */
export function getComplaintTemplate(): string {
  try {
  const contactInfo = knowledgeBaseInstance?.getContactInfo();
  if (!contactInfo) {
    return '非常抱歉讓你遇到這樣的情況。請聯絡我們的真人夥伴協助處理。';
  }

  const { email, phone, ig } = contactInfo.ai_response_rules.handoff_to_human;

  return `非常抱歉讓你遇到這樣的情況，我完全理解你的感受。為了能更準確地協助你，我建議你直接聯絡我們的真人夥伴，他們會立即處理並提供最適合的解決方案。

聯絡方式：
- Email：${email}
- 電話：中山店 ${phone.zhongshan} / 公館店 ${phone.gongguan}
- IG：${ig}

我們會盡快回覆並協助你解決問題。

**重要提醒：所有補償決策都由真人客服處理，以確保公平與準確。**`;
  } catch (error) {
    return '非常抱歉讓你遇到這樣的情況。請聯絡我們的真人夥伴協助處理。';
  }
}

/**
 * 轉真人模板
 */
export function getHandoffTemplate(reason?: string): string {
  const contactInfo = knowledgeBaseInstance?.getContactInfo();
  if (!contactInfo) {
    return '建議你透過 Email 或電話聯絡我們的真人夥伴。';
  }

  const { email, phone, ig, booking_link } = contactInfo.ai_response_rules.handoff_to_human;

  let message = '這類問題比較適合由真人夥伴來協助，會比較精準、也更貼近你的狀況 🙏\n\n建議你可以透過以下方式聯絡我們：\n';
  message += `- Email：${email}\n`;
  message += `- 電話：中山店 ${phone.zhongshan} / 公館店 ${phone.gongguan}\n`;
  message += `- IG：${ig}\n`;
  message += `- 預約連結：${booking_link}`;

  if (reason) {
    message += `\n\n原因：${reason}`;
  }

  return message;
}

/**
 * 無法理解模板（第一次）
 */
export function getDontUnderstandFirst(): string {
  return '抱歉，我沒有完全理解你的問題 🥺 方便再多跟我說一點嗎？你可以這樣描述，例如：我是學生，想拍履歷照；或是我們家想拍全家福。';
}

/**
 * 無法理解模板（第二次）
 */
export function getDontUnderstandSecond(): string {
  const contactInfo = knowledgeBaseInstance?.getContactInfo();
  if (!contactInfo) {
    return '我還是沒有很確定你的需求，怕誤會了反而幫不上忙。比較重要或緊急的狀況，會建議你直接聯絡真人夥伴。';
  }

  const { email, phone } = contactInfo.ai_response_rules.handoff_to_human;

  return `我還是沒有很確定你的需求，怕誤會了反而幫不上忙。比較重要或緊急的狀況，會建議你直接聯絡真人夥伴：Email（${email}）或電話（中山店 ${phone.zhongshan} / 公館店 ${phone.gongguan}）。`;
}

/**
 * API 錯誤模板
 */
export function getApiErrorTemplate(): string {
  try {
  const contactInfo = knowledgeBaseInstance?.getContactInfo();
  if (!contactInfo) {
    return '糟糕，後台系統現在有點忙碌，我暫時拿不到正確的資訊 😣 你可以過幾分鐘再試一次，或直接透過 Email 或電話聯絡我們的真人夥伴。';
  }

  const { email, phone } = contactInfo.ai_response_rules.handoff_to_human;

  return `糟糕，後台系統現在有點忙碌，我暫時拿不到正確的資訊 😣 你可以過幾分鐘再試一次，或直接透過 Email（${email}）或電話（中山店 ${phone.zhongshan} / 公館店 ${phone.gongguan}）聯絡我們的真人夥伴。`;
  } catch (error) {
    // 如果知识库未加载，返回默认错误消息
    return '糟糕，後台系統現在有點忙碌，我暫時拿不到正確的資訊 😣 你可以過幾分鐘再試一次，或直接透過 Email 或電話聯絡我們的真人夥伴。';
  }
}

/**
 * Timeout 模板
 */
export function getTimeoutTemplate(): string {
  const contactInfo = knowledgeBaseInstance?.getContactInfo();
  if (!contactInfo) {
    return '這次回覆花的時間有點久，我怕系統卡住了。你可以重新提問一次，或直接用 Email 或電話找真人協助。';
  }

  const { email, phone } = contactInfo.ai_response_rules.handoff_to_human;

  return `這次回覆花的時間有點久，我怕系統卡住了。你可以重新提問一次，或直接用 Email（${email}）或電話（中山店 ${phone.zhongshan} / 公館店 ${phone.gongguan}）找真人協助。`;
}

/**
 * Line 官方帳號回應模板
 */
export function getLineInquiryTemplate(): string {
  const contactInfo = knowledgeBaseInstance?.getContactInfo();
  if (!contactInfo) {
    return '我們目前沒有提供 Line 官方帳號服務，如有需要可以透過 Email 或電話聯絡我們。';
  }

  return contactInfo.ai_response_rules.line_inquiry;
}

