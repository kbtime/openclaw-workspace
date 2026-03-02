/**
 * 知识库向量存储
 * 
 * 使用简单的 JSON 文件存储向量索引
 * 支持增量更新和相似度搜索
 */

const fs = require('fs');
const path = require('path');
const { createEmbeddings, rerankDocuments } = require('./embeddings');

const KNOWLEDGE_BASE_DIR = path.join(process.env.HOME || '/root', '.openclaw/workspace/knowledge-base');
const INDEX_FILE = path.join(process.env.HOME || '/root', '.openclaw/workspace/data/knowledge-index.json');

/**
 * 文档分块
 * @param {string} content - 文档内容
 * @param {number} chunkSize - 块大小（字符）
 * @param {number} overlap - 重叠大小
 * @returns {string[]} 分块数组
 */
function chunkText(content, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  
  while (start < content.length) {
    let end = start + chunkSize;
    
    // 尝试在句子边界切分
    if (end < content.length) {
      const lastPeriod = content.lastIndexOf('。', end);
      const lastNewline = content.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize / 2) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(content.slice(start, end).trim());
    start = end - overlap;
  }
  
  return chunks.filter(c => c.length > 50); // 过滤太短的块
}

/**
 * 加载向量索引
 */
function loadIndex() {
  if (fs.existsSync(INDEX_FILE)) {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  }
  return { documents: [], lastUpdate: null };
}

/**
 * 保存向量索引
 */
function saveIndex(index) {
  const dir = path.dirname(INDEX_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  index.lastUpdate = new Date().toISOString();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * 索引知识库文档
 * @param {boolean} force - 是否强制重建索引
 */
async function indexDocuments(force = false) {
  console.log('📚 开始索引知识库文档...');
  
  const index = force ? { documents: [], lastUpdate: null } : loadIndex();
  const indexedFiles = new Set(index.documents.map(d => d.filePath));
  
  let newCount = 0;
  let updateCount = 0;
  
  // 遍历知识库目录
  const categories = fs.readdirSync(KNOWLEDGE_BASE_DIR).filter(f => {
    const stat = fs.statSync(path.join(KNOWLEDGE_BASE_DIR, f));
    return stat.isDirectory();
  });
  
  for (const category of categories) {
    const categoryPath = path.join(KNOWLEDGE_BASE_DIR, category);
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const stat = fs.statSync(filePath);
      const fileKey = `${category}/${file}`;
      
      // 检查是否需要更新
      const existing = index.documents.find(d => d.filePath === fileKey);
      if (existing && new Date(existing.modifiedAt) >= stat.mtime) {
        continue; // 未修改，跳过
      }
      
      // 读取并分块
      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = chunkText(content);
      
      // 生成嵌入向量
      console.log(`  处理: ${fileKey} (${chunks.length} 个块)`);
      const embeddings = await createEmbeddings(chunks);
      
      // 移除旧索引
      index.documents = index.documents.filter(d => d.filePath !== fileKey);
      
      // 添加新索引
      for (let i = 0; i < chunks.length; i++) {
        index.documents.push({
          filePath: fileKey,
          category: category,
          chunkIndex: i,
          content: chunks[i],
          embedding: embeddings[i],
          modifiedAt: stat.mtime.toISOString()
        });
      }
      
      if (existing) updateCount++;
      else newCount++;
    }
  }
  
  saveIndex(index);
  console.log(`✅ 索引完成: 新增 ${newCount} 个文件, 更新 ${updateCount} 个文件`);
  
  return { newCount, updateCount, total: index.documents.length };
}

/**
 * 相似度搜索（余弦相似度）
 * @param {string} query - 查询文本
 * @param {number} topK - 返回 top K 结果
 * @returns {Promise<Array<{content: string, filePath: string, score: number}>>}
 */
async function search(query, topK = 5) {
  const index = loadIndex();
  
  if (index.documents.length === 0) {
    console.log('⚠️ 知识库为空，请先运行索引');
    return [];
  }
  
  // 生成查询向量
  const [queryEmbedding] = await createEmbeddings([query]);
  
  // 计算相似度
  const results = index.documents.map(doc => ({
    content: doc.content,
    filePath: doc.filePath,
    category: doc.category,
    score: cosineSimilarity(queryEmbedding, doc.embedding)
  }));
  
  // 排序并返回 topK
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, Math.min(topK * 2, results.length)); // 取 2 倍用于重排序
  
  // 重排序
  if (topResults.length > 0) {
    const rerankInput = topResults.map(r => r.content);
    const rerankResults = await rerankDocuments(query, rerankInput, topK);
    
    return rerankResults.map(r => ({
      content: topResults[r.index].content,
      filePath: topResults[r.index].filePath,
      category: topResults[r.index].category,
      score: r.relevance_score
    }));
  }
  
  return topResults.slice(0, topK);
}

/**
 * 余弦相似度计算
 */
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 获取知识库统计信息
 */
function getStats() {
  const index = loadIndex();
  const categories = {};
  
  for (const doc of index.documents) {
    categories[doc.category] = (categories[doc.category] || 0) + 1;
  }
  
  return {
    totalChunks: index.documents.length,
    categories: categories,
    lastUpdate: index.lastUpdate
  };
}

module.exports = {
  indexDocuments,
  search,
  getStats,
  loadIndex,
  saveIndex
};
