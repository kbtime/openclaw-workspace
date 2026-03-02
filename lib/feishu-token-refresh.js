/**
 * 飞书 User Access Token 自动管理
 * 支持通过 refresh_token 自动刷新，实现长期有效
 * 
 * 文档：https://open.feishu.cn/document/authentication-management/access-token/refresh-user-access-token
 */

const fs = require('fs');
const path = require('path');
const { fetchWithRetry } = require('./http-retry');

// 配置
const TOKEN_FILE = path.join(__dirname, 'feishu-user-token.json');

// 从环境变量读取
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';

/**
 * 刷新 User Access Token
 * 使用 refresh_token 获取新的 access_token
 */
async function refreshUserToken(refreshToken) {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('缺少 FEISHU_APP_ID 或 FEISHU_APP_SECRET 环境变量');
  }
  
  const url = 'https://open.feishu.cn/open-apis/authen/v1/oidc/refresh_access_token';
  
  const result = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });
  
  if (result.code !== 0) {
    throw new Error(`刷新 Token 失败：${result.msg}`);
  }
  
  return {
    access_token: result.data.access_token,
    refresh_token: result.data.refresh_token || refreshToken, // 可能返回新的 refresh_token
    expiresAt: Date.now() + (result.data.expires_in - 300) * 1000 // 提前 5 分钟刷新
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
        console.log('[Feishu Token] 使用缓存的 Access Token');
        return cached.access_token;
      }
      
      // Token 过期，尝试刷新
      console.log('[Feishu Token] Access Token 已过期，正在刷新...');
      
      if (cached.refresh_token) {
        const tokenInfo = await refreshUserToken(cached.refresh_token);
        
        // 保存新 Token
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
        console.log('[Feishu Token] 新 Token 已保存');
        
        return tokenInfo.access_token;
      } else {
        throw new Error('缺少 refresh_token，需要重新授权');
      }
    }
  } catch (e) {
    if (!e.message.includes('刷新 Token 失败')) {
      console.error('[Feishu Token] 读取缓存失败:', e.message);
    }
    throw e;
  }
  
  // 没有缓存
  throw new Error('未找到 Token 缓存，请先授权获取 User Access Token 和 Refresh Token');
}

/**
 * 保存初始 Token（首次授权后调用）
 */
function saveInitialToken(accessToken, refreshToken, expiresIn = 7200) {
  const tokenInfo = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expiresAt: Date.now() + (expiresIn - 300) * 1000
  };
  
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
  console.log('[Feishu Token] 初始 Token 已保存');
}

/**
 * 获取 Token（带自动刷新）
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

/**
 * 检查 Token 状态
 */
function checkTokenStatus() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      const now = Date.now();
      const expiresAt = cached.expiresAt;
      const expiresIn = Math.max(0, expiresAt - now);
      
      return {
        exists: true,
        hasRefreshToken: !!cached.refresh_token,
        expiresIn: Math.round(expiresIn / 1000), // 秒
        expiresInText: formatDuration(expiresIn)
      };
    }
  } catch (e) {
    console.error('[Feishu Token] 检查状态失败:', e.message);
  }
  
  return { exists: false };
}

/**
 * 格式化时间
 */
function formatDuration(ms) {
  if (ms <= 0) return '已过期';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天`;
  if (hours > 0) return `${hours}小时`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
}

module.exports = {
  getToken,
  saveInitialToken,
  clearCache,
  checkTokenStatus
};
