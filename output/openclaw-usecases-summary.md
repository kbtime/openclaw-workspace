# OpenClaw 使用场景大全

> 来源：https://github.com/hesamsheikh/awesome-openclaw-usecases
> 整理：十三香
> 日期：2026-02-27

---

## 一、内容消费类

### 1. Daily Reddit Digest
**痛点**：每天要浏览多个 subreddit 找优质内容，浪费时间

**功能**：
- 每天自动抓取指定 subreddit 的热门帖子
- 根据你的偏好过滤（如排除 meme）
- 每天 5 点发送摘要

**所需技能**：`reddit-readonly`

---

### 2. Daily YouTube Digest
**痛点**：YouTube 算法经常漏掉你关注的频道更新

**功能**：
- 自动获取你喜欢的频道最新视频
- 提取视频摘要和关键点
- 每天发送摘要

**所需技能**：`youtube-full`

---

### 3. Multi-Source Tech News Digest
**痛点**：科技新闻分散在 RSS、Twitter、GitHub 等多个来源

**功能**：
- 聚合 109+ 来源（RSS 46个、Twitter 44个、GitHub 19个）
- 自动去重、质量评分
- 每天发送摘要到 Discord/Telegram/Email

**所需技能**：`tech-news-digest`、`web_search`

---

### 4. AI Earnings Tracker
**痛点**：财报季要跟踪多家公司的财报日期和结果

**功能**：
- 每周日预览下周科技/AI公司财报
- 自动跟踪你关心的公司
- 财报发布后自动搜索并生成摘要

**所需技能**：`web_search`、Cron

---

## 二、内容创作类

### 5. YouTube Content Pipeline
**痛点**：视频创作者要找灵感、研究、跟踪内容

**功能**：
- 每小时扫描 AI 新闻，推送视频创意
- 维护 90 天视频目录避免重复
- Slack 分享链接时自动研究并生成大纲

**所需技能**：`web_search`、`x-research-v2`、`knowledge-base`、Asana

---

### 6. Multi-Agent Content Factory
**痛点**：内容创作需要研究、写作、设计三个阶段

**功能**：
- 研究Agent：每天早上扫描热点和竞品
- 写作Agent：根据研究结果写脚本/文章
- 缩略图Agent：生成封面图

**所需技能**：Discord 多频道、`sessions_spawn`、图片生成

---

### 7. Custom Morning Brief
**痛点**：每天早上要花 30 分钟浏览新闻、日历、任务

**功能**：
- 每天 8 点发送定制化早报
- 包含：新闻、任务、内容创意、AI推荐
- 隔夜生成内容草稿

**所需技能**：Telegram/Discord、任务管理集成

---

## 三、自动化开发类

### 8. Goal-Driven Autonomous Tasks
**痛点**：有大目标但难以分解成日常任务

**功能**：
- 一次输入所有目标
- 每天自动生成 4-5 个可执行任务
- 自动执行并跟踪
- 隔夜构建 Mini App

**所需技能**：`sessions_spawn`、Next.js

---

### 9. Autonomous Game Dev Pipeline
**痛点**：独立开发者要同时开发多个游戏

**功能**：
- 自动从队列选择下一个游戏
- 编写 HTML5/CSS3/JS 代码
- 自动注册、文档、Git 提交
- "Bugs First" 策略：先修复 bug 再开发新功能
- 每 7 分钟完成一个游戏或修复

**所需技能**：游戏开发规则文件、Git

---

### 10. Autonomous Project Management
**痛点**：复杂项目需要多任务并行，传统 Orchestrator 是瓶颈

**功能**：
- 去中心化协调：通过共享 STATE.yaml 文件
- 多个 subagent 并行工作
- 无需中央调度器

**所需技能**：`sessions_spawn`、STATE.yaml 模式

---

## 四、基础设施类

### 11. Self-Healing Home Server
**痛点**：家庭服务器需要 24/7 监控和维护

**功能**：
- 自动健康检查和告警
- 自愈：检测问题并自动修复
- 基础设施管理（Terraform、Ansible、K8s）
- 每日系统健康简报

**所需技能**：SSH、`kubectl`、Terraform、Ansible

---

### 12. n8n Workflow Orchestration
**痛点**：让 AI 直接管理 API 密钥有安全风险

**功能**：
- AI 调用 n8n webhook，不接触凭证
- 凭证存在 n8n，可视化可锁定
- 所有集成可审计

**所需技能**：n8n、Docker

---

### 13. Dynamic Dashboard
**痛点**：静态仪表盘数据过时，手动更新繁琐

**功能**：
- 实时监控多数据源（API、数据库、社交媒体）
- 子 Agent 并行获取数据
- 自动告警

**所需技能**：`sessions_spawn`、`github`、数据库

---

## 五、个人助理类

### 14. Personal CRM
**痛点**：手动维护联系人关系困难

**功能**：
- 自动从邮件和日历发现联系人
- 自然语言查询："我认识谁在 Google？"
- 每日会议准备简报

