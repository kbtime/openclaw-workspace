#!/bin/bash
# HDP 课程日历同步 - 便捷运行脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查环境变量
if [ -z "$FEISHU_USER_TOKEN" ]; then
  echo "❌ 错误：缺少环境变量 FEISHU_USER_TOKEN"
  echo ""
  echo "请先设置 Token："
  echo "  export FEISHU_USER_TOKEN=\"u-your-token-here\""
  echo ""
  echo "或者编辑 ~/.bashrc 或 ~/.zshrc 永久添加"
  exit 1
fi

echo "🚀 开始同步 HDP 课程行程到飞书日历..."
echo ""

# 运行同步脚本
node scripts/sync.js
