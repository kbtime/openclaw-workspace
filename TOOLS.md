# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## MemOS 记忆系统

- **Skill**: `memos-memory`
- **API Key**: 已配置在环境变量 `MEMOS_API_KEY`
- **Base URL**: `https://memos.memtensor.cn/api/openmem/v1`
- **用户 ID**: Boss 的 Feishu ID = `feishu:ou_2fe489241b72e270a41f6fdd3425d495`

### 快捷命令

```bash
# 搜索记忆
~/.openclaw/workspace/skills/memos-memory/scripts/memos.sh search "关键词" "feishu:ou_2fe489241b72e270a41f6fdd3425d495"

# 添加记忆
~/.openclaw/workspace/skills/memos-memory/scripts/memos.sh add "feishu:ou_2fe489241b72e270a41f6fdd3425d495" "conv_id" '[{"role":"user","content":"内容"}]'
```

---

## Coding Tools

- **Claude Code**: `/root/.local/bin/claude` (v2.1.42)
- **OpenCode**: `/usr/bin/opencode` (v1.2.6) + Oh My OpenCode 插件

---

## 任务看板 (飞书多维表格)

- **URL**: https://szgaopeng.feishu.cn/base/FczmbVS0QaZ2CtsMnQycoiExnaf
- **App Token**: `FczmbVS0QaZ2CtsMnQycoiExnaf`

### 表格

| 表名 | Table ID | 用途 |
|------|----------|------|
| 数据表 | `tblHU3FYzskJknjy` | 任务看板 |
| 定时任务日历 | `tblkoQYaHX1eyK2u` | 定时任务/Cron 日历 |
| 任务执行记录 | `tblNOdCsb2gDlTCB` | 任务执行结果记录 |

### 使用规则

1. **新增任务** → 写入"数据表"
2. **安排定时任务** → 同时写入"定时任务日历"
3. **任务执行后** → 必须在"任务执行记录"表创建记录
4. **更新状态** → 实时同步到表格

---

Add whatever helps you do your job. This is your cheat sheet.
