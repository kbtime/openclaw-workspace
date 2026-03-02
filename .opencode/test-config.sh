#!/bin/bash
# Opencode 配置测试脚本

OPENCODE_DIR="/root/.openclaw/workspace/.opencode"

echo "=== Opencode 配置测试 ==="
echo ""

# 加载环境变量
source "$OPENCODE_DIR/setup-env.sh"

echo "测试 GLM-5 连接..."
echo ""

# 使用 curl 测试 API (GLM 格式)
curl -X POST "$OPENAI_BASE_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "glm-5",
    "messages": [
      {
        "role": "user",
        "content": "Hello, this is a test message. Please respond with OK."
      }
    ],
    "max_tokens": 10
  }' \
  --connect-timeout 10 \
  --max-time 30

echo ""
echo ""
echo "测试完成！"
