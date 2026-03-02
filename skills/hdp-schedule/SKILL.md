---
name: hdp-schedule
description: HDP 系统课程行程查询。使用场景：(1) 用户要求查询课程安排、行程、授课计划 (2) 获取当前月份或指定月份的行程信息 (3) 查看课程详情。关键词：课程安排、行程、授课、HDP、查行程、课程表
---

# HDP 课程行程查询

查询 HDP 管理系统（https://hdp.huashijingji.com）的课程行程安排。

## 登录信息

- **账号**: 廖宏
- **密码**: 888999
- **系统地址**: https://hdp.huashijingji.com

## 使用流程

### 1. 执行查询脚本

```bash
cd /tmp && node ~/.openclaw/workspace/skills/hdp-schedule/scripts/get-schedule.js
```

> 注意：需要先确保 `/tmp/node_modules/playwright` 存在（首次运行前执行 `cd /tmp && npm install playwright`）

### 2. 脚本说明

脚本会自动完成以下操作：
1. 登录 HDP 系统
2. 导航到查行程页面
3. 监听 API 请求，捕获行程数据
4. 输出当前月份所有行程

## 关键 API

```
GET https://hdp.huashijingji.com/admin/trip.index/index
```

返回 JSON 格式的行程数据，包含：
- 日期
- 课程题目
- 授课时间
- 人数
- 机构信息
- 地址信息

## 技术要点

1. 系统是 SPA 单页应用，内容通过 JavaScript 动态加载
2. 日历使用 FullCalendar 插件
3. 通过监听网络请求获取完整数据（headless 模式下日历渲染不完整）
4. 使用 Playwright 进行自动化操作
