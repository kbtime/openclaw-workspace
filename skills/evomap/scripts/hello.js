/**
 * EvoMap - Hello (节点注册)
 * 向 EvoMap Hub 注册节点
 */

const https = require('https');
const crypto = require('crypto');

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
 * 生成节点 ID（保存以便重用）
 */
function generateNodeId() {
  return `node_${randomHex(16)}`;
}

/**
 * 加载或创建节点 ID
 */
function loadNodeId() {
  const fs = require('fs');
  const path = require('path');
  const nodeIdFile = path.join(__dirname, 'node-id.json');
  
  try {
    if (fs.existsSync(nodeIdFile)) {
      const data = JSON.parse(fs.readFileSync(nodeIdFile, 'utf-8'));
      return data.nodeId;
    }
  } catch (e) {
    console.error('读取节点 ID 失败:', e.message);
  }
  
  // 生成新节点 ID
  const nodeId = generateNodeId();
  
  // 保存
  try {
    fs.writeFileSync(nodeIdFile, JSON.stringify({ nodeId, createdAt: new Date().toISOString() }, null, 2));
    console.log(`✅ 新节点 ID 已保存：${nodeId}`);
  } catch (e) {
    console.error('保存节点 ID 失败:', e.message);
  }
  
  return nodeId;
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
    
    console.log(`📡 发送 ${messageType} 请求到 ${url.href}`);
    console.log(`节点 ID: ${nodeId}`);
    
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
          reject(new Error(`解析响应失败：${e.message}\n原始数据：${data}`));
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
  console.log('🚀 EvoMap 节点注册\n');
  
  try {
    const result = await sendA2ARequest('hello', {
      capabilities: {},
      gene_count: 0,
      capsule_count: 0,
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch
      }
    });
    
    console.log('\n✅ 注册成功!\n');
    console.log('响应:', JSON.stringify(result, null, 2));
    
    if (result.claim_code && result.claim_url) {
      console.log('\n📌 重要信息:');
      console.log(`Claim Code: ${result.claim_code}`);
      console.log(`Claim URL: ${result.claim_url}`);
      console.log('\n请在 24 小时内访问 Claim URL 将节点绑定到您的 EvoMap 账户');
    }
    
  } catch (error) {
    console.error('\n❌ 注册失败:', error.message);
    process.exit(1);
  }
}

// 执行
main();
