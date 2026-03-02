/**
 * API Gateway
 * 通用的 API 请求工具，支持各种 REST API 调用
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 配置
const API_KEY = process.env.API_GATEWAY_KEY || 'IOcBq_b-3taUoLQleGIFpiurXjObMEIfrLwX_RMr39VEifpjjuPcu_xx3phvT39j9kgM7uAeR6eolADGt5vgJLS0uYVx8qhTaMeNwe9LXQ';

// 解析命令行参数
const args = process.argv.slice(2);
const method = args[0]?.toUpperCase() || 'GET';
const url = args[1];

const options = {
  headers: {},
  data: null,
  query: {},
  timeout: 30000,
  auth: null
};

// 解析参数
for (let i = 2; i < args.length; i++) {
  if (args[i] === '--header' && args[i + 1]) {
    const [key, ...valueParts] = args[i + 1].split(':');
    options.headers[key.trim()] = valueParts.join(':').trim();
    i++;
  } else if (args[i] === '--data' && args[i + 1]) {
    options.data = args[i + 1];
    i++;
  } else if (args[i] === '--query' && args[i + 1]) {
    const [key, value] = args[i + 1].split('=');
    options.query[key] = value || '';
    i++;
  } else if (args[i] === '--timeout' && args[i + 1]) {
    options.timeout = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--auth' && args[i + 1]) {
    options.auth = args[i + 1];
    i++;
  }
}

if (!url) {
  console.error('❌ 错误：请提供 API URL');
  console.log('用法：node gateway.js <METHOD> <URL> [选项]');
  console.log('示例：node gateway.js GET "https://api.example.com/users"');
  console.log('       node gateway.js POST "https://api.example.com/users" --header "Content-Type: application/json" --data \'{"name": "John"}\'');
  process.exit(1);
}

/**
 * 发送 HTTP 请求
 */
async function sendRequest(method, url, options) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // 解析 URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      reject(new Error(`无效的 URL: ${url}`));
      return;
    }
    
    // 添加查询参数
    Object.entries(options.query).forEach(([key, value]) => {
      parsedUrl.searchParams.append(key, value);
    });
    
    // 准备请求选项
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        ...options.headers,
        'User-Agent': 'OpenClaw-API-Gateway/1.0'
      },
      timeout: options.timeout
    };
    
    // 添加 API Key 到请求头
    if (API_KEY) {
      requestOptions.headers['X-API-Key'] = API_KEY;
    }
    
    // 处理请求体
    let body = null;
    if (options.data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      body = options.data;
      if (!requestOptions.headers['Content-Type']) {
        requestOptions.headers['Content-Type'] = 'application/json';
      }
      requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    // 发送请求
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const time = endTime - startTime;
        
        // 尝试解析 JSON
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }
        
        resolve({
          status: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: parsedData,
          time: time
        });
      });
    });
    
    req.on('error', (e) => {
      reject(new Error(`请求失败：${e.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时 (${options.timeout}ms)`));
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

/**
 * 主函数
 */
async function main() {
  console.log(`🌐 ${method} ${url}\n`);
  
  if (Object.keys(options.headers).length > 0) {
    console.log('请求头:');
    Object.entries(options.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  }
  
  if (options.data) {
    console.log('请求体:');
    console.log(`  ${options.data}`);
    console.log('');
  }
  
  try {
    const response = await sendRequest(method, url, options);
    
    console.log(`✅ 状态码：${response.status} ${response.statusMessage}`);
    console.log(`⏱️  耗时：${response.time}ms`);
    console.log('');
    
    console.log('响应头:');
    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
    
    console.log('响应数据:');
    if (typeof response.data === 'object') {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.log(response.data);
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

// 执行
main();
