/**
 * 检查飞书 Token 状态
 */

const { checkTokenStatus } = require('../lib/feishu-token-refresh');

console.log('=== 飞书 Token 状态 ===\n');

// 检查环境变量
const hasAppId = !!process.env.FEISHU_APP_ID;
const hasSecret = !!process.env.FEISHU_APP_SECRET;

console.log('环境变量:');
console.log('  FEISHU_APP_ID:', hasAppId ? '✓ 已配置' : '✗ 未配置');
console.log('  FEISHU_APP_SECRET:', hasSecret ? '✓ 已配置' : '✗ 未配置');
console.log('');

// 检查 Token
const status = checkTokenStatus();

if (status.exists) {
  console.log('Token 缓存:');
  console.log('  状态：✓ 存在');
  console.log('  有 Refresh Token:', status.hasRefreshToken ? '✓ 是' : '✗ 否');
  console.log('  过期时间:', status.expiresInText);
  console.log('  剩余秒数:', status.expiresIn);
  
  if (status.expiresIn < 300) {
    console.log('\n⚠️  Token 即将过期，建议刷新');
  }
} else {
  console.log('Token 缓存:');
  console.log('  状态：✗ 不存在');
  console.log('\n请先初始化 Token:');
  console.log('node scripts/init-feishu-token.js <access_token> <refresh_token>');
}

console.log('');
