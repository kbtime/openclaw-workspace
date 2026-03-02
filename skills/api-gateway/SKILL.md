---
name: api-gateway
description: API Gateway 集成工具。使用场景：(1) 调用外部 REST API (2) 聚合多个 API 请求 (3) API 请求代理和转发。关键词：API、gateway、REST、HTTP 请求、接口调用
---

# API Gateway

通用的 API 网关集成工具，支持调用各种 REST API。

## API Key

- **Key**: `IOcBq_b-3taUoLQleGIFpiurXjObMEIfrLwX_RMr39VEifpjjuPcu_xx3phvT39j9kgM7uAeR6eolADGt5vgJLS0uYVx8qhTaMeNwe9LXQ`
- **用途**: API 认证和访问控制

## 使用方法

### 基本请求

```bash
node scripts/gateway.js GET "https://api.example.com/endpoint"
```

### 带参数请求

```bash
node scripts/gateway.js POST "https://api.example.com/endpoint" \
  --header "Content-Type: application/json" \
  --data '{"key": "value"}'
```

### 环境变量

```bash
export API_GATEWAY_KEY="IOcBq_b-3taUoLQleGIFpiurXjObMEIfrLwX_RMr39VEifpjjuPcu_xx3phvT39j9kgM7uAeR6eolADGt5vgJLS0uYVx8qhTaMeNwe9LXQ"
```

## 支持的 HTTP 方法

- `GET` - 获取数据
- `POST` - 创建数据
- `PUT` - 更新数据
- `PATCH` - 部分更新
- `DELETE` - 删除数据

## 参数说明

| 参数 | 说明 |
|------|------|
| `--header` | 添加请求头 (可多次使用) |
| `--data` | 请求体数据 (POST/PUT/PATCH) |
| `--query` | URL 查询参数 |
| `--timeout` | 请求超时 (毫秒，默认 30000) |
| `--auth` | 认证类型 (bearer/basic/apikey) |

## 示例

### GET 请求

```bash
node scripts/gateway.js GET "https://api.github.com/users/octocat"
```

### POST 请求

```bash
node scripts/gateway.js POST "https://api.example.com/users" \
  --header "Content-Type: application/json" \
  --data '{"name": "John", "email": "john@example.com"}'
```

### 带认证请求

```bash
node scripts/gateway.js GET "https://api.example.com/protected" \
  --auth bearer \
  --header "Authorization: Bearer $TOKEN"
```

### 带查询参数

```bash
node scripts/gateway.js GET "https://api.example.com/search" \
  --query "q=keyword" \
  --query "page=1" \
  --query "limit=10"
```

## 输出格式

```json
{
  "status": 200,
  "headers": {...},
  "data": {...},
  "time": 125
}
```

## 注意事项

1. API Key 请妥善保管，不要泄露
2. 注意 API 调用频率限制
3. 敏感信息建议使用环境变量

---

**最后更新**: 2026-02-20
**来源**: https://clawhub.ai/byungkyu/api-gateway
