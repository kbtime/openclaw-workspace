/**
 * 飞书 OAuth 回调服务器
 * 自动处理授权回调，获取 access_token 和 refresh_token
 */

const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { fetchWithRetry } = require('../lib/http-retry');

const PORT = 3000;
const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';
const REDIRECT_URI = 'https://x.738402.xyz/callback';
const SCOPE = 'auth:user.id:read offline_access calendar:calendar contact:user.email:readonly contact:contact.base:readonly';
const TOKEN_FILE = path.join(__dirname, '../lib/feishu-user-token.json');

console.log('=== 飞书 OAuth 回调服务器 ===\n');
console.log('监听端口:', PORT);
console.log('回调地址:', REDIRECT_URI);
console.log('');

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // 根路径 - 显示授权链接
  if (url.pathname === '/') {
    const authUrl = `https://accounts.feishu.cn/open-apis/authen/v1/authorize?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>飞书 OAuth 授权</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .btn { display: inline-block; padding: 15px 30px; background: #3370ff; color: white; text-decoration: none; border-radius: 5px; font-size: 18px; }
          .btn:hover { background: #265ddb; }
          .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>🔐 飞书 OAuth 授权</h1>
        <div class="info">
          <p><strong>应用 ID:</strong> ${APP_ID}</p>
          <p><strong>回调地址:</strong> ${REDIRECT_URI}</p>
          <p><strong>授权范围:</strong></p>
          <ul>
            <li>auth:user.id:read - 读取用户 ID</li>
            <li>offline_access - 获取 refresh_token</li>
            <li>calendar:calendar - 日历权限</li>
            <li>contact:user.email:readonly - 读取用户邮箱</li>
            <li>contact:contact.base:readonly - 读取联系人基本信息</li>
          </ul>
        </div>
        <p>点击下方按钮开始授权：</p>
        <a class="btn" href="${authUrl}">🔐 开始授权</a>
      </body>
      </html>
    `);
    return;
  }
  
  // 回调路径 - 处理授权回调
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <h1>❌ 授权失败</h1>
        <p>错误: ${error}</p>
        <p><a href="/">返回重试</a></p>
      `);
      return;
    }
    
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <h1>❌ 缺少授权码</h1>
        <p><a href="/">返回重试</a></p>
      `);
      return;
    }
    
    console.log('收到授权码:', code.substring(0, 10) + '...');
    
    // 用授权码换取 Token
    try {
      const tokenUrl = 'https://open.feishu.cn/open-apis/authen/v2/oauth/token';
      const result = await fetchWithRetry(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: APP_ID,
          client_secret: APP_SECRET,
          code: code,
          redirect_uri: REDIRECT_URI
        })
      });
      
      if (result.code === 0) {
        console.log('\n✅ Token 获取成功！');
        console.log('access_token:', result.access_token.substring(0, 20) + '...');
        console.log('refresh_token:', result.refresh_token ? result.refresh_token.substring(0, 20) + '...' : '❌ 未返回');
        
        // 保存 Token
        const tokenInfo = {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          expiresAt: Date.now() + (result.expires_in - 300) * 1000,
          scope: result.scope,
          obtainedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
        console.log('Token 已保存到:', TOKEN_FILE);
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>授权成功</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
              .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
              code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <h1>✅ 授权成功！</h1>
            <div class="success">
              <p>飞书 OAuth 授权已完成，Token 已自动保存。</p>
            </div>
            <div class="info">
              <p><strong>Access Token:</strong> <code>${result.access_token.substring(0, 30)}...</code></p>
              <p><strong>Refresh Token:</strong> <code>${result.refresh_token ? result.refresh_token.substring(0, 30) + '...' : '❌ 未获取'}</code></p>
              <p><strong>有效期:</strong> ${result.expires_in} 秒</p>
              <p><strong>权限范围:</strong> ${result.scope}</p>
            </div>
            <p>现在可以使用飞书 API 发送消息了！</p>
          </body>
          </html>
        `);
        
        // 3 秒后关闭服务器
        setTimeout(() => {
          console.log('\n授权完成，服务器关闭');
          process.exit(0);
        }, 3000);
        
      } else {
        console.error('获取 Token 失败:', result);
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <h1>❌ 获取 Token 失败</h1>
          <p>错误码: ${result.code}</p>
          <p>错误信息: ${result.error || result.msg}</p>
          <p><a href="/">返回重试</a></p>
        `);
      }
    } catch (e) {
      console.error('请求失败:', e);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <h1>❌ 请求失败</h1>
        <p>${e.message}</p>
        <p><a href="/">返回重试</a></p>
      `);
    }
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>404 Not Found</h1>');
});

server.listen(PORT, () => {
  console.log('✅ 服务器启动成功！');
  console.log('');
  console.log('访问 http://localhost:' + PORT + ' 开始授权');
  console.log('或者访问 https://x.738402.xyz 开始授权（需要配置 Nginx）');
  console.log('');
});
