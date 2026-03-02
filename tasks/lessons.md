# Lessons Learned - 贰号的自我改进记录

> 每次 Boss 纠正后，记录模式并写规则防止再犯

## 2026-02-23

### 1. Shell 脚本中提取 JSON 字段
**错误模式**：用 `grep -o` + `cut` 提取 JSON 字段
```bash
# 错误方式 - 不可靠
export TOKEN=$(cat file.json | grep -o '"access_token": "[^"]*"' | cut -d'"' -f4)
```

**正确方式**：用 `jq` 解析 JSON
```bash
# 正确方式 - 可靠
export TOKEN=$(jq -r '.access_token' file.json)
```

**教训**：永远不要用文本处理工具解析 JSON，用专门的 JSON 工具（jq 或 node/node -e）

---

### 2. 定时任务需要验证 Token 有效性
**场景**：HDP 同步失败，日志显示 "Token expired"，但 Token 刷新任务实际上在跑

**根因**：
1. Token 刷新任务正常执行
2. 但同步脚本用错误方式提取 Token（grep+cut）
3. 历史日志的"过期"错误是旧 Token 导致的，给人误导

**教训**：
- 诊断问题时要检查最新状态，不要只看历史日志
- 修复后要手动运行验证

---

## 待补充...

（每次被纠正后更新此文件）
