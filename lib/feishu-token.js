/**
 * 飞书 Tenant Access Token 自动管理
 * 自动刷新 Token，保持长期有效
 */

const fs = require('fs');
const path = require('path');
const { fetchWithRetry } = require('./http-retry');

// 配置
const TOKEN_FILE = path.join(__dirname, 'feishu-token.json');

// 从环境变量读取（推荐）
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';

/**
 * 获取 Tenant Access Token
 */
async function getTenantToken() {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('缺少 FEISHU_APP_ID 或 FEISHU_APP_SECRET 环境变量');
  }
  
  const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
  
  const result = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET
    })
  });
  
  if (result.code !== 0) {
    throw new Error(`获取 Token 失败：${result.msg}`);
  }
  
  return {
    token: result.tenant_access_token,
    expiresAt: Date.now() + (result.expire - 300) * 1000 // 提前 5 分钟刷新
  };
}

/**
 * 加载或刷新 Token
 */
async function loadOrRefreshToken() {
  // 尝试从文件加载
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      
      // 检查是否过期
      if (Date.now() < cached.expiresAt) {
        console.log('[Feishu Token] 使用缓存的 Token');
        return cached.token;
      }
      
      console.log('[Feishu Token] Token 已过期，正在刷新...');
    }
  } catch (e) {
    console.error('[Feishu Token] 读取缓存失败:', e.message);
  }
  
  // 获取新 Token
  const tokenInfo = await getTenantToken();
  
  // 保存到文件
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
  
  console.log('[Feishu Token] 新 Token 已保存');
  
  return tokenInfo.token;
}

/**
 * 获取 Token（带缓存）
 */
async function getToken() {
  return loadOrRefreshToken();
}

/**
 * 清除缓存的 Token
 */
function clearCache() {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
    console.log('[Feishu Token] 缓存已清除');
  }
}

module.exports = {
  getToken,
  clearCache
};
