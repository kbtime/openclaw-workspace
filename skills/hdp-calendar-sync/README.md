# HDP 课程日历同步工具

自动将 HDP 系统的课程行程同步到飞书日历。

## 快速开始

### 1. 安装依赖

```bash
cd ~/.openclaw/workspace/skills/hdp-calendar-sync
npm install playwright
```

### 2. 设置环境变量

```bash
export FEISHU_USER_TOKEN="u-your-token-here"
export FEISHU_CALENDAR_ID="feishu.cn_xxxxxx@group.calendar.feishu.cn"
```

### 3. 运行同步

```bash
node scripts/sync.js
```

## 详细文档

请查看 [SKILL.md](./SKILL.md) 获取完整使用说明。

## 技术实现

- **Playwright**: 用于自动化登录 HDP 系统
- **Fetch API**: 调用飞书日历 API
- **Crypto**: 生成事件唯一 ID 用于去重

## 开发说明

### 添加新的字段映射

编辑 `scripts/sync.js` 中的 `parseScheduleInfo()` 函数：

```javascript
// 提取新字段
const newFieldMatch = text.match(/字段名 [：:](.+)/);
if (newFieldMatch) result.newField = newFieldMatch[1].trim();
```

### 修改日历事件格式

编辑 `buildCalendarEvent()` 函数中的标题和描述构建逻辑。

### 自定义去重逻辑

编辑 `checkEventExists()` 函数，可以实现更复杂的去重策略。

## 许可证

MIT
