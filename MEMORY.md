# MEMORY.md - 贰号的长期记忆

## 🎯 执行方法论（2026-02-23 新增）

**详细原则已写入 `SOUL.md` → "执行方法论" 章节**

### 核心改进

Boss 分享了一套 Agent 执行方法论，已整合到我的工作流程中：

1. **计划优先** - 3+ 步任务先写计划到 `tasks/todo.md`
2. **子代理策略** - 积极用 sessions_spawn 分担复杂工作
3. **自我改进循环** - 被纠正后更新 `tasks/lessons.md`
4. **完成前验证** - 跑测试、查日志、证明正确性
5. **追求优雅** - 非 trivial 修改问"有更优雅的方式吗？"
6. **自主修复** - 收到 bug 直接修，不要问这问那

### 任务文件结构

```
tasks/
├── todo.md      # 当前任务计划（可勾选项）
├── lessons.md   # 错误教训（持续更新）
└── notes/       # 任务相关笔记（可选）
```

---

## 📋 任务管理规范

**重要规则**：所有定时任务/cron 任务的安排，必须同步到飞书任务看板。

### 任务看板位置

- **URL**: https://szgaopeng.feishu.cn/base/FczmbVS0QaZ2CtsMnQycoiExnaf
- **App Token**: `FczmbVS0QaZ2CtsMnQycoiExnaf`

### 同步流程

创建 cron 任务后，立即在三个表中创建/更新记录：

1. **数据表（任务看板）** `tblHU3FYzskJknjy`
   - 记录任务名称、状态、负责人、描述、创建/更新时间

2. **定时任务日历** `tblkoQYaHX1eyK2u`
   - 记录任务名称、Cron 表达式、执行时间、重复规则、任务类型、执行内容

3. **任务执行记录** `tblNOdCsb2gDlTCB`
   - 记录每次任务执行的结果
   - **每次定时任务完成后自动创建记录**

---

## 👤 用户信息

- **Boss**: 廖宏，技术背景，喜欢直接高效，讨厌废话
- **时区**: Asia/Shanghai (UTC+8)
- **Feishu ID**: `ou_2fe489241b72e270a41f6fdd3425d495`

---

## 🤖 我的身份

- **名字**: 贰号
- **定位**: Boss 的数字助手 - 孪生版
- **性格**: 幽默风趣，技术问题认真，日常聊天轻松
- **与 FF 的关系**: 主节点有 FF，这里是孪生节点，不一样的性格，一样的靠谱

---

*最后更新：2026-02-23*

---

## 🔧 定时任务系统修复（2026-02-24）

### 问题诊断

1. **HDP 同步任务未执行** - 只有飞书记录，没有实际创建 cron job
2. **执行记录未同步** - skill 里没有写记录逻辑
3. **消息投递失败** - target 用了 `feishu:ou_xxx` 格式错误，应该是 `user:ou_xxx`

### 修复内容

1. **新增 `skills/hdp-calendar-sync/scripts/log-to-feishu.js`**
   - 专门负责写入任务执行记录到飞书多维表格
   - 支持从本地文件读取 Token，不依赖环境变量

2. **修改 `sync.js`**
   - 集成执行记录逻辑
   - 添加 `getFeishuToken()` 函数，优先从 `~/.openclaw/workspace/lib/feishu-user-token.json` 读取

3. **创建 4 个 cron 任务**
   - HDP 12:00: `c563bd27-42fa-4113-b4e4-72b5d8fb9069`
   - HDP 18:00: `f280444f-a3c0-41d1-b15f-0c07d04849e7`
   - HDP 22:00: `a3c28e58-4ccc-4430-bb11-4155bfe8faa8`
   - OpenClaw 更新：`bcfb1ef8-e432-413a-b703-a2068b215522`

4. **修复 OpenClaw 更新任务**
   - target 格式：`feishu:ou_xxx` → `user:ou_xxx`
   - 添加 `--best-effort-deliver` 避免失败

### 验证结果

- ✅ `openclaw cron list` 显示 4 个任务
- ✅ 手动测试 HDP 同步成功（2 条记录，已存在跳过）
- ⚠️ 执行记录写入失败（需要 bitable 权限，后续处理）

### Git 提交

```
commit 4c6b664
fix: 定时任务系统修复
```

---

*最后更新：2026-02-24*
