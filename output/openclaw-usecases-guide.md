# OpenClaw 使用场景大全

> 来源：https://github.com/hesamsheikh/awesome-openclaw-usecases
> 整理：十三香
> 日期：2026-02-28

---

## 目录

1. [内容消费](#一内容消费)
2. [自动化与工作流](#二自动化与工作流)
3. [基础设施](#三基础设施)
4. [项目管理](#四项目管理)
5. [个人助理](#五个人助理)
6. [知识管理](#六知识管理)
7. [商业应用](#七商业应用)

---

## 一、内容消费

### 1. Daily Reddit Digest
**痛点**：每天浏览多个子版块耗时，难以筛选感兴趣的内容

**功能**：
- 每天自动获取指定子版块的热门帖子
- 根据用户偏好筛选内容（排除表情包等）
- 下午 5 点推送摘要

**所需技能**：`reddit-readonly`

**设置**：
```text
我想要你每天给我推送以下子版块的精选内容：
<paste the list here>
创建一个独立的记忆来记录我喜欢的内容类型，
每天问我是否喜欢你提供的内容，保存我的偏好作为规则。
每天下午 5 点运行这个过程并给我摘要。
```

---

### 2. Daily YouTube Digest
**痛点**：YouTube 通知不可靠，经常错过关注的频道更新

**功能**：
- 获取你喜欢的频道最新视频
- 提取视频字幕并总结关键内容
- 每天或按需推送摘要

**所需技能**：`youtube-full`

**设置**：
```text
安装 youtube-full 技能并为我设置好。
每天早上 8 点，获取我关注频道的最新视频，
总结每个视频的要点，推送到 Telegram。
```

---

### 3. X Account Analysis
**痛点**：想要分析自己 X 账号的内容质量，但付费工具太贵

**功能**：
- 分析你的推文模式和表现
- 找出什么内容容易爆
- 识别高互动和低互动的原因

**所需技能**：`bird`

**设置**：
```text
获取我过去 100 条推文，分析：
- 哪些内容模式让我爆火？
- 什么话题获得最多互动？
- 为什么有些推文 1000+ 赞，有些不到 5 赞？
```

---

### 4. Multi-Source Tech News Digest
**痛点**：需要从多个来源获取科技新闻，手动整理太耗时

**功能**：
- 聚合 109+ 来源：RSS（46）、Twitter/X（44）、GitHub（19）、Web 搜索（4）
- 自动去重、质量评分
- 每天推送精选摘要到 Discord/Email/Telegram

**所需技能**：`tech-news-digest`、`gog`（可选用于邮件）

**设置**：
```text
安装 tech-news-digest 技能。
设置每天早上 9 点发送科技摘要到 Discord #tech-news 频道。
也发送到我的邮箱 myemail@example.com。
```

---

## 二、自动化与工作流

### 5. Goal-Driven Autonomous Tasks
**痛点**：有目标但不知道每天该做什么，执行更是耗时

**功能**：
- 你只需倾倒目标，Agent 自动生成每日任务
- 自动执行任务，包括构建小程序
- 追踪进度，提供看板视图
- 可设置每晚自动构建一个惊喜小程序

**所需技能**：Telegram/Discord、`sessions_spawn`

**设置**：
```text
以下是我的目标和使命，记住所有这些：

职业：
- 把 YouTube 频道做到 10 万订阅
- Q3 前发布我的 SaaS 产品
- 建立 AI 教育社区

个人：
- 每月读 2 本书
- 学习西班牙语

每天早上生成 4-5 个你能自主完成的任务，
追踪进度到一个看板上。
```

---

### 6. YouTube Content Pipeline
**痛点**：作为 YouTuber，每天找选题、做研究太耗时

**功能**：
- 每小时扫描 AI 新闻并推送选题到 Telegram
- 维护 90 天视频目录避免重复
- SQLite + 向量去重，不推送相同选题
- Slack 分享链接时自动研究并创建 Asana 卡片

**所需技能**：`web_search`、`x-research-v2`、`knowledge-base`、Asana

**设置**：
```text
每小时运行一次：
1. 搜索网络和 X/Twitter 的 AI 热门新闻
2. 检查我 90 天 YouTube 目录避免重复
3. 检查向量相似度避免重复选题
4. 如果是新的，推送选题到 Telegram

当我在 Slack #ai_trends 分享链接时：
1. 研究该话题
2. 搜索 X 相关帖子
3. 查询知识库
4. 创建 Asana 卡片并附完整大纲
```

---

### 7. Multi-Agent Content Factory
**痛点**：内容创作需要研究、写作、设计三步，每步都耗时

**功能**：
- 研究Agent：扫描热门话题、竞品内容
- 写作Agent：写完整脚本/文章/通讯草稿
- 缩略图Agent：生成封面图
- 每个 Agent 在独立 Discord 频道工作
- 可设置每天早上 8 点自动运行

**所需技能**：Discord 多频道、`sessions_spawn`、图片生成

**设置**：
```text
我要在 Discord 里建立一个内容工厂：

1. 研究Agent (#research)：每天早上 8 点，研究我领域内的热门话题，
   推送前 5 个内容机会

2. 写作Agent (#scripts)：根据研究Agent的最佳选题，
   写完整的脚本/草稿

3. 缩略图Agent (#thumbnails)：为内容生成封面图
```

---

### 8. Autonomous Game Dev Pipeline
**痛点**：一个人开发 40+ 教育游戏太慢

**功能**：
- 全自动游戏开发生命周期
- "Bugs First" 策略：先修 bug 再开发新功能
- 每 7 分钟产出一个新游戏或 bugfix
- 自动注册、文档、Git 提交

**所需技能**：文件系统、Git

**核心 Prompt**：
```text
你是一个网页游戏开发专家。
你的目标是开发队列中的下一个游戏。

请按顺序分析以下上下文文件：

1. BUG 上下文（最高优先级）：
   @[bugs/]
   如果有文件，只修复第一个 bug

2. 队列上下文（下一个游戏）：
   @[development-queue.md]
   找到标记为 [NEXT] 的游戏

3. 设计规则：
   @[game-design-rules.md]
   严格遵循：纯 HTML/CSS/JS、移动端优先

4. 游戏规格：
   @[games-backlog/]
```

---

## 三、基础设施

### 9. n8n Workflow Orchestration
**痛点**：让 AI 直接管理 API 密钥有安全风险

**功能**：
- OpenClaw 通过 webhook 调用 n8n 工作流
- API 密钥只存在 n8n，Agent 永远看不到
- 所有工作流可视化可检查
- 可以锁定工作流防止 Agent 修改

**架构**：
```
OpenClaw ──webhook──> n8n Workflow ──API调用──> 外部服务
（无密钥）              （锁定，有密钥）
```

**所需技能**：n8n API、`fetch`

**设置**：
```text
创建一个 n8n 工作流：
当 GitHub issue 被标记为 urgent 时，
发送 Slack 消息给我。

创建好后，告诉我 webhook URL，
以后我只调用这个 webhook，不直接操作 API。
```

---

### 10. Self-Healing Home Server
**痛点**：家庭服务器 24/7 待命，服务随时可能挂掉

**功能**：
- 自动健康监控：Cron 检查服务、部署、资源
- 自愈能力：检测问题并自动修复（重启 pod、扩容、修复配置）
- 基础设施管理：写和应用 Terraform/Ansible/K8s
- 早报：每天系统健康、日历、天气、任务状态
- 邮件分类：扫描收件箱、标记待办、归档噪音
- 安全审计：定期扫描硬编码密钥、特权容器

**所需技能**：SSH、`kubectl`、`terraform`、`ansible`、`1password` CLI、`gog`

**设置**：
```text
你是一个基础设施管理 Agent。

访问：
- SSH 到 192.168.1.0/24 网络的所有机器
- kubectl 访问 K8s 集群
- Terraform/Ansible 配置

每天早上 7 点：
1. 检查所有服务健康状态
2. 检查磁盘、CPU、内存
3. 检查证书过期
4. 检查 pod 崩溃
5. 如果发现问题，自动修复并通知我
```

---

## 四、项目管理

### 11. Autonomous Project Management
**痛点**：传统编排模式让主 Agent 成为瓶颈

**功能**：
- 去中心化协调：Agent 读/写共享 STATE.yaml 文件
- 并行执行：多个子 Agent 同时处理独立任务
- 无编排开销：主会话保持轻量（CEO 模式——只做策略）
- 自文档化：所有任务状态持久化在版本控制文件中

**核心模式：STATE.yaml**：
```yaml
project: website-redesign
updated: 2026-02-10T14:30:00Z

tasks:
  - id: homepage-hero
    status: in_progress
    owner: pm-frontend
    notes: "正在做响应式布局"
    
  - id: api-auth
    status: done
    owner: pm-backend
    output: "src/api/auth.ts"
    
  - id: content-migration
    status: blocked
    owner: pm-content
    blocked_by: api-auth
```

---

### 12. Project State Management
**痛点**：看板静态，需要手动更新，上下文丢失

**功能**：
- 事件驱动更新："完成 X，阻塞在 Y" → 自动状态转换
- 自然语言查询："项目状态是什么？"、"为什么我们改了？"
- 每日站会摘要：昨天做了什么、今天计划什么、什么被阻塞
- Git 集成：链接提交到项目事件

**数据库结构**：
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  status TEXT,
  current_phase TEXT
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  event_type TEXT,
  description TEXT,
  context TEXT,
  timestamp TIMESTAMPTZ
);
```

---

### 13. Dynamic Dashboard
**痛点**：静态仪表盘数据陈旧，手动更新麻烦

**功能**：
- 多数据源并行监控（API、数据库、GitHub、社交媒体）
- 为每个数据源生成子 Agent 避免阻塞
- 聚合结果到统一仪表盘
- 每 N 分钟自动更新
- 指标超过阈值时发送警报

**示例监控**：
- GitHub：stars、forks、open issues
- 社交媒体：Twitter 提及、Reddit 讨论
- 市场：Polymarket 交易量
- 系统健康：CPU、内存、磁盘

---

### 14. Todoist Task Manager
**痛点**：Agent 执行长任务时，用户不知道进度

**功能**：
- 在 Todoist 创建任务并显示状态
- 把 Agent 的"计划"写入任务描述
- 实时添加子步骤完成日志为评论
- 心跳脚本检查停滞任务并通知

**设置**：
1. 创建 Todoist 项目和区块：`🟡 进行中`、`🟠 等待`、`🟢 完成`
2. 获取 API Token
3. Agent 自动创建脚本管理任务

---

## 五、个人助理

### 15. Custom Morning Brief
**痛点**：每天早上花 30 分钟刷新闻、查日历、看待办

**功能**：
- 每天固定时间发送定制早报
- 研究与你兴趣相关的隔夜新闻
- 审查待办列表并突出当天任务
- 生成创意输出（完整脚本、邮件草稿）
- 推荐 Agent 可以自主完成的任务

**设置**：
```text
设置每天早上 8 点的早报，通过 Telegram 发送。

报告包括：
1. 与我兴趣相关的新闻（AI、创业、科技）
2. 今天可以创作的内容想法（写完整草稿，不只是标题）
3. 今天需要完成的任务（从我的待办列表拉取）
4. 你今天可以帮我完成的任务推荐
```

---

### 16. Multi-Channel Assistant
**痛点**：在不同应用间切换管理任务、日程、消息太累

**功能**：
- Telegram 为主界面，按主题路由
- Slack 集成用于团队协作
- Google Workspace：创建日历事件、管理邮件、上传 Drive
- Todoist 快速任务捕获
- Asana 项目管理
- 自动提醒：垃圾日、每周公司信等

**Telegram 主题设置**：
- `config` — 系统设置
- `updates` — 状态和通知
- `video-ideas` — 内容管道
- `personal-crm` — 联系人管理
- `earnings` — 财务追踪
- `knowledge-base` — 知识库

---

### 17. Phone-Based Personal Assistant
**痛点**：想从任何电话访问 AI，不需要智能手机

**功能**：
- 拨打电话号码与 AI 语音对话
- 语音获取日历提醒、Jira 更新、网络搜索结果
- 驾驶或双手占用时的免提助手

**所需技能**：`ClawdTalk`、日历技能、Jira 技能

**设置**：
```text
你可以通过电话访问。
当我打电话时，问候我并问需要什么帮助。

日历查询："今天日程是什么？"
Jira 更新："显示我的未完成工单"
网络搜索："搜索最新的 AI Agent 新闻"
```

---

### 18. Inbox De-clutter
**痛点**：通讯邮件堆积如山，从来不打开

**功能**：
- 每天读取过去 24 小时的通讯邮件
- 提取最重要的内容生成摘要
- 附上链接方便深入阅读
- 根据反馈优化筛选偏好

**所需技能**：`Gmail OAuth`

**设置**：
```text
每天晚上 8 点运行 cron job：
1. 读取过去 24 小时的通讯邮件
2. 提取最重要的内容并附链接
3. 发送摘要给我
4. 询问反馈，更新偏好记忆
```

---

### 19. Personal CRM
**痛点**：手动追踪见过谁、讨论了什么，重要跟进容易遗漏

**功能**：
- 每日扫描邮件和日历发现新联系人和互动
- 结构化存储联系人及关系上下文
- 自然语言查询："我知道什么关于某人？"
- 每日会议准备简报：研究外部参会者

**设置**：
```text
每天早上 6 点运行 cron job：
1. 扫描过去 24 小时的 Gmail 和日历
2. 提取新联系人并更新现有联系人
3. 记录互动（会议、邮件）及时间戳

每天早上 7 点：
1. 检查今天日历
2. 为每个外部参会者搜索我的 CRM 和邮件历史
3. 发送简报：他们是谁、上次聊什么、有什么跟进项
```

---

### 20. Health & Symptom Tracker
**痛点**：识别食物敏感需要持续记录，很繁琐

**功能**：
- 在 Telegram 主题发送食物和症状，自动记录
- 每天 3 次提醒（早、中、晚）
- 分析模式识别潜在触发因素

**设置**：
```text
在 "health-tracker" 主题：
1. 解析消息中的食物和症状
2. 记录到 ~/clawd/memory/health-log.md

设置 3 个每日提醒：
- 8 AM: "🍳 记录早餐"
- 1 PM: "🥗 记录午餐"
- 7 PM: "🍽️ 记录晚餐和任何症状"

每周日分析过去一周日志，识别模式。
```

---

### 21. Family Calendar & Household Assistant
**痛点**：家庭有 5+ 个日历分散在不同平台，家务协调靠短信

**功能**：
- 聚合所有家庭日历到早报
- 监控消息自动创建日历事件
- 添加驾驶时间缓冲
- 家庭库存管理
- 杂货协调

**设置**：
```text
每天早上 8 点：
1. 获取我 Google 工作日历
2. 获取共享家庭日历
3. 获取伴侣日历
4. 检查 ~/Documents/school-calendars/ 的新 PDF → OCR 提取
5. 检查近期邮件的日历附件

编译成单一简报：
- 今天事件（按来源颜色编码）
- 未来 3 天冲突预警
- 昨天新增事件
```

---

### 22. Multi-Agent Team
**痛点**：一个 Agent 不能做好所有事情，需要专业化

**功能**：
- 多个专业化 Agent 各有角色、性格、优化模型
- 共享记忆：项目文档、目标、关键决策
- 私有上下文：每个 Agent 有自己的对话历史
- 单一控制平面：一个 Telegram 群聊控制所有
- 计划每日任务：内容提示、竞品监控、指标追踪
- 并行执行：多个 Agent 同时处理独立任务

**示例团队**：
- **Milo（策略主管）**：战略规划、协调、目标追踪
- **Josh（商业增长）**：市场研究、竞品分析、销售
- **Dev（开发）**：代码实现、bug 修复、技术架构
- **Maya（营销内容）**：社交媒体、内容创作、品牌

---

## 六、知识管理

### 23. Second Brain
**痛点**：有想法、发现好链接、听到好书推荐，但没有好的记录系统

**功能**：
- 通过 Telegram/iMessage/Discord 发送任何内容，立即记住
- OpenClaw 内置记忆系统永久存储
- 自定义 Next.js 仪表盘搜索所有记忆
- 全局搜索（Cmd+K）跨所有记忆、文档、任务
- 无文件夹、无标签——只有文本和搜索

**设置**：
```text
我想建立一个第二大脑系统来查看所有笔记、对话和记忆。
请用 Next.js 构建出来。

包括：
- 可搜索的记忆和对话列表
- 全局搜索（Cmd+K）
- 按日期和类型过滤
- 简洁的 UI
```

---

### 24. Personal Knowledge Base (RAG)
**痛点**：看了文章、推文、视频，但下周找不到

**功能**：
- 在 Telegram/Slack 丢入 URL 自动摄入（文章、推文、YouTube 字幕、PDF）
- 语义搜索："我保存的关于 Agent 记忆的内容是什么？"
- 为其他工作流提供研究支持

**所需技能**：`knowledge-base`、`web_fetch`

**设置**：
```text
当我在 "knowledge-base" 主题丢入 URL 时：
1. 获取内容（文章、推文、YouTube 字幕、PDF）
2. 摄入知识库并附带元数据
3. 回复确认：摄入了什么、分块数量

当我提问时：
1. 语义搜索知识库
2. 返回顶部结果及来源和相关摘录
```

---

### 25. Semantic Memory Search
**痛点**：OpenClaw 记忆是 Markdown 文件，没有搜索功能

**功能**：
- 将所有 Markdown 记忆文件索引到向量数据库（Milvus）
- 语义搜索："我们选了什么缓存方案？"
- 混合搜索（向量 + BM25）+ RRF 重排序
- SHA-256 哈希避免重复嵌入
- 文件监视器自动重新索引

**所需技能**：`memsearch` Python 库

**设置**：
```bash
pip install memsearch
memsearch config init
memsearch index ~/path/to/memory/
memsearch search "我们选了什么缓存方案？"
memsearch watch ~/path/to/memory/  # 实时同步
```

---

## 七、商业应用

### 26. Multi-Channel Customer Service
**痛点**：小企业要管理 WhatsApp、Instagram、邮件、Google 评论，24/7 客服太贵

**功能**：
- 统一收件箱：WhatsApp Business、Instagram DM、Gmail、Google 评论
- AI 自动回复：处理 FAQ、预约请求
- 人工接管：升级复杂问题
- 测试模式：演示系统不影响真实客户
- 业务上下文：训练你的服务、价格、政策

**真实案例**：一家餐厅将响应时间从 4+ 小时降到 2 分钟，80% 咨询自动处理

**所需技能**：WhatsApp Business API、Instagram Graph API、`gog`、Google Business Profile

---

### 27. Market Research & Product Factory
**痛点**：想创业但不知道做什么产品

**功能**：
- 用 Last 30 Days 技能挖掘 Reddit 和 X 的真实痛点
- 发现产品机会
- 让 OpenClaw 构建解决这些痛点的 MVP
- 完整的研究到产品管道

**所需技能**：`last-30-days`

**设置**：
```text
使用 Last 30 Days 技能研究 [你的主题] 的挑战。

组织发现：
- 顶部痛点（按频率排名）
- 具体投诉和功能请求
- 现有解决方案的空白
- 新产品机会

选择一个痛点并让我构建 MVP：
为我构建一个解决 [痛点] 的 MVP。
保持简单——只做核心功能。
发布为可分享的 Web 应用。
```

---

### 28. AI Earnings Tracker
**痛点**：跟踪几十家科技公司的财报太麻烦

**功能**：
- 每周日晚预览：扫描下周财报日历
- 选择关心的公司，安排一次性 cron 任务
- 财报发布后搜索结果，格式化详细摘要
- 推送到 Telegram

**所需技能**：`web_search`、Cron、Telegram

**设置**：
```text
每周日下午 6 点运行 cron job：
1. 搜索下周科技/AI 公司财报日历
2. 过滤我关心的公司（NVDA、MSFT、GOOGL 等）
3. 发送列表到 Telegram "earnings" 主题
4. 等我确认要跟踪哪些

当我回复时：
1. 为每个财报日期安排一次性 cron
2. 财报发布后搜索结果
3. 格式化摘要：beat/miss、收入、EPS、关键指标、AI 亮点、指引
```

---

### 29. Event Guest Confirmation
**痛点**：手动打电话确认 20+ 客人出席太繁琐

**功能**：
- 遍历客人列表（姓名+电话）并逐个拨打
- AI 自我介绍为活动协调员
- 确认出席并收集备注（饮食需求、携带人数等）
- 编译摘要：谁确认、谁拒绝、谁没接、备注

**所需技能**：`SuperCall`、Twilio、OpenAI API

**设置**：
```text
客人列表 — 夏日烧烤，周六 6 月 14 日，下午 4 点，橡树街 23 号

- Sarah Johnson: +15551234567
- Mike Chen: +15559876543
- Rachel Torres: +15555551234
- David Kim: +15558887777

使用 SuperCall 拨打每位客人：
1. 自我介绍为活动协调员
2. 确认活动日期、时间、地点
3. 询问是否出席
4. 收集任何备注
5. 编译摘要发给我
```

---

### 30. Polymarket Autopilot
**痛点**：手动监控预测市场太耗时

**功能**：
- 监控市场数据（价格、交易量、价差）
- 使用可配置策略执行模拟交易
- 追踪投资组合表现、盈亏、胜率
- 每日摘要推送到 Discord

**策略示例**：
- **TAIL**：当交易量激增、动量明显时跟随趋势
- **BONDING**：当市场对新闻过度反应时买入反向仓位
- **SPREAD**：识别定价错误的市场套利机会

**所需技能**：`web_search`、`postgres`、Discord、Cron

---

## 总结

### 按类别统计

| 类别 | 用例数量 |
|------|---------|
| 内容消费 | 4 |
| 自动化与工作流 | 4 |
| 基础设施 | 2 |
| 项目管理 | 4 |
| 个人助理 | 8 |
| 知识管理 | 3 |
| 商业应用 | 5 |
| **总计** | **30** |

### 常用技能

| 技能 | 使用次数 |
|------|---------|
| Telegram/Discord | 15+ |
| Cron 定时任务 | 12+ |
| web_search/web_fetch | 10+ |
| gog (Google Workspace) | 6+ |
| sessions_spawn (子Agent) | 5+ |
| knowledge-base | 4+ |

### 核心模式

1. **定时推送**：Cron + 摘要生成 + 消息推送
2. **多Agent协作**：sessions_spawn + 共享记忆
3. **知识管理**：Markdown + 向量搜索
4. **自动化管道**：研究 → 写作 → 设计 → 发布
5. **安全代理**：n8n webhook 隔离 API 密钥

---

**整理者**：十三香 🌶️
**来源**：https://github.com/hesamsheikh/awesome-openclaw-usecases
