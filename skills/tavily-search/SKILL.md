---
name: tavily-search
description: Tavily AI 网络搜索工具。使用场景：(1) 搜索网络获取实时信息 (2) 查找特定主题的资料 (3) 验证事实或获取最新新闻。关键词：搜索、search、tavily、网络搜索、信息查询
---

# Tavily Web Search

使用 Tavily AI 进行智能网络搜索。

## API Key

- **Key**: `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`
- **Base URL**: `https://api.tavily.com`

## 使用方法

### 基本搜索

```bash
node scripts/search.js "搜索关键词"
```

### 带参数搜索

```bash
node scripts/search.js "搜索关键词" --max-results 5 --search-depth advanced
```

## 环境变量

```bash
export TAVILY_API_KEY="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"
```

## 示例

```bash
# 简单搜索
node scripts/search.js "AI 最新进展"

# 高级搜索
node scripts/search.js "气候变化 2026" --max-results 10 --search-depth advanced

# 包含引用
node scripts/search.js "量子计算" --include-quotes true
```

## 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--max-results` | 5 | 返回结果数量 (1-10) |
| `--search-depth` | basic | 搜索深度 (basic/advanced) |
| `--include-domains` | - | 只包含指定域名 |
| `--exclude-domains` | - | 排除指定域名 |
| `--include-quotes` | false | 是否包含引用 |
| `--include-answer` | false | 是否包含 AI 答案 |
| `--include-raw-content` | false | 是否包含原始内容 |
| `--topic` | general | 搜索主题 (general/news/science) |

## 输出格式

```json
{
  "query": "搜索关键词",
  "answer": "AI 生成的答案（如果请求）",
  "results": [
    {
      "title": "结果标题",
      "url": "结果链接",
      "content": "摘要内容",
      "score": 0.95,
      "published_date": "2026-02-20"
    }
  ]
}
```

## 注意事项

1. API Key 是开发版本，有调用限制
2. 搜索深度 `advanced` 会消耗更多配额
3. 建议设置合理的 `max-results` 避免浪费

---

**最后更新**: 2026-02-20
**来源**: https://clawhub.ai/arun-8687/tavily-search
