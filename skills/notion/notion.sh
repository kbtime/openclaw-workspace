#!/bin/bash
# Notion API 辅助脚本

NOTION_API_KEY="${NOTION_API_KEY}"
BASE_URL="https://api.notion.com/v1"
VERSION="2022-06-28"

# 通用请求函数
notion_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $NOTION_API_KEY" \
            -H "Notion-Version: $VERSION" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $NOTION_API_KEY" \
            -H "Notion-Version: $VERSION" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

case "$1" in
    "search")
        notion_request POST "/search" "{\"query\":\"$2\"}"
        ;;
    "page")
        notion_request GET "/pages/$2"
        ;;
    "blocks")
        notion_request GET "/blocks/$2/children"
        ;;
    "databases")
        notion_request POST "/search" "{\"filter\":{\"property\":\"object\",\"value\":\"database\"}}"
        ;;
    "query")
        notion_request POST "/databases/$2/query" "{}"
        ;;
    *)
        echo "用法: $0 {search|page|blocks|databases|query} [args]"
        echo "  search <关键词>  - 搜索"
        echo "  page <page_id>   - 获取页面"
        echo "  blocks <page_id> - 获取页面内容块"
        echo "  databases        - 列出数据库"
        echo "  query <db_id>    - 查询数据库"
        ;;
esac
