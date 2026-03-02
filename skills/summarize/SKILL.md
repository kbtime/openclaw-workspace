---
name: summarize
description: 文本摘要和总结工具。使用场景：(1) 总结长文章为简短摘要 (2) 提取文档关键信息 (3) 生成内容概要。关键词：总结、摘要、summarize、概括、提炼
---

# Summarize - 文本摘要工具

自动将长文本内容总结为简洁的摘要。

## 功能特点

- ✅ 支持多种摘要长度（简短/中等/详细）
- ✅ 支持多种语言（中文/英文）
- ✅ 提取关键信息和要点
- ✅ 保持原文核心意思

## 使用方法

### 基本摘要

```bash
node scripts/summarize.js "要总结的文本内容"
```

### 指定摘要长度

```bash
node scripts/summarize.js "要总结的文本内容" --length short
node scripts/summarize.js "要总结的文本内容" --length medium
node scripts/summarize.js "要总结的文本内容" --length long
```

### 从文件读取

```bash
node scripts/summarize.js --file article.txt
```

### 指定语言

```bash
node scripts/summarize.js "Text to summarize" --lang en
node scripts/summarize.js "要总结的中文文本" --lang zh
```

## 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--length` | medium | 摘要长度 (short/medium/long) |
| `--lang` | auto | 语言 (auto/zh/en) |
| `--file` | - | 从文件读取内容 |
| `--format` | text | 输出格式 (text/json/bullet) |
| `--sentences` | 3 | 摘要句子数量 |

## 输出格式

### 文本格式（默认）

```
【摘要】
这是自动生成的文本摘要，包含原文的核心内容和关键信息。

【关键要点】
• 要点 1
• 要点 2
• 要点 3
```

### JSON 格式

```json
{
  "summary": "摘要内容",
  "keyPoints": ["要点 1", "要点 2", "要点 3"],
  "originalLength": 1000,
  "summaryLength": 100,
  "compressionRatio": 0.1
}
```

### 列表格式

```
关键要点：
- 要点 1
- 要点 2
- 要点 3
```

## 示例

### 总结新闻文章

```bash
node scripts/summarize.js "$(cat news.txt)" --length short --format bullet
```

### 总结会议记录

```bash
node scripts/summarize.js --file meeting-notes.txt --lang zh --sentences 5
```

### 生成 JSON 格式摘要

```bash
node scripts/summarize.js "Long text..." --format json
```

## 集成示例

### 与 pipe 配合使用

```bash
cat article.txt | node scripts/summarize.js
```

### 保存摘要到文件

```bash
node scripts/summarize.js --file input.txt > summary.txt
```

## 注意事项

1. 超长文本会自动分段处理
2. 技术文档建议使用 `--length long`
3. 新闻文章建议使用 `--length short`
4. 支持自动检测语言

---

**最后更新**: 2026-02-20
**来源**: https://clawhub.ai/steipete/summarize
