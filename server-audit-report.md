# 服务器整理报告

**生成时间**: 2026-02-21 11:42 CST  
**服务器**: OpenClaw 主机

---

## 📊 系统概览

### 磁盘使用
```
文件系统      大小   已用   可用   使用率   挂载点
/dev/vda2      40G   17G   21G    45%     /
/dev/vda1     197M  6.2M  191M    4%     /boot/efi
```

**状态**: ✅ 健康 (45% 使用率，剩余 21G)

### 内存使用
```
总内存：3.8Gi
已用：1.2Gi (32%)
可用：2.6Gi
Swap: 1.0Gi (未使用)
```

**状态**: ✅ 健康

### 系统运行时间
```
运行时间：13 小时 14 分钟
负载平均：0.02, 0.06, 0.09
```

**状态**: ✅ 健康 (负载很低)

---

## 📁 OpenClaw 目录分析

### 工作空间目录大小 (/root/.openclaw/workspace/)

| 目录 | 大小 | 说明 |
|------|------|------|
| `task-board/` | **640M** | ⚠️ 任务看板项目 (Next.js + node_modules) |
| `mermaid-to-excalidraw/` | **320M** | ⚠️ Mermaid 转换工具 (含 node_modules) |
| `~/` | **58M** | 用户主目录备份 |
| `skills/` | **29M** | ✅ 27 个技能文件 |
| `bocha-search-mcp/` | **26M** | MCP 搜索服务 |
| `test/` | **8.1M** | 测试文件 |
| `初一年级学情诊断报告.html` | **2.4M** | 学情报告 |
| `awesome-openclaw-usecases/` | **300K** | 使用案例 |
| `docs/` | **84K** | 文档 |
| `work/` | **52K** | 工作文件 |
| `tools/` | **52K** | 工具脚本 |
| `scripts/` | **48K** | 脚本 |
| `lib/` | **48K** | 库文件 |
| `memory/` | **36K** | 记忆文件 |
| `学情诊断系统.py` | **20K** | 诊断脚本 |
| `Diary/` | **16K** | 日记 |
| `AGENTS.md` | **12K** | 代理配置 |
| `todo/` | **8K** | 待办事项 |
| `keys/` | **8K** | 🔐 密钥文件 |

**工作空间总计**: ~1.1GB

### 大文件 (>10MB)

| 文件 | 位置 | 大小估计 |
|------|------|----------|
| `ffmpeg` | extensions/dingtalk-connector/ | ~50M |
| `skia.*.node` | extensions/qqbot/ (x2) | ~100M each |
| `libggml-*.so` | extensions/qqbot/node-llama-cpp/ (x3) | ~200M each |
| `libvips-cpp.so.8.17.3` | extensions/qqbot/ (x2) | ~50M each |
| `gitRelease.bundle` | extensions/qqbot/node-llama-cpp/ | ~500M |
| `esbuild` | workspace/task-board/ (x2) | ~20M each |
| `next-swc.*.node` | workspace/task-board/ (x2) | ~50M each |
| `vendor-*.js` | workspace/mermaid-to-excalidraw/ | ~50M |
| `model.tflite` | workspace/~/.config/google-chrome/ | ~20M |

**大文件总计**: ~2-3GB (主要是 node_modules 和二进制依赖)

---

## 🗂️ 文件分类统计

### 按类型
- **JavaScript/Node 项目**: 3 个 (task-board, mermaid-to-excalidraw, bocha-search-mcp)
- **Python 脚本**: 2 个 (学情诊断系统，test-oss-*.py)
- **配置文件**: 多个 (.env, openclaw.json, exec-approvals.json)
- **文档**: Markdown 文件 10+ 个
- **HTML 报告**: 1 个 (学情诊断报告)

### 按功能
- **OpenClaw 核心**: openclaw.json, exec-approvals.json, .env
- **技能系统**: skills/ (27 个技能)
- **扩展插件**: extensions/ (feishu, discord, qqbot, wecom, memos, etc.)
- **工作项目**: task-board, mermaid-to-excalidraw, 学情诊断
- **记忆系统**: memory/, MEMORY.md

---

## ⚠️ 需要关注的问题

### 1. node_modules 膨胀
- `task-board/node_modules/`: 640M
- `mermaid-to-excalidraw/node_modules/`: 320M
- `extensions/qqbot/node_modules/`: ~500M (估算)

**建议**: 
- 如果不常用，可以考虑删除 node_modules，需要时重新 `npm install`
- 或者使用 `npm prune` 清理未使用的依赖

### 2. 日志文件
- `/root/.openclaw/logs/`: 目前只有 9.3K (config-audit.jsonl)
- 建议定期检查，避免日志积累

### 3. 临时文件
- `test/` 目录：8.1M (测试文件)
- `test-oss-*.py`: 3 个测试脚本

**建议**: 测试完成后可以清理

### 4. Chrome 缓存
- `~/.config/google-chrome-openclaw/`: 包含 TFLite 模型
- 如果不用浏览器功能，可以清理

---

## ✅ 优化建议

### 立即可做
1. **清理测试文件**: 删除 `test-oss.py`, `test-oss-simple.py` (保留 `test-oss-api.py` 作为参考)
2. **整理 work 目录**: 检查 `work/` 和 `Diary/` 是否有用
3. **清理 todo**: 检查 `todo/` 是否有待办事项

### 中期优化
1. **node_modules 管理**: 
   - 对不活跃的项目运行 `npm prune`
   - 或考虑使用 `pnpm` 替代 `npm` (节省 50%+ 空间)

2. **日志轮转**: 配置日志自动清理 (保留最近 7 天)

3. **备份策略**: 
   - 重要配置 (openclaw.json, .env) 定期备份到 OSS
   - 记忆文件定期归档

### 长期规划
1. **项目归档**: 完成的项目移到 OSS 或本地归档
2. **技能精简**: 移除不用的 skills
3. **扩展清理**: 禁用的扩展可以删除

---

## 📋 行动清单

- [ ] 删除测试脚本 (test-oss.py, test-oss-simple.py)
- [ ] 检查 work/ 和 Diary/ 目录
- [ ] 检查 todo/ 目录
- [ ] 对 task-board 运行 `npm prune`
- [ ] 对 mermaid-to-excalidraw 运行 `npm prune`
- [ ] 配置日志轮转
- [ ] 设置定期备份到 OSS

---

## 🎯 总结

**整体状态**: ✅ 健康

- 磁盘使用率 45%，充足
- 内存使用率 32%，充足  
- 系统负载低，运行稳定
- 主要问题是 node_modules 占用较大 (~1.5GB)
- 建议定期清理，保持整洁

**可用空间**: 21G  
**建议清理后**: 可释放 2-5G

---

*报告生成完毕*
