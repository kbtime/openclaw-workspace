---
name: Obsidian
description: Obsidian 知识库集成 - 读写笔记、管理知识库。通过 Local REST API 插件连接 Obsidian。
read_when:
  - 用户提到 Obsidian、笔记、知识库、vault
  - 需要操作 Obsidian 笔记
  - 需要搜索 Obsidian 知识库
metadata:
  clawdbot:
    emoji: 📚
    requires:
      env:
        - OBSIDIAN_API_URL
        - OBSIDIAN_API_KEY
allowed-tools: Bash(curl:*)
---

# Obsidian Skill

Obsidian 知识库集成，通过 Local REST API 插件远程操作 Obsidian。

## 前置要求

1. 安装 Obsidian: https://obsidian.md
2. 安装 **Local REST API** 插件（社区插件）
3. 在插件设置中启用 API 并配置授权

## 配置

**API URL**: 默认 `http://127.0.0.1:27124`
**API Key**: 在 Obsidian Local REST API 插件中生成

## API 端点

Headers:
```
Authorization: Bearer {OBSIDIAN_API_KEY}
Content-Type: application/json
```

## 常用操作

### 1. 列出目录
```bash
curl -X GET "http://127.0.0.1:27124/vault/" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY"
```

### 2. 获取笔记内容
```bash
curl -X GET "http://127.0.0.1:27124/vault/{path/to/note.md}" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Accept: text/markdown"
```

### 3. 创建/更新笔记
```bash
curl -X PUT "http://127.0.0.1:27124/vault/{path/to/note.md}" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: text/markdown" \
  -d "# 笔记标题\n\n笔记内容..."
```

### 4. 追加内容
```bash
curl -X POST "http://127.0.0.1:27124/vault/{path/to/note.md}" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: text/markdown" \
  -d "\n\n追加的内容"
```

### 5. 搜索
```bash
curl -X GET "http://127.0.0.1:27124/search/?query={关键词}" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY"
```

### 6. 删除笔记
```bash
curl -X DELETE "http://127.0.0.1:27124/vault/{path/to/note.md}" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY"
```

### 7. 获取当前笔记（活跃笔记）
```bash
curl -X GET "http://127.0.0.1:27124/active/" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY"
```

### 8. 打开笔记
```bash
curl -X POST "http://127.0.0.1:27124/open/{path/to/note.md}" \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY"
```

## 使用示例

### 创建每日笔记
```bash
TODAY=$(date +%Y-%m-%d)
curl -X PUT "http://127.0.0.1:27124/vault/Daily/$TODAY.md" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: text/markdown" \
  -d "# $TODAY\n\n## 待办\n- [ ] 任务1\n- [ ] 任务2\n\n## 笔记\n"
```

### 搜索标签
```bash
curl -X GET "http://127.0.0.1:27124/search/?query=tag:重要" \
  -H "Authorization: Bearer $API_KEY"
```

## 注意事项

1. Obsidian 必须运行且 Local REST API 插件已启用
2. 默认端口 27124，可在插件设置中修改
3. API Key 在插件设置中生成和管理
4. 路径使用 `/` 分隔，相对于 Vault 根目录
