/**
 * HTTP 通用重试模块
 * 基于 EvoMap Capsule: sha256:6c8b2bef4652d5113cc802b6995a8e9f5da8b5b1ffe3d6bc639e2ca8ce27edec
 * 
 * 功能：
 * - 指数退避重试
 * - AbortController 超时控制
 * - 全局连接池复用
 * - 处理 429/502/503 等错误
 */

const https = require('https');
const http = require('http');

// 配置
const DEFAULT_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 秒
  maxDelay: 30000, // 30 秒
  timeout: 30000, // 30 秒超时
  retryableStatuses: [429, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'TimeoutError']
};

// 全局 Agent（连接池）
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 计算退避时间（指数退避 + 抖动）
 */
function calculateBackoff(attempt, baseDelay, maxDelay) {
  const exponential = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponential; // 30% 抖动
  return Math.min(exponential + jitter, maxDelay);
}

/**
 * 判断是否可重试
 */
function isRetryable(error, statusCode) {
  if (statusCode && DEFAULT_CONFIG.retryableStatuses.includes(statusCode)) {
    return true;
  }
  if (error && DEFAULT_CONFIG.retryableErrors.includes(error.code)) {
    return true;
  }
  return false;
}

/**
 * 带重试的 HTTP 请求
 * @param {string} url - 请求 URL
 * @param {object} options - 请求选项
 * @param {object} retryConfig - 重试配置
 * @returns {Promise<any>} 响应数据
 */
async function fetchWithRetry(url, options = {}, retryConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...retryConfig };
  let lastError = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // 创建 AbortController 用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const result = await new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const reqOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method || 'GET',
          headers: options.headers || {},
          agent: isHttps ? httpsAgent : httpAgent,
          signal: controller.signal
        };
        
        const req = client.request(reqOptions, (res) => {
          clearTimeout(timeoutId);
          
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              // 检查状态码
              if (res.statusCode >= 400) {
                const error = new Error(`HTTP ${res.statusCode}`);
                error.statusCode = res.statusCode;
                error.headers = res.headers;
                error.data = data;
                reject(error);
              } else {
                // 尝试解析 JSON
                try {
                  resolve(JSON.parse(data));
                } catch (e) {
                  resolve(data);
                }
              }
            } catch (e) {
              reject(e);
            }
          });
        });
        
        req.on('error', (e) => {
          clearTimeout(timeoutId);
          reject(e);
        });
        
        if (options.body) {
          req.write(options.body);
        }
        req.end();
      });
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      // 判断是否重试
      if (attempt < config.maxRetries && isRetryable(error, error.statusCode)) {
        const backoffTime = calculateBackoff(attempt, config.baseDelay, config.maxDelay);
        console.log(`[HTTP Retry] 第 ${attempt + 1}/${config.maxRetries} 次重试，等待 ${Math.round(backoffTime)}ms`);
        await delay(backoffTime);
        continue;
      }
      
      // 不可重试或已达最大重试次数
      break;
    }
  }
  
  // 所有重试失败
  throw lastError || new Error('HTTP request failed');
}

/**
 * 简化的 GET 方法
 */
async function get(url, options = {}) {
  return fetchWithRetry(url, { ...options, method: 'GET' });
}

/**
 * 简化的 POST 方法
 */
async function post(url, data, options = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  return fetchWithRetry(url, { ...options, method: 'POST', headers, body });
}

module.exports = {
  fetchWithRetry,
  get,
  post,
  DEFAULT_CONFIG
};
