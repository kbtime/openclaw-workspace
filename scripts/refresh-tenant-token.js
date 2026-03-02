/**
 * 刷新飞书 Tenant Token
 * 每 2 小时执行一次
 */

const fs = require('fs');
const path = require('path');

const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';
const TOKEN_FILE = path.join(process.env.HOME || '/root', '.openclaw/workspace/lib/feishu-tenant-token.json');

async function refreshToken() {
  console.log('🔄 开始刷新 Tenant Token...');
  
  try {
    const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET
      })
    });
    
    const data = await res.json();
    
    if (data.code === 0) {
      const tokenInfo = {
        token: data.tenant_access_token,
        expiresAt: Date.now() + (data.expire - 300) * 1000
      };
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
      console.log('✅ Tenant Token 刷新成功');
      console.log('   过期时间:', new Date(tokenInfo.expiresAt).toLocaleString('zh-CN'));
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
