---
name: mcp-bridge
description: 桥接 OpenClaw 到 MCP (Model Context Protocol) 服务器。通过本地 HTTP 网关调用 MCP 工具。先调用 mcp_list_tools 获取可用工具，再调用 mcp_call_tool 执行。
---

# MCP Bridge Skill

通过本地 HTTP 网关桥接 OpenClaw 到 MCP 服务器。

## 依赖

MCP Bridge 网关必须先启动：

```bash
# 方式一：手动启动
cd /opt/mcp-bridge && python3 bridge.py &

# 方式二：systemd 服务
systemctl start mcp-bridge
```

验证网关状态：
```bash
curl http://127.0.0.1:9712/
# 返回 {"status":"ok","servers":["fs"]}
```

## 工具

### mcp_list_tools

列出指定 MCP 服务器提供的所有工具。

**参数：**
- `server_id` (必需): MCP 服务器 ID，当前可用: `fs`

**返回示例：**
```json
{
  "server": "fs",
  "tools": [
    {
      "name": "read_text_file",
      "description": "读取文件内容",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": {"type": "string"}
        },
        "required": ["path"]
      }
    }
  ]
}
```

**使用流程：**
1. 调用 `mcp_list_tools("fs")` 获取工具列表
2. 查看每个工具的 `inputSchema` 了解参数要求
3. 用 `mcp_call_tool` 调用具体工具

### mcp_call_tool

调用 MCP 服务器上的工具。

**参数：**
- `server_id` (必需): MCP 服务器 ID
- `tool_name` (必需): 要调用的工具名称
- `args` (可选): 工具参数对象

**返回示例：**
```json
{
  "server": "fs",
  "tool": "read_text_file",
  "isError": false,
  "content": [
    {"type": "text", "text": "文件内容..."}
  ]
}
```

## 已配置的 MCP 服务器

| server_id | 描述 | 工具数 |
|-----------|------|--------|
| `fs` | Filesystem MCP Server | 14 |
| `vision` | 智谱视觉理解 MCP | 8 |
| `search` | 智谱联网搜索 MCP | 1 |
| `zread` | 智谱开源仓库 MCP | 3 |
| `reader` | 智谱网页读取 MCP | 1 |

## reader 服务器工具

| 工具名 | 描述 | 主要参数 |
|--------|------|----------|
| `webReader` | 抓取网页内容 | `url`, `return_format`, `retain_images` |

### reader 使用示例

```
# 读取网页
mcp_call_tool("reader", "webReader", {
  "url": "https://example.com",
  "return_format": "markdown"
})
```

## zread 服务器工具

| 工具名 | 描述 | 主要参数 |
|--------|------|----------|
| `search_doc` | 搜索 GitHub 仓库文档 | `repo_name`, `query`, `language` |
| `read_file` | 读取仓库文件内容 | `repo_name`, `file_path` |
| `get_repo_structure` | 获取仓库目录结构 | `repo_name`, `dir_path` |

### zread 使用示例

```
# 搜索仓库文档
mcp_call_tool("zread", "search_doc", {
  "repo_name": "openclaw/openclaw",
  "query": "what is OpenClaw",
  "language": "en"
})

# 读取仓库文件
mcp_call_tool("zread", "read_file", {
  "repo_name": "openclaw/openclaw",
  "file_path": "README.md"
})

# 获取目录结构
mcp_call_tool("zread", "get_repo_structure", {
  "repo_name": "openclaw/openclaw"
})
```

## search 服务器工具

| 工具名 | 描述 | 主要参数 |
|--------|------|----------|
| `webSearchPrime` | 网络搜索 | `search_query`, `location`, `search_recency_filter` |

### search 使用示例

```
# 搜索网络
mcp_call_tool("search", "webSearchPrime", {
  "search_query": "OpenClaw AI agent",
  "location": "cn"
})

# 限定时间范围
mcp_call_tool("search", "webSearchPrime", {
  "search_query": "最新 AI 技术",
  "search_recency_filter": "oneWeek"
})
```

## vision 服务器工具

| 工具名 | 描述 |
|--------|------|
| `image_analysis` | 通用图像理解 |
| `extract_text_from_screenshot` | OCR 文字提取 |
| `diagnose_error_screenshot` | 错误截图分析 |
| `understand_technical_diagram` | 架构图/流程图解读 |
| `analyze_data_visualization` | 图表/仪表盘分析 |
| `ui_to_artifact` | UI 截图转代码 |
| `ui_diff_check` | UI 对比检查 |
| `video_analysis` | 视频场景解析 |

## fs 服务器常用工具

| 工具名 | 描述 | 主要参数 |
|--------|------|----------|
| `read_text_file` | 读取文本文件 | `path` |
| `write_file` | 写入文件 | `path`, `content` |
| `list_directory` | 列出目录 | `path` |
| `create_directory` | 创建目录 | `path` |
| `search_files` | 搜索文件 | `path`, `pattern` |
| `move_file` | 移动/重命名 | `source`, `destination` |
| `get_file_info` | 获取文件信息 | `path` |
| `directory_tree` | 目录树 | `path` |

## 使用示例

```
# 1. 先获取工具列表
mcp_list_tools("fs")

# 2. 读取文件
mcp_call_tool("fs", "read_text_file", {"path": "/data/workspace/test.txt"})

# 3. 写入文件
mcp_call_tool("fs", "write_file", {"path": "/data/workspace/hello.txt", "content": "Hello MCP!"})

# 4. 列出目录
mcp_call_tool("fs", "list_directory", {"path": "/data/workspace"})
```

## 安全策略

- 只允许访问白名单中的 server_id（当前: `fs`）
- filesystem server 只能访问 `/data/workspace` 目录

## 扩展

要添加新的 MCP Server，编辑 `/opt/mcp-bridge/servers.json`：

```json
{
  "fs": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data/workspace"]
  },
  "git": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/data/repo"]
  }
}
```

添加后重启 bridge：`systemctl restart mcp-bridge`
