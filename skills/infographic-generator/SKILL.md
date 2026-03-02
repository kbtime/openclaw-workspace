---
name: infographic-generator
description: 专业信息图生成器 - 支持 21 种布局和 20 种视觉风格。根据内容自动推荐布局×风格组合，生成高质量信息图。使用阿里云百炼图片生成 API。关键词：信息图、infographic、可视化、图表生成
---

# 信息图生成器

基于阿里云百炼图片生成 API 的专业信息图生成工具。

## 功能特点

- ✅ **21 种布局** - 时间线、对比、层级、流程等
- ✅ **20 种风格** - 手绘、3D、像素、赛博朋克等
- ✅ **智能推荐** - 根据内容自动推荐最佳组合
- ✅ **多语言支持** - 中文、英文、日文等

---

## 配置信息

| 配置项 | 值 |
|-------|-----|
| **图片模型** | `doubao-seedream-5-0-260128` (火山引擎) |
| **特点** | ✅ 支持文字渲染 |
| **API URL** | `https://ark.cn-beijing.volces.com/api/v3` |
| **最小尺寸** | 1920x1920 (3686400 像素) |

### 备用模型

| 模型 | 说明 |
|------|------|
| `wanx-v1` (阿里云) | 通用图片生成，不支持文字渲染 |

---

## 使用方法

### 基本用法

```bash
# 生成信息图
node scripts/generate.js --content "内容文件.md"

# 指定布局和风格
node scripts/generate.js --content "内容.md" --layout timeline --style craft-handmade

# 指定比例
node scripts/generate.js --content "内容.md" --aspect portrait
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `--content` | 内容文件路径或直接输入文本 |
| `--layout` | 布局类型（21 种可选） |
| `--style` | 视觉风格（20 种可选） |
| `--aspect` | 比例：landscape/portrait/square |
| `--output` | 输出路径 |

---

## 布局类型 (Layouts)

| 布局 | 用途 |
|------|------|
| `linear-progression` | 时间线、流程、教程 |
| `binary-comparison` | A vs B、前后对比 |
| `comparison-matrix` | 多因素对比 |
| `hierarchical-layers` | 层级、优先级 |
| `tree-branching` | 分类、树形结构 |
| `hub-spoke` | 中心概念展开 |
| `structural-breakdown` | 分解图、剖面 |
| `bento-grid` | 多主题概览（默认） |
| `iceberg` | 表面 vs 隐藏 |
| `bridge` | 问题-解决方案 |
| `funnel` | 转化、筛选 |
| `isometric-map` | 空间关系 |
| `dashboard` | 指标、KPI |
| `periodic-table` | 分类集合 |
| `comic-strip` | 叙事、序列 |
| `story-mountain` | 情节结构 |
| `jigsaw` | 关联部分 |
| `venn-diagram` | 重叠概念 |
| `winding-roadmap` | 旅程、里程碑 |
| `circular-flow` | 循环、周期 |
| `dense-modules` | 高密度模块 |

完整定义：`references/layouts/<layout>.md`

---

## 视觉风格 (Styles)

| 风格 | 描述 |
|------|------|
| `craft-handmade` | 手绘、纸艺（默认） |
| `claymation` | 3D 粘土、定格动画 |
| `kawaii` | 日系可爱、粉彩 |
| `storybook-watercolor` | 水彩插画 |
| `chalkboard` | 黑板粉笔画 |
| `cyberpunk-neon` | 霓虹赛博朋克 |
| `bold-graphic` | 漫画风格 |
| `aged-academia` | 复古学术 |
| `corporate-memphis` | 扁平矢量 |
| `technical-schematic` | 蓝图、工程 |
| `origami` | 折纸几何 |
| `pixel-art` | 像素复古 |
| `ui-wireframe` | 线框图 |
| `subway-map` | 地铁图 |
| `ikea-manual` | 宜家说明风格 |
| `knolling` | 平铺排列 |
| `lego-brick` | 乐高积木 |
| `pop-laboratory` | 实验室蓝图 |
| `morandi-journal` | 莫兰迪手账 |
| `retro-pop-grid` | 复古波普 |

完整定义：`references/styles/<style>.md`

---

## 推荐组合

| 内容类型 | 推荐组合 |
|---------|---------|
| 时间线/历史 | `linear-progression` + `craft-handmade` |
| 步骤教程 | `linear-progression` + `ikea-manual` |
| A vs B 对比 | `binary-comparison` + `corporate-memphis` |
| 层级结构 | `hierarchical-layers` + `craft-handmade` |
| 技术内容 | `structural-breakdown` + `technical-schematic` |
| 数据指标 | `dashboard` + `corporate-memphis` |
| 教育内容 | `bento-grid` + `chalkboard` |
| 旅程路线 | `winding-roadmap` + `storybook-watercolor` |

---

## 文件结构

```
skills/infographic-generator/
├── SKILL.md              # 本文件
├── scripts/
│   ├── generate.js       # 主生成脚本
│   └── image-gen.js      # 图片生成 API
└── references/
    ├── layouts/          # 21 种布局定义
    └── styles/           # 20 种风格定义
```

---

**最后更新**: 2026-02-26
**版本**: 1.0
