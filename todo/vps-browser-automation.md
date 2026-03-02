# VPS 浏览器自动化部署 - 执行计划 (TODO)

> 基于《VPS 浏览器自动化部署总纲》严格执行
> 创建时间: 2026-02-10 22:58
> 执行人: FF

---

## 阶段 1: 系统层 (The Ground) - Xvfb 虚拟显示器

### 任务 1.1: 安装系统依赖
- [x] 检查 OS 类型 (OpenCloudOS 9.4)
- [x] 安装 Xvfb (xorg-x11-server-Xvfb)
- [x] 安装 mesa-libgbm-devel
- [x] 安装中文字体 (google-noto-cjk-fonts)
- [x] 安装浏览器依赖 (nss, atk, alsa-lib)
- [x] **核实**: 所有包安装成功 ✅

### 任务 1.2: 部署 Xvfb Systemd 服务
- [x] 创建 /etc/systemd/system/xvfb.service
- [x] 配置参数: :99 屏幕, 1280x1024x24
- [x] 设置重启策略: always
- [x] 设置用户: root
- [x] 启用服务: systemctl enable
- [x] 启动服务: systemctl start
- [x] **核实**: 服务运行状态 (Active: running) ✅

---

## 阶段 2: 执行层 (The Muscle) - Playwright + Chromium

### 任务 2.1: 安装 Playwright
- [x] 安装 Playwright (npm install -g playwright)
- [x] 下载 Chromium (npx playwright install chromium)
- [x] **核实**: Chromium 可执行 ✅

### 任务 2.2: 验证有头模式
- [x] 配置 DISPLAY=:99
- [x] 启动有头浏览器 (headless=False)
- [x] 导航测试页面
- [x] 截图验证
- [x] **核实**: 截图显示正常，中文无乱码 ✅

---

## 阶段 3: 接口层 (The Nerve) - browser-control.js

### 任务 3.1: 创建 browser-control.js
- [x] 实现 start 命令
- [x] 实现 navigate 命令
- [x] 实现 screenshot 命令
- [x] 实现 click 命令
- [x] 实现 type 命令
- [x] 实现 stop 命令
- [x] **核实**: 所有命令可用 ✅

### 任务 3.2: 创建 browser_controller.py
- [x] BrowserController 类
- [x] 有头模式支持
- [x] 常用操作封装 (navigate, screenshot, click, fill)
- [x] Xvfb 状态检查
- [x] **核实**: Python 模块可导入 ✅

---

## 阶段 4: 环境配置

### 任务 4.1: 配置 .env
- [x] DISPLAY=:99
- [x] PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
- [x] BROWSER_CONTROL_JS 路径
- [x] BROWSER_VIEWPORT_WIDTH/HEIGHT
- [x] **核实**: 环境变量加载正常 ✅

### 任务 4.2: 创建维护脚本
- [x] 自动清理脚本 (crontab)
- [x] **核实**: crontab 配置正确 ✅

---

## 阶段 5: 文档与验证

### 任务 5.1: 编写部署文档
- [x] 保存到 docs/vps-browser-automation.md
- [x] 记录设计哲学
- [x] 记录架构思路
- [x] 记录维护方法

### 任务 5.2: 完整功能测试
- [x] 启动浏览器 (有头模式)
- [x] 访问复杂网页 (YouTube)
- [x] 处理中文内容
- [x] 截图验证
- [x] 关闭浏览器
- [x] **核实**: 全流程无错误 ✅

---

## 执行状态追踪

| 阶段 | 任务数 | 已完成 | 状态 |
|------|--------|--------|------|
| 阶段 1: 系统层 | 2 | 2 | ✅ |
| 阶段 2: 执行层 | 2 | 2 | ✅ |
| 阶段 3: 接口层 | 2 | 2 | ✅ |
| 阶段 4: 环境配置 | 2 | 2 | ✅ |
| 阶段 5: 文档验证 | 2 | 2 | ✅ |

**总体进度**: 100% ✅

**完成时间**: 2026-02-10 23:00

---

## 风险与回退方案

| 风险 | 应对措施 |
|------|----------|
| Xvfb 启动失败 | 检查 DISPLAY 端口占用，重启服务 |
| Chromium 崩溃 | 检查内存，增加 swap |
| 中文显示方块 | 确认中文字体已安装 |
| 权限问题 | 使用 --no-sandbox 启动参数 |

---

## 完成标准

- [ ] Xvfb 服务稳定运行
- [ ] 有头浏览器可正常截图
- [ ] 中文显示无乱码
- [ ] 所有接口可用
- [ ] 文档完整