**所需技能**：`gog`（Google Workspace）、SQLite

---

### 15. Health & Symptom Tracker
**痛点**：追踪食物和症状需要持续记录

**功能**：
- 在 Telegram 记录食物和症状
- 每天 3 次提醒记录
- 每周分析模式，识别触发因素

**所需技能**：Cron、Telegram topic

---

### 16. Second Brain
**痛点**：笔记应用太复杂，最后都不用了

**功能**：
- 发消息给 Bot 就记录
- 语义搜索所有记忆
- Next.js 仪表盘浏览

**所需技能**：Telegram/Discord、Next.js

---

### 17. Family Calendar & Household Assistant
**痛点**：家庭有 5+ 个日历，家务协调混乱

**功能**：
- 聚合所有家庭日历到早报
- 监控消息自动创建日历事件
- 家庭库存管理

**所需技能**：日历 API、`imessage`、Telegram

---

### 18. Inbox De-clutter
**痛点**：Newsletter 堆积如山

**功能**：
- 每天读取 Newsletter 邮件
- 生成摘要发送给你
- 根据反馈学习偏好

**所需技能**：`gmail-oauth`

---

### 19. Multi-Channel Assistant
**痛点**：在不同 App 之间切换管理任务

**功能**：
- Telegram 主题路由（不同主题不同功能）
- Slack 团队协作
- Google Workspace 集成
- Todoist/Asana 任务管理

**所需技能**：`gog`、Slack、Todoist、Asana

---

### 20. Phone-Based Personal Assistant
**痛点**：想从任何电话访问 AI，不需要智能手机

**功能**：
- 打电话给 AI 助手
- 语音获取日历、Jira、搜索结果
- 免提操作

**所需技能**：`ClawdTalk`、Telnyx

---

## 六、商业应用类

### 21. Multi-Channel Customer Service
**痛点**：小企业要管理 WhatsApp、Instagram、邮件、评论

**功能**：
- 统一收件箱
- 24/7 AI 自动回复
- 复杂问题人工转接

**所需技能**：WhatsApp Business API、Instagram API、Gmail

---

### 22. Event Guest Confirmation
**痛点**：手动打电话确认活动嘉宾出席

**功能**：
- 自动拨打嘉宾电话
- 确认出席、收集备注
- 生成总结报告

**所需技能**：`SuperCall`、Twilio

---

### 23. Project State Management
**痛点**：Kanban 板静态，需要手动更新

**功能**：
- 事件驱动状态更新
- 自然语言查询项目状态
- Git 提交关联项目事件

**所需技能**：数据库、`github`、Cron

---

### 24. Todoist Task Manager
**痛点**：长时间运行的 Agent 任务不透明

**功能**：
- 可视化 Agent 状态到 Todoist
- 实时流式日志
- 自动检测停滞任务

**所需技能**：Todoist API

---

## 七、知识管理类

### 25. Knowledge Base (RAG)
**痛点**：收藏的文章、推文找不到

**功能**：
- 发送 URL 自动入库
- 语义搜索所有内容
- 其他工作流可查询

**所需技能**：`knowledge-base`、`web_fetch`

---

### 26. Semantic Memory Search
**痛点**：OpenClaw 记忆文件多了无法搜索

**功能**：
- 向量化所有记忆文件
- 语义搜索（按意思搜索，不只是关键词）
- 文件变更自动重新索引

**所需技能**：`memsearch`、Python

---

### 27. X Account Analysis
**痛点**：X 分析工具贵且只关注数据

**功能**：
- 获取你的推文
- 分析内容质量、模式
- 为什么有的爆有的不爆

**所需技能**：`bird`

---

### 28. Market Research & Product Factory
**痛点**：不知道做什么产品

**功能**：
- 从 Reddit/X 挖掘真实痛点
- 识别产品机会
- 自动构建 MVP

**所需技能**：`last-30-days`

---

## 八、金融类

### 29. Polymarket Autopilot
**痛点**：手动监控预测市场耗时

**功能**：
- 纸上交易（无真实资金风险）
- 自定义策略（TAIL、BONDING）
- 每日摘要和回测

**所需技能**：`web_search`、数据库、Discord

---

## 总结

### 按类别统计

| 类别 | 用例数量 |
|------|---------|
| 内容消费 | 4 |
| 内容创作 | 3 |
| 自动化开发 | 3 |
| 基础设施 | 3 |
| 个人助理 | 7 |
| 商业应用 | 4 |
| 知识管理 | 4 |
| 金融 | 1 |
| **总计** | **29** |

### 核心模式

1. **Cron + 通知**：定时执行，发送摘要
2. **Subagent 并行**：多任务同时进行
3. **知识库 RAG**：语义搜索
4. **多渠道集成**：Telegram/Discord/Slack/Email
5. **自动化工作流**：从研究到执行全自动

---

**整理：十三香 🌶️**
**来源：awesome-openclaw-usecases**
