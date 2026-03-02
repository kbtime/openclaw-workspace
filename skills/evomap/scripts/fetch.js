/**
 * EvoMap - Fetch (获取资产)
 * 从 Hub 获取推广的资产和任务
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 配置
const HUB_URL = process.env.A2A_HUB_URL || 'https://evomap.ai';

/**
 * 生成随机 Hex 字符串
 */
function randomHex(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * 生成消息 ID
 */
function generateMessageId() {
  return `msg_${Date.now()}_${randomHex(4)}`;
}

/**
 * 加载节点 ID
 */
function loadNodeId() {
  const nodeIdFile = path.join(__dirname, 'node-id.json');
  
  try {
    if (fs.existsSync(nodeIdFile)) {
      const data = JSON.parse(fs.readFileSync(nodeIdFile, 'utf-8'));
      return data.nodeId;
    }
  } catch (e) {
    console.error('读取节点 ID 失败:', e.message);
  }
  
  console.error('❌ 未找到节点 ID，请先运行 hello.js 注册节点');
  process.exit(1);
}

/**
 * 发送 A2A 请求
 */
async function sendA2ARequest(messageType, payload) {
  const nodeId = loadNodeId();
  
  const envelope = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: messageType,
    message_id: generateMessageId(),
    sender_id: nodeId,
    timestamp: new Date().toISOString(),
    payload
  };
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(envelope);
    
    const url = new URL(`${HUB_URL}/a2a/${messageType}`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
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
  const args = process.argv.slice(2);
  let assetType = null;
  let includeTasks = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      assetType = args[i + 1];
      i++;
    } else if (args[i] === '--include-tasks') {
      includeTasks = true;
    }
  }
  
  console.log('🚀 EvoMap 获取资产\n');
  console.log(`参数：asset_type=${assetType || 'all'}, include_tasks=${includeTasks}\n`);
  
  try {
    const payload = {
      asset_type: assetType,
      local_id: null,
      content_hash: null
    };
    
    if (includeTasks) {
      payload.include_tasks = true;
    }
    
    const result = await sendA2ARequest('fetch', payload);
    
    console.log('\n✅ 获取成功!\n');
    
    if (result.assets && result.assets.length > 0) {
      console.log(`📦 找到 ${result.assets.length} 个资产:\n`);
      result.assets.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.type}: ${asset.summary?.substring(0, 80) || 'N/A'}`);
        if (asset.asset_id) {
          console.log(`   ID: ${asset.asset_id.substring(0, 20)}...`);
        }
        console.log('');
      });
    } else {
      console.log('📭 没有找到匹配的资产');
    }
    
    if (result.tasks && result.tasks.length > 0) {
      console.log(`\n🎯 找到 ${result.tasks.length} 个任务:\n`);
      result.tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
        console.log(`   状态：${task.status}`);
        console.log(`   悬赏：${task.bounty_id || 'N/A'}`);
        console.log(`   信号：${task.signals?.join(', ') || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log('\n完整响应:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ 获取失败:', error.message);
    process.exit(1);
  }
}

// 执行
main();
