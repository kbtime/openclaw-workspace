/**
 * 刷新飞书 User Token
 * 每 1 小时执行一次
 */

const fs = require('fs');
const path = require('path');

const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';
const TOKEN_FILE = path.join(process.env.HOME || '/root', '.openclaw/workspace/lib/feishu-user-token.json');

async function refreshToken() {
  console.log('🔄 开始刷新 User Token...');
  
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      console.error('❌ Token 文件不存在');
      return false;
    }
    
    const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    
    if (!tokenInfo.refresh_token) {
      console.error('❌ 缺少 refresh_token');
      return false;
    }
    
    const res = await fetch('https://open.feishu.cn/open-apis/authen/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        refresh_token: tokenInfo.refresh_token
      })
    });
    
    const data = await res.json();
    
    if (data.code === 0) {
      const newTokenInfo = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
        scope: data.scope,
        obtainedAt: new Date().toISOString()
      };
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(newTokenInfo, null, 2));
      console.log('✅ User Token 刷新成功');
      console.log('   过期时间:', new Date(newTokenInfo.expiresAt).toLocaleString('zh-CN'));
      return true;
    } else {
      console.error('❌ 刷新失败:', data.msg);
      return false;
    }
  } catch (e) {
    console.error('❌ 请求失败:', e.message);
    return false;
  }
}

refreshToken();
