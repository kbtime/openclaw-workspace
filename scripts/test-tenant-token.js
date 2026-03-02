/**
 * 飞书 Tenant Token 测试
 * 使用 App ID 和 App Secret 自动获取 Token
 */

const { fetchWithRetry } = require('../lib/http-retry');

const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';

async function test() {
  console.log('=== 飞书 Tenant Token 测试 ===\n');
  
  try {
    // 获取 Tenant Token
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    
    const result = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET
      })
    });
    
    if (result.code === 0) {
      console.log('✅ Tenant Token 获取成功！\n');
      console.log('Token:', result.tenant_access_token.substring(0, 20) + '...');
      console.log('有效期:', result.expire, '秒');
      
      // 保存到文件
      const fs = require('fs');
      const path = require('path');
      const tokenFile = path.join(__dirname, '../lib/feishu-tenant-token.json');
      
      fs.writeFileSync(tokenFile, JSON.stringify({
        token: result.tenant_access_token,
        expiresAt: Date.now() + (result.expire - 300) * 1000
      }, null, 2));
      
      console.log('\n✅ Token 已保存到:', tokenFile);
      console.log('\n现在可以使用 Tenant Token 发送应用消息了！');
      
      return result.tenant_access_token;
    } else {
      console.log('❌ 失败:', result.msg);
    }
  } catch (e) {
    console.log('❌ 请求失败:', e.message);
  }
}

test();
