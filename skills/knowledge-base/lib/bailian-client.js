/**
 * 阿里云百炼 API 客户端
 * 
 * 模型: qwen3.5-flash
 * 用于知识库子 Agent
 */

const BAILIAN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const BAILIAN_API_KEY = 'sk-8eb68b4901d54235bf31bfe8cca4beac';
const BAILIAN_MODEL = 'qwen3.5-flash';

/**
 * 调用百炼模型
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userMessage - 用户消息
 * @param {object} options - 其他选项
 * @returns {Promise<string>} 模型回复
 */
async function chat(systemPrompt, userMessage, options = {}) {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: userMessage });
  
  const response = await fetch(`${BAILIAN_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BAILIAN_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: BAILIAN_MODEL,
      messages: messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
      ...options
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`百炼 API 错误: ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 知识库问答
 * @param {string} query - 用户问题
 * @param {Array<{content: string, score: number}>} contexts - 检索到的上下文
 * @returns {Promise<string>} 回答
 */
async function answerWithContext(query, contexts) {
  const contextText = contexts.map((c, i) => 
    `[${i + 1}] ${c.content}`
  ).join('\n\n---\n\n');
  
  const systemPrompt = `你是一个知识库助手。根据提供的知识库内容回答用户问题。

规则：
1. 只使用提供的知识库内容回答
2. 如果知识库中没有相关信息，明确说明
3. 引用时要标注来源编号，如 [1]、[2]
4. 回答要简洁准确`;

  const userPrompt = `知识库内容：
${contextText}

---
用户问题：${query}

请根据知识库内容回答：`;

  return await chat(systemPrompt, userPrompt);
}

/**
 * 合同审核
 * @param {string} contractContent - 合同内容
 * @param {Array<{content: string}>} policies - 相关制度
 * @returns {Promise<object>} 审核结果
 */
async function reviewContract(contractContent, policies) {
  const policyText = policies.map((p, i) => 
    `[制度${i + 1}] ${p.content}`
  ).join('\n\n');
  
  const systemPrompt = `你是一个合同审核助手。根据公司制度审核合同内容。

输出格式（JSON）：
{
  "compliant": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "summary": "审核摘要"
}`;

  const userPrompt = `公司制度：
${policyText}

---
合同内容：
${contractContent}

请审核这份合同：`;

  const response = await chat(systemPrompt, userPrompt);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      compliant: null,
      issues: [],
      suggestions: [],
      summary: response
    };
  }
}

module.exports = {
  chat,
  answerWithContext,
  reviewContract,
  BAILIAN_API_URL,
  BAILIAN_API_KEY,
  BAILIAN_MODEL
};
