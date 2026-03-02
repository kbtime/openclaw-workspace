/**
 * 初始化飞书 Token
 * 使用说明：
 * 1. 访问 https://open.feishu.cn/explorer
 * 2. 授权并获取 access_token 和 refresh_token
 * 3. 运行此脚本：node scripts/init-feishu-token.js <access_token> <refresh_token>
 */

const { saveInitialToken } = require('../lib/feishu-token-refresh');

// 加载环境变量
require('dotenv').config({ path: '.env.feishu' });

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('❌ 使用方法：');
  console.log('node scripts/init-feishu-token.js <access_token> <refresh_token>');
  console.log('');
  console.log('获取 Token 步骤：');
  console.log('1. 访问 https://open.feishu.cn/explorer');
  console.log('2. 搜索 "获取用户信息" 或任意用户 API');
  console.log('3. 点击 "授权并调试"');
  console.log('4. 扫码授权');
  console.log('5. 复制返回的 access_token 和 refresh_token');
  console.log('');
  console.log('示例：');
  console.log('node scripts/init-feishu-token.js u-xxxxxxx refresh_xxxxxxx');
  process.exit(1);
}

const [accessToken, refreshToken] = args;

console.log('=== 初始化飞书 Token ===\n');
console.log('App ID:', process.env.FEISHU_APP_ID || '未设置');
console.log('Access Token:', accessToken.substring(0, 10) + '...');
console.log('Refresh Token:', refreshToken.substring(0, 10) + '...\n');

try {
  saveInitialToken(accessToken, refreshToken, 7200);
  console.log('\n✅ Token 初始化成功！\n');
  console.log('下次使用时会自动刷新，无需手动操作。');
  console.log('Refresh Token 有效期通常为 30 天以上。');
} catch (error) {
  console.error('\n❌ 初始化失败:', error.message);
  process.exit(1);
}
