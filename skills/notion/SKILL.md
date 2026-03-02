---
name: Notion
description: Notion 集成 - 读写 Notion 页面和数据库。支持创建、更新、查询页面和数据库操作。
read_when:
  - 用户提到 Notion、笔记、数据库
  - 需要操作 Notion 页面
  - 需要查询 Notion 数据库
metadata:
  clawdbot:
    emoji: 📝
    requires:
      env:
        - NOTION_API_KEY
allowed-tools: Bash(curl:*)
---

# Notion Skill

Notion API 集成，支持页面和数据库操作。

## 配置

**API Key**: 从环境变量 `NOTION_API_KEY` 读取

**已集成的页面**: https://www.notion.so/myopenclaw-30e8acccbede808d98b2d174a0cdf8c1

## API 端点

Base URL: `https://api.notion.com/v1`

Headers:
```
Authorization: Bearer {NOTION_API_KEY}
Content-Type: application/json
Notion-Version: 2022-06-28
```

## 常用操作

### 1. 获取页面信息
```bash
curl -X GET "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"
```

### 2. 获取页面内容（块）
```bash
curl -X GET "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"
```

### 3. 创建页面
```bash
curl -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Notion-Version: 2022-06-28" \
  -d '{
    "parent": {"page_id": "父页面ID"},
    "properties": {
      "title": [{"text": {"content": "页面标题"}}]
    }
  }'
```

### 4. 添加内容块
```bash
curl -X PATCH "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Notion-Version: 2022-06-28" \
  -d '{
    "children": [
      {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
          "rich_text": [{"type": "text", "text": {"content": "段落内容"}}]
        }
      }
    ]
  }'
```

### 5. 查询数据库
```bash
curl -X POST "https://api.notion.com/v1/databases/{database_id}/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Notion-Version: 2022-06-28" \
  -d '{}'
```

### 6. 搜索
```bash
curl -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Notion-Version: 2022-06-28" \
  -d '{
    "query": "搜索关键词",
    "filter": {"property": "object", "value": "page"}
  }'
```

## 页面 ID 格式

Notion 页面 URL 格式: `https://www.notion.so/{page_name}-{page_id}`

例如: `https://www.notion.so/myopenclaw-30e8acccbede808d98b2d174a0cdf8c1`
- 页面 ID: `30e8acccbede808d98b2d174a0cdf8c1`
- 带连字符格式: `30e8accc-bede-808d-98b2-d174a0cdf8c1`

## 注意事项

1. 集成需要在 Notion 页面设置中授权
2. API 有请求频率限制（3 requests/second）
3. 页面 ID 需要带连字符格式调用 API
