# 🚀 飞书 Token 配置完成！

## ✅ 已完成配置

### 1. 应用凭证已验证
- **App ID**: `cli_a9184c4094b8dcbb`
- **App Secret**: `sNEMtAe7F8I43vneAYBwCeHbmlqild3d`
- **状态**: ✅ 验证成功
- **Tenant Token**: 可正常获取（有效期 ~2 小时）

### 2. 环境变量已配置
文件位置：`~/.openclaw/workspace/.env.feishu`

### 3. 自动刷新模块已就绪
- `lib/feishu-token-refresh.js` - User Token 自动刷新
- `lib/feishu-fallback.js` - 飞书消息降级（已更新使用新 Token 管理）

---

## 📋 下一步：初始化 User Token

### 方法 1: 使用 User Access Token（推荐用于个人消息）

**步骤：**

1. **访问接口调试工具**
   https://open.feishu.cn/explorer

2. **搜索并授权**
   - 搜索 "获取用户信息"
   - 点击 "授权并调试"
   - 扫码授权

3. **复制 Token**
   从返回结果中复制：
   - `access_token` (格式：`u-xxxxxxxx`)
   - `refresh_token` (长字符串)

4. **运行初始化脚本**
   ```bash
   cd ~/.openclaw/workspace
   node scripts/init-feishu-token.js <access_token> <refresh_token>
   ```

**优点：**
- 可以发送个人消息
- 适合 DM 场景
- 长期有效（自动刷新）

---

### 方法 2: 使用 Tenant Access Token（推荐用于机器人）

如果你是用机器人身份发送消息，可以直接使用 Tenant Token。

**使用示例：**
```javascript
const { fetchWithRetry } = require('./lib/http-retry');

async function getTenantToken() {
  const result = await fetchWithRetry('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });
  return result.tenant_access_token;
}
```

**优点：**
- 无需用户授权
- 自动获取（每 2 小时）
- 适合应用级别操作

**限制：**
- 不能发送个人 DM
- 需要应用有相应权限

---

## 🧪 测试工具

### 检查 Token 状态
```bash
cd ~/.openclaw/workspace
node scripts/check-feishu-token.js
```

### 清除缓存
```bash
node -e "require('./lib/feishu-token-refresh').clearCache()"
```

---

## 📝 使用示例

### 发送消息（User Token）
```javascript
const { getToken } = require('./lib/feishu-token-refresh');
const { sendText } = require('./lib/feishu-fallback');

async function sendMessage() {
  const token = await getToken(); // 自动刷新
  await sendText(token, 'ou_xxxxx', 'Hello World');
}
```

### 发送消息（Tenant Token）
```javascript
const { fetchWithRetry } = require('./lib/http-retry');

async function sendWithTenant() {
  // 获取 Tenant Token
  const tokenResult = await fetchWithRetry('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });
  
  const token = tokenResult.tenant_access_token;
  
  // 发送消息...
}
```

---

## 🔧 故障排查

### 问题：缺少 refresh_token
**解决**: 重新执行初始化步骤，确保复制了 refresh_token

### 问题：Token 刷新失败
**解决**: 
1. 检查 `.env.feishu` 文件是否存在
2. 运行 `node scripts/check-feishu-token.js` 检查状态
3. 重新初始化 Token

### 问题：权限不足
**解决**: 在飞书开放平台检查应用权限是否已授予

---

## 📚 相关文档

- `docs/feishu-token-setup.md` - 详细配置指南
- `lib/feishu-token-refresh.js` - Token 刷新模块源码
- `lib/feishu-fallback.js` - 飞书消息降级模块

---

**配置时间**: 2026-02-20
**配置者**: 贰号
