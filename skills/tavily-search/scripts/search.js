/**
 * Tavily Web Search
 * 使用 Tavily API 进行智能网络搜索
 */

const https = require('https');

// 配置
const API_KEY = process.env.TAVILY_API_KEY || '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';
const BASE_URL = 'https://api.tavily.com';

// 解析命令行参数
const args = process.argv.slice(2);
let query = '';
const options = {
  max_results: 5,
  search_depth: 'basic',
  include_answer: false,
  include_raw_content: false,
  include_images: false,
  topic: 'general'
};

// 解析参数
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    if (key === 'max-results') options.max_results = parseInt(value);
    else if (key === 'search-depth') options.search_depth = value;
    else if (key === 'include-quotes') options.include_quotes = value === 'true';
    else if (key === 'include-answer') options.include_answer = value === 'true';
    else if (key === 'include-raw-content') options.include_raw_content = value === 'true';
    else if (key === 'topic') options.topic = value;
    else if (key === 'include-domains') options.include_domains = value.split(',');
    else if (key === 'exclude-domains') options.exclude_domains = value.split(',');
    i++;
  } else if (!args[i].startsWith('-')) {
    query += args[i] + ' ';
  }
}

query = query.trim();

if (!query) {
  console.error('❌ 错误：请提供搜索关键词');
  console.log('用法：node search.js "搜索关键词" [选项]');
  console.log('示例：node search.js "AI 最新进展" --max-results 5');
  process.exit(1);
}

/**
 * 调用 Tavily API
 */
async function tavilySearch(query, options) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      api_key: API_KEY,
      query,
      max_results: options.max_results,
      search_depth: options.search_depth,
      include_answer: options.include_answer,
      include_raw_content: options.include_raw_content,
      include_images: options.include_images,
      topic: options.topic,
      ...(options.include_quotes !== undefined && { include_quotes: options.include_quotes }),
      ...(options.include_domains && { include_domains: options.include_domains }),
      ...(options.exclude_domains && { exclude_domains: options.exclude_domains })
    });

    const reqOptions = {
      hostname: 'api.tavily.com',
      port: 443,
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`解析响应失败：${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`请求失败：${e.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 主函数
 */
async function main() {
  console.log(`🔍 搜索：${query}\n`);
  console.log(`参数：max_results=${options.max_results}, search_depth=${options.search_depth}\n`);

  try {
    const result = await tavilySearch(query, options);

    if (result.answer) {
      console.log('💡 AI 答案:');
      console.log(result.answer);
      console.log('\n' + '='.repeat(60) + '\n');
    }

    console.log(`📊 找到 ${result.results?.length || 0} 条结果:\n`);

    if (result.results && result.results.length > 0) {
      result.results.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   URL: ${item.url}`);
        console.log(`   摘要：${item.content?.substring(0, 200)}${item.content?.length > 200 ? '...' : ''}`);
        if (item.score) console.log(`   相关度：${(item.score * 100).toFixed(1)}%`);
        if (item.published_date) console.log(`   发布日期：${item.published_date}`);
        console.log('');
      });
    } else {
      console.log('未找到相关结果。');
    }

  } catch (error) {
    console.error('❌ 搜索失败:', error.message);
    process.exit(1);
  }
}

// 执行
main();
