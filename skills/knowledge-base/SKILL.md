---
name: knowledge-base
description: 知识库查询引擎 - 支持合同审核、制度查询、合规检查。使用向量检索和重排序技术，精准定位相关知识片段。子 Agent 使用 qwen3.5-flash 模型，降低主 Agent 算力消耗。关键词：知识库、合同审核、制度查询、合规检查、向量检索、RAG
---

# 知识库查询引擎

基于向量检索的知识库系统，支持合同审核、制度查询、合规检查等场景。

## 功能特点

- ✅ **向量检索** - 语义相似度搜索，精准定位相关内容
- ✅ **重排序** - 使用 Reranker 模型优化排序
- ✅ **子 Agent** - 独立小模型 (qwen3.5-flash)，降低主 Agent 算力消耗
- ✅ **增量索引** - 只更新修改过的文档
- ✅ **合同审核** - 自动对照制度审核合同

---

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                     主 Agent (GLM-5)                        │
├─────────────────────────────────────────────────────────────┤
│                           │                                 │
│                    调用子 Agent                             │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              子 Agent (qwen3.5-flash)                │   │
│  │                                                      │   │
│  │  ┌──────────────┐      ┌──────────────────────┐    │   │
│  │  │ MD 文档目录   │ ──→  │ SiliconFlow 向量 API  │    │   │
│  │  └──────────────┘      │ Qwen3-Embedding-8B    │    │   │
│  │                        │ Qwen3-Reranker-8B     │    │   │
│  │                        └──────────────────────┘    │   │
│  │                               │                      │   │
│  │                               ▼                      │   │
│  │                      返回相关片段                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 配置信息

### 向量模型

| 配置项 | 值 |
|-------|-----|
| API URL | `https://api.siliconflow.cn` |
| 嵌入模型 | `Qwen/Qwen3-Embedding-8B` |
| 重排序模型 | `Qwen/Qwen3-Reranker-8B` |

### 子 Agent 模型

| 配置项 | 值 |
|-------|-----|
| 提供商 | 阿里云百炼 |
| 模型 | `qwen3.5-flash` |

---

## 知识库目录结构

```
~/.openclaw/workspace/knowledge-base/
├── contracts/         # 合同模板
│   └── 劳动合同模板.md
├── policies/          # 公司制度
│   ├── 报销制度.md
│   └── 请假制度.md
├── templates/         # 审批模板
└── README.md
```

---

## 使用方法

### 索引知识库

```bash
# 首次索引或增量更新
node scripts/agent.js --index

# 强制重建索引
node scripts/agent.js --index --force
```

### 问答查询

```bash
# 基本查询
node scripts/agent.js --query "年假有多少天"

# 指定返回数量
node scripts/agent.js --query "报销流程" --top-k 10
```

### 合同审核

```bash
node scripts/agent.js --review /path/to/contract.md
```

### 查看统计

```bash
node scripts/agent.js --stats
```

---

## API 调用

```javascript
const { search, indexDocuments, getStats } = require('./lib/vector-store');

// 搜索
const results = await search('查询内容', 5);

// 索引
await indexDocuments();

// 统计
const stats = getStats();
```

---

## 添加文档

1. 将 `.md` 文件放入对应分类目录
2. 运行 `node scripts/query.js --index`
3. 文档会自动分块、向量化、索引

---

## 文件结构

```
skills/knowledge-base/
├── SKILL.md              # 本文件
├── lib/
│   ├── embeddings.js     # 向量 API 客户端
│   └── vector-store.js   # 向量存储和检索
└── scripts/
    └── query.js          # 查询脚本
```

---

**最后更新**: 2026-02-25
**版本**: 1.0
