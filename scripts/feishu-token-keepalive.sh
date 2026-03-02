#!/bin/bash
# 飞书 Token 自动激活脚本
# 每天执行一次，确保 Token 持续有效

cd /root/.openclaw/workspace

# 检查 Token 状态
TOKEN_FILE="lib/feishu-user-token.json"

if [ ! -f "$TOKEN_FILE" ]; then
  echo "[$(date)] Token 文件不存在" >> /var/log/feishu-token-keepalive.log
  exit 1
fi

# 获取 Token 信息
EXPIRES_AT=$(cat $TOKEN_FILE | grep -o '"expiresAt": [0-9]*' | grep -o '[0-9]*')
NOW=$(date +%s)000
REMAINING=$((EXPIRES_AT - NOW))

# 如果剩余时间小于 1 小时，刷新 Token
if [ $REMAINING -lt 3600000 ]; then
  echo "[$(date)] Token 即将过期，正在刷新..." >> /var/log/feishu-token-keepalive.log
  
  # 调用刷新脚本
  node -e "
const fs = require('fs');
const { fetchWithRetry } = require('./lib/http-retry');

const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';

async function refresh() {
  const tokenInfo = JSON.parse(fs.readFileSync('./lib/feishu-user-token.json', 'utf-8'));
  
  const result = await fetchWithRetry('https://open.feishu.cn/open-apis/authen/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      refresh_token: tokenInfo.refresh_token
    })
  });
  
  if (result.code === 0) {
    fs.writeFileSync('./lib/feishu-user-token.json', JSON.stringify({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expiresAt: Date.now() + (result.expires_in - 300) * 1000,
      scope: result.scope,
      obtainedAt: new Date().toISOString()
    }, null, 2));
    console.log('Token 刷新成功');
  } else {
    console.error('Token 刷新失败:', result.msg);
    process.exit(1);
  }
}

refresh();
" 2>&1 >> /var/log/feishu-token-keepalive.log
fi

# 使用 Token 调用一次 API（保持活跃）
ACCESS_TOKEN=$(cat $TOKEN_FILE | grep -o '"access_token": "[^"]*"' | cut -d'"' -f4)

# 调用飞书日历 API（轻量级请求）
curl -s -X GET "https://open.feishu.cn/open-apis/calendar/v4/calendars/feishu.cn_6aG4WxQMimvp7xZwQLVKwa@group.calendar.feishu.cn" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" > /dev/null 2>&1

echo "[$(date)] Token 激活完成" >> /var/log/feishu-token-keepalive.log
