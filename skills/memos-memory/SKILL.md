---
name: memos-memory
description: MemOS 记忆系统集成 - 持久化记忆存储与检索。使用场景：(1) 存储用户对话和偏好到云端记忆库 (2) 搜索召回相关记忆片段 (3) 需要跨会话记忆能力时。关键词：记忆、memory、记住、回忆、偏好、memos、memos
---

# MemOS 记忆系统

通过 MemOS API 实现持久化记忆能力，让你能记住用户的偏好、历史对话和重要信息。

## 环境变量

系统已配置：
- `MEMOS_API_KEY` - API 密钥
- `MEMOS_BASE_URL` - `https://memos.memtensor.cn/api/openmem/v1`

## 核心 API

### 1. 添加消息（生成记忆）

```bash
curl -X POST "$MEMOS_BASE_URL/add/message" \
  -H "Authorization: Token $MEMOS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<用户ID>",
    "conversation_id": "<会话ID>",
    "messages": [
      {"role": "user", "content": "用户说的内容"},
      {"role": "assistant", "content": "助手回复"}
    ]
  }'
```

**参数说明：**
- `user_id`: 用户唯一标识（建议用 `feishu:<open_id>` 格式）
- `conversation_id`: 会话标识（可用日期或 UUID）
- `messages`: 对话消息数组

### 2. 搜索记忆

```bash
curl -X POST "$MEMOS_BASE_URL/search/memory" \
  -H "Authorization: Token $MEMOS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<用户ID>",
    "query": "搜索关键词或问题",
    "top_k": 10
  }'
```

**返回内容：**
- `memory_detail_list`: 事实记忆（用户说过什么）
- `preference_detail_list`: 用户偏好
- `tool_memory_detail_list`: 工具使用经验
- `skill_detail_list`: 技能记忆

## 使用流程

### 会话开始时
1. 用 `search/memory` 搜索相关记忆
2. 加载用户偏好和历史上下文

### 会话进行中
1. 重要对话后调用 `add/message` 存储
2. 记住用户提到的偏好、事实

### 什么时候存储
- 用户明确表达偏好（"我喜欢..."、"不要..."）
- 重要事实（生日、地址、项目信息）
- 用户纠正你的回答
- 达成的重要决定

## 快捷脚本

使用封装好的脚本简化调用：

```bash
# 搜索记忆
~/.openclaw/workspace/skills/memos-memory/scripts/memos.sh search "用户喜欢吃什么" "feishu:ou_xxx"

# 添加记忆
~/.openclaw/workspace/skills/memos-memory/scripts/memos.sh add "feishu:ou_xxx" "conv_001" '[{"role":"user","content":"我喜欢吃草莓"}]'
```

## 用户 ID 格式

按渠道区分用户：
- Feishu: `feishu:<open_id>`
- Telegram: `telegram:<user_id>`
- Discord: `discord:<user_id>`
- 通用: `user:<identifier>`
