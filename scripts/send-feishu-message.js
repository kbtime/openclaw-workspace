/**
 * 使用 Tenant Token 发送飞书消息
 * 使用：node scripts/send-feishu-message.js <接收者ID> <消息内容>
 * 
 * 接收者ID格式：
 * - 用户：ou_xxxxx（open_id）
 * - 群组：oc_xxxxx（chat_id）
 */

const { fetchWithRetry } = require('../lib/http-retry');
const fs = require('fs');
const path = require('path');

const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';
const TOKEN_FILE = path.join(__dirname, '../lib/feishu-tenant-token.json');

async function getTenantToken() {
  // 检查缓存
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      if (Date.now() < cached.expiresAt) {
        return cached.token;
      }
    }
  } catch (e) {}
  
  // 获取新 Token
  const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
  const result = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET
    })
  });
  
  if (result.code !== 0) {
    throw new Error('获取 Token 失败：' + result.msg);
  }
  
  // 保存
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({
    token: result.tenant_access_token,
    expiresAt: Date.now() + (result.expire - 300) * 1000
  }, null, 2));
  
  return result.tenant_access_token;
}

async function sendMessage(receiveId, content) {
  console.log('=== 发送飞书消息 ===\n');
  
  try {
    const token = await getTenantToken();
    console.log('✅ Token 获取成功');
    
    const url = 'https://open.feishu.cn/open-apis/im/v1/messages';
    
    const result = await fetchWithRetry(url + '?receive_id_type=open_id', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: 'text',
        content: JSON.stringify({ text: content })
      })
    });
    
    if (result.code === 0) {
      console.log('✅ 消息发送成功！');
      console.log('Message ID:', result.data?.message_id);
    } else {
      console.log('❌ 发送失败:', result.msg);
      console.log('错误码:', result.code);
      
      if (result.code === 230002) {
        console.log('\n💡 提示：接收者需要先关注应用才能收到消息');
      }
    }
  } catch (e) {
    console.log('❌ 请求失败:', e.message);
  }
}

// 命令行调用
const args = process.argv.slice(2);
if (args.length >= 2) {
  sendMessage(args[0], args.slice(1).join(' '));
} else {
  console.log('使用方法：');
  console.log('node scripts/send-feishu-message.js <接收者ID> <消息内容>');
  console.log('');
  console.log('示例：');
  console.log('node scripts/send-feishu-message.js ou_xxxxx "Hello World"');
}
