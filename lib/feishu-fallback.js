/**
 * 飞书消息降级策略
 * 基于 EvoMap Capsule: sha256:8ee18eac8610ef9ecb60d1392bc0b8eb2dd7057f119cb3ea8a2336bbc78f22b3
 * 
 * 降级链：富文本 → 互动卡片 → 纯文本
 * 自动检测格式错误并重试
 */

const { fetchWithRetry } = require('./http-retry');

// 配置
const FEISHU_CONFIG = {
  baseUrl: 'https://open.feishu.cn/open-apis',
  retryableErrors: ['FeishuFormatError', 'markdown_render_failed', 'card_send_rejected']
};

/**
 * 发送富文本消息
 */
async function sendRichText(token, chatId, content) {
  const url = `${FEISHU_CONFIG.baseUrl}/im/v1/messages`;
  
  const body = {
    receive_id: chatId,
    receive_id_type: 'open_id',
    msg_type: 'interactive',
    content: JSON.stringify({
      config: {
        wide_screen_mode: true
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: content
          }
        }
      ]
    })
  };
  
  try {
    const result = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (result.code !== 0) {
      throw new Error(`Feishu API Error: ${result.msg}`);
    }
    
    return { success: true, data: result };
    
  } catch (error) {
    // 检测是否是格式错误
    if (error.message.includes('markdown') || 
        error.message.includes('render') ||
        error.message.includes('invalid')) {
      error.isFormatError = true;
    }
    throw error;
  }
}

/**
 * 发送互动卡片消息
 */
async function sendCard(token, chatId, cardContent) {
  const url = `${FEISHU_CONFIG.baseUrl}/im/v1/messages`;
  
  const body = {
    receive_id: chatId,
    receive_id_type: 'open_id',
    msg_type: 'interactive',
    content: JSON.stringify(cardContent)
  };
  
  try {
    const result = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (result.code !== 0) {
      throw new Error(`Feishu API Error: ${result.msg}`);
    }
    
    return { success: true, data: result };
    
  } catch (error) {
    if (error.message.includes('card') || 
        error.message.includes('schema') ||
        error.message.includes('rejected')) {
      error.isFormatError = true;
    }
    throw error;
  }
}

/**
 * 发送纯文本消息
 */
async function sendText(token, chatId, text) {
  const url = `${FEISHU_CONFIG.baseUrl}/im/v1/messages`;
  
  const body = {
    receive_id: chatId,
    receive_id_type: 'open_id',
    msg_type: 'text',
    content: JSON.stringify({
      text: text
    })
  };
  
  const result = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (result.code !== 0) {
    throw new Error(`Feishu API Error: ${result.msg}`);
  }
  
  return { success: true, data: result };
}

/**
 * 智能发送消息（带降级链）
 * @param {string} token - 飞书 Token
 * @param {string} chatId - 聊天 ID
 * @param {string|object} content - 消息内容
 * @param {object} options - 选项
 * @returns {Promise<object>} 发送结果
 */
async function sendMessage(token, chatId, content, options = {}) {
  const { enableFallback = true, logErrors = true } = options;
  
  // 尝试 1: 富文本/互动卡片
  if (typeof content === 'object' && content.elements) {
    try {
      if (logErrors) console.log('[Feishu] 尝试发送互动卡片...');
      return await sendCard(token, chatId, content);
    } catch (error) {
      if (logErrors) console.log(`[Feishu] 卡片发送失败：${error.message}`);
      
      if (!enableFallback || !error.isFormatError) {
        throw error;
      }
    }
  }
  
  // 尝试 2: 富文本（Markdown）
  if (typeof content === 'string') {
    try {
      if (logErrors) console.log('[Feishu] 尝试发送富文本...');
      return await sendRichText(token, chatId, content);
    } catch (error) {
      if (logErrors) console.log(`[Feishu] 富文本发送失败：${error.message}`);
      
      if (!enableFallback || !error.isFormatError) {
        throw error;
      }
      
      // 降级到纯文本
      if (logErrors) console.log('[Feishu] 降级到纯文本...');
      const plainText = content
        .replace(/[#*_~`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
      return await sendText(token, chatId, plainText);
    }
  }
  
  // 尝试 3: 纯文本（最终降级）
  if (logErrors) console.log('[Feishu] 使用纯文本发送...');
  const plainText = typeof content === 'string' ? content : JSON.stringify(content);
  return await sendText(token, chatId, plainText);
}

module.exports = {
  sendMessage,
  sendRichText,
  sendCard,
  sendText,
  FEISHU_CONFIG
};
