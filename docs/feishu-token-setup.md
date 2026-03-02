# 飞书 Token 长期有效配置指南

## 📋 概述

通过 `refresh_token` 机制，可以让飞书 User Access Token 实现**长期有效**（理论上无限期，只要定期刷新）。

---

## 🔧 配置步骤

### 步骤 1: 准备应用凭证

1. 访问 **飞书开放平台** https://open.feishu.cn/app
2. 选择你的应用（如 OpenClaw）
3. 进入「**凭证与基础信息**」
4. 复制以下信息：
   - `App ID` (格式：`cli_xxxxxxxxxxxxxxxx`)
   - `App Secret` (长字符串)

### 步骤 2: 设置环境变量

编辑 `~/.bashrc` 或 `~/.zshrc`：

```bash
# 飞书应用凭证
export FEISHU_APP_ID="cli_xxxxxxxxxxxxxxxx"
export FEISHU_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

保存后执行：

```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

### 步骤 3: 首次授权获取 Token

访问飞书开放平台的 **接口调试工具**：
https://open.feishu.cn/explorer

1. 搜索任意用户相关 API（如「获取用户信息」）
2. 点击「**授权并调试**」
3. 扫码授权
4. 复制返回的以下信息：
   - `access_token` (格式：`u-xxxxxxxxxxxx`)
   - `refresh_token` (长字符串)

### 步骤 4: 保存初始 Token

创建脚本 `save-token.js`：

```javascript
const { saveInitialToken } = require('./lib/feishu-token-refresh');

// 替换为你的 Token
saveInitialToken(
  'u-xxxxxxxxxxxxxxxxxx',  // access_token
  'refresh_xxxxxxxxxxxxxxxx',  // refresh_token
  7200  // 过期时间（秒），默认 2 小时
);
```

执行：

```bash
node save-token.js
```

### 步骤 5: 使用自动刷新的 Token

在代码中使用：

```javascript
const { getToken } = require('./lib/feishu-token-refresh');
const { sendText } = require('./lib/feishu-fallback');

async function sendMessage() {
  const token = await getToken(); // 自动刷新
  await sendText(token, chatId, 'Hello');
}
```

---

## 🔄 刷新机制

### 自动刷新时机

- **Access Token 过期前 5 分钟** 自动刷新
- **Refresh Token** 会自动更新（如果飞书返回新的）

### 刷新频率

- Access Token: 每 2 小时自动刷新
- Refresh Token: 通常 30 天 -1 年（取决于飞书政策）

### 何时需要重新授权

- Refresh Token 过期（通常 30 天以上）
- 用户主动撤销授权
- 应用被禁用

---

## 📊 检查 Token 状态

创建脚本 `check-token.js`：

```javascript
const { checkTokenStatus } = require('./lib/feishu-token-refresh');

const status = checkTokenStatus();
console.log('Token 状态:', status);

if (status.exists) {
  console.log('是否有 Refresh Token:', status.hasRefreshToken);
  console.log('过期时间:', status.expiresInText);
} else {
  console.log('未找到 Token，请先授权');
}
```

执行：

```bash
node check-token.js
```

---

## 🔍 故障排查

### 问题 1: 缺少 refresh_token

**错误**: `缺少 refresh_token，需要重新授权`

**解决**: 
1. 重新执行步骤 3 获取新的 refresh_token
2. 确保保存时包含了 refresh_token

### 问题 2: 刷新失败

**错误**: `刷新 Token 失败：xxx`

**可能原因**:
- App ID/Secret 错误
- Refresh Token 过期
- 网络问题

**解决**:
1. 检查环境变量是否正确
2. 重新授权获取新的 refresh_token
3. 检查网络连接

### 问题 3: Token 文件权限

**错误**: `EACCES: permission denied`

**解决**:
```bash
chmod 600 ~/.openclaw/workspace/lib/feishu-user-token.json
```

---

## 📁 文件结构

```
~/.openclaw/workspace/
├── lib/
│   ├── feishu-token-refresh.js  # Token 自动刷新模块
│   ├── feishu-fallback.js       # 飞书消息降级模块
│   └── http-retry.js            # HTTP 重试模块
└── lib/
    └── feishu-user-token.json   # Token 缓存文件（自动生成）
```

---

## 🔐 安全建议

1. **不要提交 Token 文件到 Git**
   - 已添加到 `.gitignore`
   
2. **保护环境变量**
   - 使用 `.env` 文件（不提交到 Git）
   - 或使用系统环境变量

3. **定期轮换 App Secret**
   - 建议每 3-6 个月更换一次

4. **监控 Token 使用**
   - 定期检查飞书开放平台的调用日志

---

## 📝 快速参考

### 获取新 Token（首次）
```bash
# 1. 访问 https://open.feishu.cn/explorer
# 2. 授权并复制 access_token 和 refresh_token
# 3. 运行 save-token.js
```

### 检查状态
```bash
node check-token.js
```

### 清除缓存（强制刷新）
```bash
node -e "require('./lib/feishu-token-refresh').clearCache()"
```

---

## 🎯 总结

配置完成后：

✅ **Access Token** 自动刷新（每 2 小时）
✅ **Refresh Token** 自动更新
✅ **无需手动干预**（除非 Refresh Token 过期）
✅ **长期有效**（理论上无限期）

**下次 Refresh Token 过期时**（通常 30 天以上），重新执行步骤 3 即可。

---

**最后更新**: 2026-02-20
**作者**: 贰号
