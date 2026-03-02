/**
 * 知识库查询脚本
 * 
 * 用法:
 *   node scripts/query.js "查询内容" [--top-k 5]
 *   node scripts/query.js --index [--force]
 *   node scripts/query.js --stats
 */

const { search, indexDocuments, getStats } = require('../lib/vector-store');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--index')) {
    // 索引文档
    const force = args.includes('--force');
    await indexDocuments(force);
    return;
  }
  
  if (args.includes('--stats')) {
    // 显示统计
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
  
  // 查询
  const queryIndex = args.findIndex(a => !a.startsWith('--'));
  if (queryIndex === -1) {
    console.log('用法:');
    console.log('  node scripts/query.js "查询内容" [--top-k 5]');
    console.log('  node scripts/query.js --index [--force]');
    console.log('  node scripts/query.js --stats');
    return;
  }
  
  const query = args[queryIndex];
  const topKIndex = args.indexOf('--top-k');
  const topK = topKIndex !== -1 ? parseInt(args[topKIndex + 1]) : 5;
  
  console.log(`\n🔍 查询: "${query}"\n`);
  
  const results = await search(query, topK);
  
  if (results.length === 0) {
    console.log('未找到相关内容');
    return;
  }
  
  console.log(`找到 ${results.length} 条相关内容:\n`);
  
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`--- [${i + 1}] 相关度: ${(r.score * 100).toFixed(1)}% ---`);
    console.log(`来源: ${r.filePath}`);
    console.log(`\n${r.content}\n`);
  }
}

main().catch(console.error);
