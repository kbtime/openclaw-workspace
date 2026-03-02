/**
 * SiliconFlow Embedding API 客户端
 * 
 * 向量模型: Qwen/Qwen3-Embedding-8B
 * 重排序模型: Qwen/Qwen3-Reranker-8B
 */

const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1';
const SILICONFLOW_API_KEY = 'sk-goolcijichtxnrgjkznmbdqngfpykzanxnjbhccpuealklak';
const EMBEDDING_MODEL = 'Qwen/Qwen3-Embedding-8B';
const RERANKER_MODEL = 'Qwen/Qwen3-Reranker-8B';

/**
 * 生成文本嵌入向量
 * @param {string|string[]} texts - 要嵌入的文本或文本数组
 * @returns {Promise<number[][]>} 嵌入向量数组
 */
async function createEmbeddings(texts) {
  const input = Array.isArray(texts) ? texts : [texts];
  
  const response = await fetch(`${SILICONFLOW_API_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: input,
      encoding_format: 'float'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API 错误: ${error}`);
  }
  
  const data = await response.json();
  return data.data.map(item => item.embedding);
}

/**
 * 重排序文档
 * @param {string} query - 查询文本
 * @param {string[]} documents - 文档数组
 * @param {number} topN - 返回 top N 结果
 * @returns {Promise<Array<{index: number, relevance_score: number}>>}
 */
async function rerankDocuments(query, documents, topN = 5) {
  const response = await fetch(`${SILICONFLOW_API_URL}/rerank`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: RERANKER_MODEL,
      query: query,
      documents: documents,
      top_n: topN,
      return_documents: false
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Rerank API 错误: ${error}`);
  }
  
  const data = await response.json();
  return data.results;
}

module.exports = {
  createEmbeddings,
  rerankDocuments,
  SILICONFLOW_API_URL,
  SILICONFLOW_API_KEY,
  EMBEDDING_MODEL,
  RERANKER_MODEL
};
