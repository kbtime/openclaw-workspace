#!/bin/bash
# Opencode 环境配置脚本
# 用法：source /root/.openclaw/workspace/.opencode/setup-env.sh

OPENCODE_DIR="/root/.openclaw/workspace/.opencode"

# 加载 .env 文件
if [ -f "$OPENCODE_DIR/.env" ]; then
    export $(grep -v '^#' "$OPENCODE_DIR/.env" | xargs)
    echo "✅ Opencode 环境变量已加载"
else
    echo "❌ 未找到 .env 文件：$OPENCODE_DIR/.env"
    return 1
fi

# 显示当前配置
echo ""
echo "当前配置:"
echo "  默认模型：$OPENAI_MODEL"
echo "  API Base: $OPENAI_BASE_URL"
echo "  API Key:  ${OPENAI_KEY:0:10}...${OPENAI_KEY: -5}"
echo ""
echo "可用模型服务商:"
echo "  - GLM (智谱):     glm-5, glm-4.7, glm-4.6, glm-4.5"
echo "  - Qwen (阿里云):  qwen3.5-plus, qwen-max"
echo "  - Kimi (月之暗面): kimi-k2.5"
echo "  - MiniMax:        MiniMax-M2.5, MiniMax-M2.1"
echo ""
echo "切换模型示例:"
echo "  export OPENAI_MODEL=glm-5        # 切换到 GLM-5"
echo "  export OPENAI_MODEL=qwen3.5-plus # 切换到 Qwen"
echo ""
