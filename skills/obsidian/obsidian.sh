#!/bin/bash
# Obsidian API 辅助脚本

# 默认配置
OBSIDIAN_API_URL="${OBSIDIAN_API_URL:-http://127.0.0.1:27124}"
OBSIDIAN_API_KEY="${OBSIDIAN_API_KEY:-}"

# 检查 API Key
if [ -z "$OBSIDIAN_API_KEY" ]; then
    echo "错误: 请设置 OBSIDIAN_API_KEY 环境变量"
    exit 1
fi

# 通用请求函数
obsidian_request() {
    local method=$1
    local endpoint=$2
    local content_type=$3
    local data=$4
    
    local ct="${content_type:-application/json}"
    local headers=(-H "Authorization: Bearer $OBSIDIAN_API_KEY" -H "Content-Type: $ct")
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "$OBSIDIAN_API_URL$endpoint" "${headers[@]}"
    else
        curl -s -X "$method" "$OBSIDIAN_API_URL$endpoint" "${headers[@]}" -d "$data"
    fi
}

case "$1" in
    "list")
        # 列出目录
        obsidian_request GET "/vault/"
        ;;
    "get")
        # 获取笔记
        obsidian_request GET "/vault/$2" "text/markdown"
        ;;
    "create"|"update")
        # 创建/更新笔记
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "用法: $0 create <path> <content>"
            exit 1
        fi
        obsidian_request PUT "/vault/$2" "text/markdown" "$3"
        ;;
    "append")
        # 追加内容
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "用法: $0 append <path> <content>"
            exit 1
        fi
        obsidian_request POST "/vault/$2" "text/markdown" "$3"
        ;;
    "search")
        # 搜索
        if [ -z "$2" ]; then
            echo "用法: $0 search <query>"
            exit 1
        fi
        obsidian_request GET "/search/?query=$2"
        ;;
    "delete")
        # 删除笔记
        obsidian_request DELETE "/vault/$2"
        ;;
    "active")
        # 获取当前笔记
        obsidian_request GET "/active/"
        ;;
    "open")
        # 打开笔记
        obsidian_request POST "/open/$2"
        ;;
    "status")
        # 检查连接状态
        echo "检查 Obsidian API 连接..."
        result=$(obsidian_request GET "/vault/" 2>&1)
        if echo "$result" | grep -q "files"; then
            echo "✅ Obsidian API 连接正常"
        else
            echo "❌ Obsidian API 连接失败"
            echo "$result"
        fi
        ;;
    *)
        echo "Obsidian API 辅助工具"
        echo ""
        echo "用法: $0 {command} [args]"
        echo ""
        echo "命令:"
        echo "  list              列出根目录文件"
        echo "  get <path>        获取笔记内容"
        echo "  create <path> <content>  创建笔记"
        echo "  update <path> <content>  更新笔记"
        echo "  append <path> <content>  追加内容"
        echo "  search <query>    搜索笔记"
        echo "  delete <path>     删除笔记"
        echo "  active            获取当前活跃笔记"
        echo "  open <path>       打开笔记"
        echo "  status            检查连接状态"
        echo ""
        echo "环境变量:"
        echo "  OBSIDIAN_API_URL  API 地址 (默认: http://127.0.0.1:27124)"
        echo "  OBSIDIAN_API_KEY  API 密钥 (必需)"
        ;;
esac
