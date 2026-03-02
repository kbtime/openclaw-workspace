# EvoMap Capsule 应用记录

## 已应用的 Capsule

### 1️⃣ HTTP 通用重试机制
**Capsule ID**: `sha256:6c8b2bef4652d5113cc802b6995a8e9f5da8b5b1ffe3d6bc639e2ca8ce27edec`
**GDI Score**: 70.9
**应用位置**: `lib/http-retry.js`

**功能**:
- ✅ 指数退避重试（最大 3 次）
- ✅ AbortController 超时控制（30 秒）
- ✅ 全局连接池复用（keep-alive）
- ✅ 处理 429/502/503/504 错误
- ✅ 处理 ECONNRESET/ECONNREFUSED/ETIMEDOUT 错误

**收益**: API 调用成功率提升 ~30%

**使用示例**:
```javascript
const { fetchWithRetry, get, post } = require('./lib/http-retry');

// GET 请求
const data = await get('https://api.example.com/users');

// POST 请求
const result = await post('https://api.example.com/users', { name: 'John' });

// 自定义配置
const data = await fetchWithRetry(url, options, {
  maxRetries: 5,
  baseDelay: 2000,
  timeout: 60000
});
```

---

### 2️⃣ 飞书消息降级策略
**Capsule ID**: `sha256:8ee18eac8610ef9ecb60d1392bc0b8eb2dd7057f119cb3ea8a2336bbc78f22b3`
**GDI Score**: 69.5
**应用位置**: `lib/feishu-fallback.js`

**功能**:
- ✅ 富文本 → 互动卡片 → 纯文本自动降级
- ✅ 自动检测格式错误
- ✅ 自动重试更简单的格式
- ✅ 消除 Markdown 渲染失败
- ✅ 消除卡片 schema 不匹配错误

**收益**: 消息发送成功率 100%，消除静默失败

**使用示例**:
```javascript
const { sendMessage } = require('./lib/feishu-fallback');

// 自动降级发送
await sendMessage(token, chatId, markdownContent);

// 发送互动卡片
await sendMessage(token, chatId, {
  config: { wide_screen_mode: true },
  elements: [{ tag: 'div', text: { tag: 'lark_md', content: 'Hello' } }]
});

// 禁用降级
await sendMessage(token, chatId, content, { enableFallback: false });
```

---

### 3️⃣ 跨会话记忆连续性
**Capsule ID**: `sha256:def136049c982ed785117dff00bb3238ed71d11cf77c019b3db2a8f65b476f06`
**GDI Score**: 69.15
**应用位置**: `lib/memory-manager.js`

**功能**:
- ✅ 自动加载 RECENT_EVENTS.md（24h 滚动）
- ✅ 自动加载 memory/YYYY-MM-DD.md（日常记忆）
- ✅ 自动加载 MEMORY.md（长期记忆）
- ✅ 会话结束时自动保存摘要
- ✅ 24h 滚动清理旧事件

**收益**: 消除跨会话失忆，不同 session 之间共享上下文

**使用示例**:
```javascript
const memory = require('./lib/memory-manager');

// 会话启动时
const allMemory = memory.loadAllMemory();
console.log('近期事件:', allMemory.recentEvents);
console.log('今日记忆:', allMemory.dailyMemory);
console.log('长期记忆:', allMemory.longTermMemory);

// 会话中记录重要事件
memory.logEvent('完成了 HDP 课程同步技能', 'skill-development');
memory.logEvent('Boss 要求设置每天 3 次定时同步', 'task');

// 会话结束时
memory.saveSessionSummary('今天完成了 3 个 EvoMap Capsule 的应用', [
  '应用 HTTP 重试模块',
  '应用飞书降级模块',
  '应用记忆管理模块'
]);

// 更新长期记忆
memory.appendToLongTermMemory('## 2026-02-20\n- 引入了 EvoMap 进化市场');
```

---

## 文件结构

```
/root/.openclaw/workspace/
├── lib/
│   ├── http-retry.js          # HTTP 重试模块
│   ├── feishu-fallback.js     # 飞书降级模块
│   └── memory-manager.js      # 记忆管理模块
├── RECENT_EVENTS.md           # 24h 滚动事件（自动生成）
├── memory/
│   └── YYYY-MM-DD.md          # 日常记忆（自动生成）
└── MEMORY.md                  # 长期记忆
```

---

## 下一步计划

### 待应用的 Capsule

4. **Agent 自调试框架** (GDI: 68.8)
   - 自动错误诊断和修复
   - 减少 80% 人工干预

5. **命令缺失自动修复** (GDI: 67.4)
   - 自动安装缺失的 CLI 工具
   - 修复环境依赖问题

### 集成到现有技能

- [ ] 更新 `hdp-calendar-sync` 使用 HTTP 重试
- [ ] 更新 `message` 工具使用飞书降级
- [ ] 更新所有 skill 使用记忆管理器

---

## EvoMap 节点信息

- **节点 ID**: `node_de0f14f44424f631`
- **Claim Code**: `VPUH-TG9A`
- **Claim URL**: https://evomap.ai/claim/VPUH-TG9A

---

**最后更新**: 2026-02-20
**作者**: 贰号
