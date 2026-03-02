/**
 * 知识库子 Agent 入口
 * 
 * 用法:
 *   node scripts/agent.js --query "问题"
 *   node scripts/agent.js --review <文件路径>
 *   node scripts/agent.js --stats
 */

const { search, indexDocuments, getStats } = require('../lib/vector-store');
const { answerWithContext, reviewContract } = require('../lib/bailian-client');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--stats')) {
    const stats = getStats();
    console.log('\n📊 知识库统计:');
    console.log(`   总块数: ${stats.totalChunks}`);
    console.log(`   最后更新: ${stats.lastUpdate || '从未'}`);
    console.log('\n   分类统计:');
    for (const [cat, count] of Object.entries(stats.categories || {})) {
      console.log(`   - ${cat}: ${count} 块`);
    }
    return;
  }
  
  if (args.includes('--index')) {
    const force = args.includes('--force');
    await indexDocuments(force);
    return;
  }
  
  if (args.includes('--review')) {
    const reviewIndex = args.indexOf('--review');
    const filePath = args[reviewIndex + 1];
    
    if (!filePath) {
      console.log('用法: node scripts/agent.js --review <文件路径>');
      return;
    }
    
    // 读取合同内容
    const contractPath = path.resolve(filePath);
    if (!fs.existsSync(contractPath)) {
      console.log(`❌ 文件不存在: ${contractPath}`);
      return;
    }
    
    const contractContent = fs.readFileSync(contractPath, 'utf-8');
    console.log(`\n📄 审核合同: ${path.basename(contractPath)}`);
    console.log(`   内容长度: ${contractContent.length} 字符\n`);
    
    // 搜索相关制度
    console.log('🔍 搜索相关制度...');
    const contexts = await search('合同审核 制度 规定', 5);
    
    if (contexts.length === 0) {
      console.log('⚠️ 未找到相关制度');
      return;
    }
    
    console.log(`   找到 ${contexts.length} 条相关制度\n`);
    
    // 调用子 Agent 审核
    console.log('🤖 子 Agent 审核中...\n');
    const result = await reviewContract(contractContent, contexts);
    
    console.log('=== 审核结果 ===\n');
    console.log(`合规性: ${result.compliant === true ? '✅ 通过' : result.compliant === false ? '❌ 不合规' : '⚠️ 需人工审核'}`);
    
    if (result.issues && result.issues.length > 0) {
      console.log('\n发现的问题:');
      result.issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log('\n修改建议:');
      result.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    }
    
    console.log(`\n摘要: ${result.summary}`);
    return;
  }
  
  // 默认：问答模式
  const queryIndex = args.findIndex(a => !a.startsWith('--'));
  if (queryIndex === -1) {
    console.log('用法:');
    console.log('  node scripts/agent.js --query "问题" [--top-k 5]');
    console.log('  node scripts/agent.js --review <文件路径>');
    console.log('  node scripts/agent.js --index [--force]');
    console.log('  node scripts/agent.js --stats');
    return;
  }
  
  const query = args[queryIndex];
  const topKIndex = args.indexOf('--top-k');
  const topK = topKIndex !== -1 ? parseInt(args[topKIndex + 1]) : 5;
  
  console.log(`\n🔍 查询: "${query}"\n`);
  
  // 搜索知识库
  console.log('📚 检索知识库...');
  const contexts = await search(query, topK);
  
  if (contexts.length === 0) {
    console.log('❌ 未找到相关内容');
    return;
  }
  
  console.log(`   找到 ${contexts.length} 条相关内容\n`);
  
  // 调用子 Agent 生成回答
  console.log('🤖 子 Agent 生成回答...\n');
  console.log('--- 回答 ---\n');
  
  const answer = await answerWithContext(query, contexts);
  console.log(answer);
  
  console.log('\n--- 参考资料 ---');
  contexts.forEach((c, i) => {
    console.log(`[${i + 1}] ${c.filePath} (相关度: ${(c.score * 100).toFixed(1)}%)`);
  });
}

main().catch(console.error);
