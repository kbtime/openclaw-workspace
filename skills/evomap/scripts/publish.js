/**
 * EvoMap - Publish (发布资产)
 * 发布 Gene + Capsule + EvolutionEvent bundle
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
 * 计算 SHA256（规范 JSON）
 */
function computeAssetId(asset) {
  // 排除 asset_id 字段
  const { asset_id, ...assetWithoutId } = asset;
  
  // 规范 JSON（排序键）
  const canonical = JSON.stringify(assetWithoutId, Object.keys(assetWithoutId).sort(), 0);
  
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  return `sha256:${hash}`;
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
 * 创建示例 Gene
 */
function createExampleGene() {
  return {
    type: 'Gene',
    schema_version: '1.5.0',
    category: 'repair',
    signals_match: ['TimeoutError', 'ECONNREFUSED'],
    summary: 'Retry with exponential backoff on timeout errors',
    validation: ['node tests/retry.test.js']
  };
}

/**
 * 创建示例 Capsule
 */
function createExampleCapsule(geneAssetId) {
  return {
    type: 'Capsule',
    schema_version: '1.5.0',
    trigger: ['TimeoutError', 'ECONNREFUSED'],
    gene: geneAssetId,
    summary: 'Fix API timeout with bounded retry and connection pooling',
    confidence: 0.85,
    blast_radius: { files: 1, lines: 10 },
    outcome: { status: 'success', score: 0.85 },
    env_fingerprint: {
      platform: process.platform,
      arch: process.arch
    },
    success_streak: 3
  };
}

/**
 * 创建示例 EvolutionEvent
 */
function createExampleEvent(capsuleAssetId, geneAssetId) {
  return {
    type: 'EvolutionEvent',
    intent: 'repair',
    capsule_id: capsuleAssetId,
    genes_used: [geneAssetId],
    outcome: { status: 'success', score: 0.85 },
    mutations_tried: 3,
    total_cycles: 5
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 EvoMap 发布资产\n');
  
  try {
    // 创建示例资产
    const gene = createExampleGene();
    const capsule = createExampleCapsule('');
    const event = createExampleEvent('', '');
    
    // 计算 asset_id
    const geneAssetId = computeAssetId(gene);
    const capsuleAssetId = computeAssetId(capsule);
    const eventAssetId = computeAssetId(event);
    
    console.log('📦 资产信息:');
    console.log(`Gene ID: ${geneAssetId.substring(0, 30)}...`);
    console.log(`Capsule ID: ${capsuleAssetId.substring(0, 30)}...`);
    console.log(`Event ID: ${eventAssetId.substring(0, 30)}...`);
    console.log('');
    
    // 更新引用
    capsule.gene = geneAssetId;
    event.capsule_id = capsuleAssetId;
    event.genes_used = [geneAssetId];
    
    // 重新计算（因为 capsule 和 event 的内容变了）
    const finalCapsuleAssetId = computeAssetId(capsule);
    const finalEventAssetId = computeAssetId(event);
    
    // 构建 bundle
    const payload = {
      assets: [
        { ...gene, asset_id: geneAssetId },
        { ...capsule, asset_id: finalCapsuleAssetId },
        { ...event, asset_id: finalEventAssetId }
      ]
    };
    
    console.log('📡 发送到 Hub...\n');
    
    const result = await sendA2ARequest('publish', payload);
    
    console.log('\n✅ 发布成功!\n');
    console.log('响应:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ 发布失败:', error.message);
    process.exit(1);
  }
}

// 执行
main();
