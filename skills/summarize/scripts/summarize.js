/**
 * Summarize - 文本摘要工具
 * 使用智能算法提取文本关键信息并生成摘要
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  lengths: {
    short: { ratio: 0.1, minSentences: 1, maxSentences: 3 },
    medium: { ratio: 0.2, minSentences: 3, maxSentences: 5 },
    long: { ratio: 0.3, minSentences: 5, maxSentences: 10 }
  },
  languages: {
    zh: { sentences: /[。！？!?]/g, words: /[\u4e00-\u9fa5]/g },
    en: { sentences: /[.!?]/g, words: /\b\w+\b/g }
  }
};

// 解析命令行参数
const args = process.argv.slice(2);
let text = '';
const options = {
  length: 'medium',
  lang: 'auto',
  format: 'text',
  sentences: null,
  file: null
};

// 解析参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--length' && args[i + 1]) {
    options.length = args[i + 1];
    i++;
  } else if (args[i] === '--lang' && args[i + 1]) {
    options.lang = args[i + 1];
    i++;
  } else if (args[i] === '--format' && args[i + 1]) {
    options.format = args[i + 1];
    i++;
  } else if (args[i] === '--sentences' && args[i + 1]) {
    options.sentences = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--file' && args[i + 1]) {
    options.file = args[i + 1];
    i++;
  } else if (!args[i].startsWith('-')) {
    text += args[i] + ' ';
  }
}

// 从文件读取
if (options.file) {
  try {
    text = fs.readFileSync(options.file, 'utf-8');
  } catch (e) {
    console.error(`❌ 读取文件失败：${e.message}`);
    process.exit(1);
  }
}

text = text.trim();

if (!text) {
  console.error('❌ 错误：请提供要总结的文本内容');
  console.log('用法：node summarize.js "文本内容" [选项]');
  console.log('       node summarize.js --file article.txt');
  console.log('示例：node summarize.js "这是一段长文本..." --length short');
  process.exit(1);
}

/**
 * 检测文本语言
 */
function detectLanguage(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const ratio = chineseChars / text.length;
  return ratio > 0.3 ? 'zh' : 'en';
}

/**
 * 分割句子
 */
function splitSentences(text, lang) {
  const patterns = {
    zh: /[。！？!?;\n]+/g,
    en: /[.!?;\n]+/g
  };
  
  const pattern = patterns[lang] || patterns.zh;
  const sentences = text
    .split(pattern)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  return sentences;
}

/**
 * 计算句子重要性得分
 */
function scoreSentence(sentence, allSentences) {
  const words = sentence.toLowerCase().split(/\s+/);
  let score = 0;
  
  // 长度得分（偏好中等长度）
  const wordCount = words.length;
  if (wordCount >= 10 && wordCount <= 30) {
    score += 2;
  } else if (wordCount >= 5 && wordCount <= 40) {
    score += 1;
  }
  
  // 位置得分（开头和结尾的句子更重要）
  const index = allSentences.indexOf(sentence);
  if (index === 0) score += 3;
  else if (index === 1) score += 2;
  else if (index === allSentences.length - 1) score += 1;
  
  // 关键词得分
  const importantWords = ['重要', '关键', '主要', '首先', '其次', '最后', 
                          'important', 'key', 'main', 'first', 'second', 'finally',
                          '结论', '总结', 'conclusion', 'summary'];
  importantWords.forEach(word => {
    if (sentence.toLowerCase().includes(word)) score += 1;
  });
  
  // 包含数字的句子通常更有信息量
  if (/\d+/.test(sentence)) score += 1;
  
  return score;
}

/**
 * 生成摘要
 */
function generateSummary(text, options) {
  // 检测语言
  const lang = options.lang === 'auto' ? detectLanguage(text) : options.lang;
  
  // 分割句子
  const sentences = splitSentences(text, lang);
  
  if (sentences.length === 0) {
    return {
      summary: text,
      keyPoints: [],
      originalLength: text.length,
      summaryLength: text.length,
      compressionRatio: 1
    };
  }
  
  // 确定摘要句子数量
  let numSentences;
  if (options.sentences) {
    numSentences = options.sentences;
  } else {
    const lengthConfig = CONFIG.lengths[options.length] || CONFIG.lengths.medium;
    numSentences = Math.max(
      lengthConfig.minSentences,
      Math.min(
        Math.ceil(sentences.length * lengthConfig.ratio),
        lengthConfig.maxSentences
      )
    );
  }
  
  numSentences = Math.min(numSentences, sentences.length);
  
  // 计算每个句子的得分
  const scored = sentences.map((sentence, index) => ({
    sentence,
    index,
    score: scoreSentence(sentence, sentences)
  }));
  
  // 按得分排序，选择 top 句子
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => a.index - b.index) // 恢复原始顺序
    .map(item => item.sentence);
  
  // 提取关键要点
  const keyPoints = topSentences.map(s => {
    // 简化句子，去除冗余
    return s.replace(/\s+/g, ' ').trim();
  });
  
  const summary = keyPoints.join(lang === 'zh' ? '。' : ' ');
  
  return {
    summary,
    keyPoints,
    originalLength: text.length,
    summaryLength: summary.length,
    compressionRatio: summary.length / text.length
  };
}

/**
 * 格式化输出
 */
function formatOutput(result, format, lang) {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }
  
  if (format === 'bullet') {
    let output = '关键要点：\n';
    result.keyPoints.forEach((point, i) => {
      output += `- ${point}\n`;
    });
    output += `\n摘要长度：${result.summaryLength} 字符 (压缩比：${(result.compressionRatio * 100).toFixed(1)}%)`;
    return output;
  }
  
  // 默认文本格式
  let output = '【摘要】\n';
  output += result.summary;
  output += '\n\n【关键要点】\n';
  result.keyPoints.forEach((point, i) => {
    output += `• ${point}\n`;
  });
  output += `\n原文长度：${result.originalLength} 字符`;
  output += `\n摘要长度：${result.summaryLength} 字符`;
  output += `\n压缩比：${(result.compressionRatio * 100).toFixed(1)}%`;
  
  return output;
}

/**
 * 主函数
 */
function main() {
  console.error(`📝 生成摘要...\n`);
  console.error(`参数：length=${options.length}, format=${options.format}, lang=${options.lang}\n`);
  
  try {
    const result = generateSummary(text, options);
    const output = formatOutput(result, options.format, detectLanguage(text));
    
    console.log(output);
    
  } catch (error) {
    console.error('❌ 摘要生成失败:', error.message);
    process.exit(1);
  }
}

// 执行
main();
