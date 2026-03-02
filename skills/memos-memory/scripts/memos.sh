#!/bin/bash
# MemOS API 快捷脚本

set -e

API_KEY="${MEMOS_API_KEY}"
BASE_URL="${MEMOS_BASE_URL:-https://memos.memtensor.cn/api/openmem/v1}"

if [ -z "$API_KEY" ]; then
    echo "Error: MEMOS_API_KEY not set"
    exit 1
fi

usage() {
    echo "Usage: memos.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  search <query> <user_id> [top_k]   - 搜索记忆"
    echo "  add <user_id> <conv_id> <messages> - 添加消息"
    echo ""
    echo "Examples:"
    echo "  memos.sh search '用户偏好' 'feishu:ou_xxx'"
    echo "  memos.sh add 'feishu:ou_xxx' 'conv_001' '[{\"role\":\"user\",\"content\":\"测试\"}]'"
}

search_memory() {
    local query="$1"
    local user_id="$2"
    local top_k="${3:-10}"
    
    curl -s -X POST "$BASE_URL/search/memory" \
        -H "Authorization: Token $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$user_id\",
            \"query\": \"$query\",
            \"top_k\": $top_k
        }"
}

add_message() {
    local user_id="$1"
    local conv_id="$2"
    local messages="$3"
    
    curl -s -X POST "$BASE_URL/add/message" \
        -H "Authorization: Token $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$user_id\",
            \"conversation_id\": \"$conv_id\",
            \"messages\": $messages
        }"
}

case "$1" in
    search)
        if [ $# -lt 3 ]; then
            echo "Error: search requires <query> <user_id>"
            usage
            exit 1
        fi
        search_memory "$2" "$3" "${4:-10}"
        ;;
    add)
        if [ $# -lt 4 ]; then
            echo "Error: add requires <user_id> <conv_id> <messages>"
            usage
            exit 1
        fi
        add_message "$2" "$3" "$4"
        ;;
    *)
        usage
        exit 1
        ;;
esac
