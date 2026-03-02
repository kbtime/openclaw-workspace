---
name: task-dashboard
description: OpenClaw 任务看板 - 实时监控任务进度、定时任务和执行记录。提供 Web 界面查看，支持登录认证和 WebSocket 实时更新。关键词：任务看板、Dashboard、定时任务、执行记录
---

# Task Dashboard

OpenClaw 任务看板，实时监控任务状态。

## 功能

- 📋 **任务进度** - 查看当前任务状态和进度
- ⏰ **定时任务** - 监控所有 cron 任务配置和状态
- 📊 **执行记录** - 查看任务执行历史、耗时、结果
- 🔧 **系统状态** - Token 有效期、服务健康度
- 🔄 **实时更新** - WebSocket 推送，无需手动刷新
- 🔐 **登录认证** - JWT 认证，安全访问

## 启动

```bash
cd ~/.openclaw/workspace/skills/task-dashboard
npm install
npm start
```

## 访问

```
http://localhost:3100
```

## 默认账号

首次启动时会自动生成管理员账号，密码打印在控制台并保存到：
```
~/.openclaw/workspace/data/dashboard-credentials.txt
```

## API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录 |
| `/api/tasks` | GET/POST | 任务列表/创建 |
| `/api/cron` | GET | 定时任务列表 |
| `/api/records` | GET | 执行记录 |
| `/api/status` | GET | 系统状态 |

## 写入执行记录

从其他脚本调用：

```javascript
const { writeRecord } = require('../task-dashboard/scripts/write-record');

writeRecord({
    cronJobId: 'c563bd27-42fa-4113-b4e4-72b5d8fb9069',
    taskName: 'HDP 课程日历同步',
    status: 'success',
    result: '成功: 0, 跳过: 2, 失败: 0',
    durationMs: 72000
});
```

命令行调用：

```bash
node scripts/write-record.js \
    --cron-job-id "c563bd27-42fa-4113-b4e4-72b5d8fb9069" \
    --task-name "HDP 同步" \
    --status "success" \
    --result "跳过 2 条" \
    --duration-ms 72000
```

## WebSocket

连接地址：`ws://localhost:3100/ws?token=<jwt_token>`

事件类型：
- `init` - 初始数据
- `task_updated` - 任务更新
- `execution_completed` - 执行记录新增
- `cron_status_changed` - 定时任务状态变化

## 配置

环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DASHBOARD_PORT` | 3100 | 服务端口 |
| `DASHBOARD_HOST` | 0.0.0.0 | 监听地址 |
| `DASHBOARD_JWT_SECRET` | 随机生成 | JWT 密钥 |
| `DASHBOARD_DB_PATH` | ~/.openclaw/workspace/data/dashboard.db | 数据库路径 |

## 部署

### Nginx 代理

```nginx
location /dashboard {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Systemd

```bash
# 创建服务文件
sudo cp scripts/task-dashboard.service /etc/systemd/system/
sudo systemctl enable task-dashboard
sudo systemctl start task-dashboard
```

---

**版本**: 1.0.0
**作者**: 贰号
**更新**: 2026-02-24
