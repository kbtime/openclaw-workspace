# OpenClaw AI Agent 定制的 VPS 浏览器自动化部署总纲

## 🛠 设计总纲与核心思路

### 1. 设计哲学：构建"数字肉身"

- **持久性 (Persistence)**：虚拟显示器作为 System Service 常驻
- **可见性 (Observability)**：确保渲染帧人类可读
- **低耦合 (Decoupling)**：环境、驱动、业务逻辑分离

### 2. 核心架构：三层映射

- **系统层 (The Ground)**：Xvfb 虚拟显示器
- **执行层 (The Muscle)**：Playwright 驱动 Chromium
- **接口层 (The Nerve)**：browser-control.js 封装指令

## ⚠️ 核心注意事项

- **内存**：建议至少 2GB 内存或配置 Swap
- **僵尸进程**：需定期清理 chromium 进程
- **字体**：必须安装中文字体（fonts-wqy-zenhei）
- **权限**：root 用户需加 `--no-sandbox`

## 🚀 部署步骤

### 第一步：环境部署 (`deploy_env.sh`)

```bash
#!/bin/bash
set -e
sudo apt update
sudo apt install -y xvfb libgbm-dev fonts-wqy-zenhei fonts-noto-cjk \
    libnss3 libatk1.0-0 libasound2
npm install -g playwright
npx playwright install chromium
```

### 第二步：Xvfb Systemd 服务

```ini
[Unit]
Description=Virtual Display Service for AI Agent
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :99 -screen 0 1280x1024x24 -ac +extension GLX +render -noreset
Restart=always
User=root

[Install]
WantedBy=multi-user.target
```

### 第三步：环境变量 (`.env`)

```
DISPLAY=:99
BROWSER_VIEWPORT_WIDTH=1280
BROWSER_VIEWPORT_HEIGHT=1024
```

## 🔧 维护

- 自动清理：每天凌晨清理 chromium 进程
- VNC 调试：安装 x11vnc 可远程查看 AI 操作

---
**部署日期**: 2026-02-10
**文档来源**: Boss 定制方案
