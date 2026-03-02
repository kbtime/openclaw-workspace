---
name: hdp-calendar-sync
description: HDP 课程行程自动同步到飞书日历。使用场景：(1) 定期同步 HDP 系统的课程安排到飞书日历 (2) 避免手动录入课程行程 (3) 保持日历与 HDP 系统数据一致。关键词：HDP、课程同步、飞书日历、行程同步、自动同步
---

# HDP 课程日历同步

自动将 HDP 系统（https://hdp.huashijingji.com）的课程行程同步到飞书日历。

## 功能概述

| 功能 | 说明 |
|------|------|
| 同步飞书日历 | ✅ HDP 课程自动创建日历事件 |
| 智能去重 | ✅ 已存在的行程自动跳过 |
| Token 自动刷新 | ✅ User Token 过期自动刷新 |
| 执行记录 | ✅ 写入飞书多维表格 + 本地 Dashboard |

---

## 架构说明

### Token 使用

| Token | 用途 | 存储位置 |
|-------|------|---------|
| User Token | 操作飞书日历 | `lib/feishu-user-token.json` |
| Tenant Token | 写入多维表格 | `lib/feishu-tenant-token.json` |

### 数据流

```
HDP 系统
    │
    ▼
sync.js
    ├─→ 飞书日历 (User Token) ✅
    │
    └─→ log-to-feishu.js
            └─→ 飞书多维表格 (Tenant Token) ✅
```

---

## 定时任务

### HDP 同步任务

| 任务 | Cron ID | 执行时间 |
|------|---------|---------|
| HDP 同步 12:00 | `c563bd27-42fa-4113-b4e4-72b5d8fb9069` | 每天 12:00 |
| HDP 同步 18:00 | `f280444f-a3c0-41d1-b15f-0c07d04849e7` | 每天 18:00 |
| HDP 同步 22:00 | `a3c28e58-4ccc-4430-bb11-4155bfe8faa8` | 每天 22:00 |

### Token 刷新任务（系统自动）

| 任务 | Cron ID | 执行频率 |
|------|---------|---------|
| 刷新 User Token | `6b753ea9-d279-43a0-ad5f-61c1005c9f98` | 每 1 小时 |
| 刷新 Tenant Token | `6b1c17a0-28a0-4f0b-8465-b6079cffb727` | 每 2 小时 |

> **注意**：Token 刷新任务**不写入执行记录**，避免日志冗余。

---

## 使用方法

### 直接运行

```bash
cd ~/.openclaw/workspace/skills/hdp-calendar-sync
node scripts/sync.js
```

### 手动触发定时任务

```bash
openclaw cron run c563bd27-42fa-4113-b4e4-72b5d8fb9069
```

---

## 执行流程

```
1. 获取飞书 Token（自动刷新过期 Token）
2. 登录 HDP 系统
3. 获取行程数据
4. 获取飞书日历现有事件（去重）
5. 同步新行程到飞书日历
6. 输出统计结果
7. 写入执行记录（飞书多维表格 + 本地 Dashboard）
```

---

## 执行记录存储

| 目标 | 说明 |
|------|------|
| 飞书多维表格 | https://szgaopeng.feishu.cn/base/FczmbVS0QaZ2CtsMnQycoiExnaf |
| 本地 Dashboard | SQLite 数据库 `data/dashboard.db` |

**记录内容**：
- 任务名称
- 执行时间
- 执行状态（成功/失败）
- 执行结果（成功数/跳过数/失败数）
- 错误信息（如有）

---

## 同步字段映射

| HDP 字段 | 飞书日历字段 |
|---------|------------|
| 城市-天数-课题-跟进人 | 事件标题 |
| 时间安排 | 事件时间 |
| 上课地址 | 事件描述 |
| 机构对接人 | 事件描述 |
| 课酬信息 | 事件描述 |

---

## 文件结构

```
hdp-calendar-sync/
├── scripts/
│   ├── sync.js           # 主同步脚本
│   └── log-to-feishu.js  # 执行记录写入
├── SKILL.md              # 本文件
└── README.md             # 详细文档
```

---

## 故障排查

### Token 问题

```bash
# 手动刷新 Token
node ~/.openclaw/workspace/scripts/refresh-user-token.js
node ~/.openclaw/workspace/scripts/refresh-tenant-token.js
```

### 依赖问题

```bash
cd ~/.openclaw/workspace/skills/hdp-calendar-sync
npm install playwright
```

---

**最后更新**: 2026-02-25
**作者**: 贰号
**版本**: 2.1
