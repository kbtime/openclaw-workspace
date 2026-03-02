/**
 * 用授权码换取 access_token 和 refresh_token
 * 使用：node scripts/get-token-from-code.js <授权码>
 */

const { fetchWithRetry } = require('../lib/http-retry');

// 加载环境变量
require('dotenv').config({ path: '.env.feishu' });

const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('❌ 使用方法：');
  console.log('node scripts/get-token-from-code.js <授权码>');
  console.log('');
  console.log('获取授权码步骤：');
  console.log('1. 打开 scripts/feishu-authorize.html 文件');
  console.log('2. 点击"开始授权"按钮');
  console.log('3. 扫码授权');
  console.log('4. 从回调 URL 中复制 code 参数');
  console.log('');
  console.log('示例：');
  console.log('node scripts/get-token-from-code.js a61hb967bd094dge949h79bbexd16dfe');
  process.exit(1);
}

const code = args[0];

console.log('=== 用授权码换取 Token ===\n');
console.log('App ID:', process.env.FEISHU_APP_ID || '未设置');
console.log('授权码:', code.substring(0, 10) + '...');
console.log('');

async function getToken() {
  const url = 'https://open.feishu.cn/open-apis/authen/v2/oauth/token';
  
  const body = {
    grant_type: 'authorization_code',
    client_id: process.env.FEISHU_APP_ID,
    client_secret: process.env.FEISHU_APP_SECRET,
    code: code
  };
  
  console.log('正在请求 Token...');
  
  try {
    const result = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (result.code === 0) {
      console.log('\n✅ 成功获取 Token!\n');
      console.log('access_token:', result.access_token);
      console.log('refresh_token:', result.refresh_token || '❌ 未返回（请检查 offline_access 权限）');
      console.log('expires_in:', result.expires_in, '秒');
      
      if (result.refresh_token) {
        console.log('refresh_token_expires_in:', result.refresh_token_expires_in, '秒');
        console.log('scope:', result.scope);
        
        console.log('\n\n📋 下一步：初始化 Token');
        console.log(`node scripts/init-feishu-token.js ${result.access_token} ${result.refresh_token}`);
      } else {
        console.log('\n⚠️  未返回 refresh_token，可能原因：');
        console.log('1. offline_access 权限未添加到应用');
        console.log('2. 授权时没有勾选 offline_access 权限');
        console.log('3. 安全设置的刷新开关未开启');
        console.log('\n请检查飞书开放平台配置后重新授权。');
      }
    } else {
      console.log('\n❌ 失败:', result.error || result.msg);
      console.log('错误码:', result.code);
    }
  } catch (error) {
    console.log('\n❌ 请求失败:', error.message);
  }
}

getToken();
