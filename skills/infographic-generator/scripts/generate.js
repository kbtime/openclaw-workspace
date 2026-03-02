#!/usr/bin/env node
/**
 * 信息图生成器
 * 
 * 用法:
 *   node generate.js --content "内容.md"
 *   node generate.js --content "内容" --layout timeline --style craft-handmade
 */

const fs = require('fs');
const path = require('path');
const { generateImage } = require('./image-gen');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    content: null,
    layout: 'bento-grid',
    style: 'craft-handmade',
    aspect: 'landscape',
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--content' || args[i] === '-c') {
      params.content = args[++i];
    } else if (args[i] === '--layout' || args[i] === '-l') {
      params.layout = args[++i];
    } else if (args[i] === '--style' || args[i] === '-s') {
      params.style = args[++i];
    } else if (args[i] === '--aspect' || args[i] === '-a') {
      params.aspect = args[++i];
    } else if (args[i] === '--output' || args[i] === '-o') {
      params.output = args[++i];
    }
  }

  return params;
}

// 读取内容
function readContent(contentParam) {
  // 如果是文件路径
  if (fs.existsSync(contentParam)) {
    return fs.readFileSync(contentParam, 'utf-8');
  }
  // 否则直接作为内容
  return contentParam;
}

// 读取布局定义
function readLayout(layout) {
  const layoutPath = path.join(__dirname, '../references/layouts', `${layout}.md`);
  try {
    return fs.readFileSync(layoutPath, 'utf-8');
  } catch (e) {
    console.log(`⚠️ 未找到布局定义: ${layout}，使用默认`);
    return '';
  }
}

// 读取风格定义
function readStyle(style) {
  const stylePath = path.join(__dirname, '../references/styles', `${style}.md`);
  try {
    return fs.readFileSync(stylePath, 'utf-8');
  } catch (e) {
    console.log(`⚠️ 未找到风格定义: ${style}，使用默认`);
    return '';
  }
}

// 构建图片生成 Prompt
function buildPrompt(content, layout, style, layoutDef, styleDef) {
  return `Create a professional infographic with the following specifications:

## LAYOUT: ${layout}
${layoutDef || 'Use a flexible grid layout that organizes information clearly'}

## STYLE: ${style}
${styleDef || 'Clean, modern design with clear typography'}

## CONTENT TO VISUALIZE:
${content}

## DESIGN REQUIREMENTS:
1. Clear visual hierarchy with main title at top
2. Use appropriate icons and illustrations
3. Consistent color scheme matching the style
4. All text must be readable
5. Professional infographic quality
6. No watermarks or signatures`;
}

// 获取图片尺寸 (火山引擎最小要求 3686400 像素)
function getSize(aspect) {
  switch (aspect) {
    case 'portrait':
      return '1920x1920';  // 3,686,400 像素
    case 'square':
      return '1920x1920';
    case 'landscape':
    default:
      return '1920x1920';
  }
}

async function main() {
  const params = parseArgs();

  if (!params.content) {
    console.log('用法:');
    console.log('  node generate.js --content "内容.md"');
    console.log('  node generate.js --content "内容" --layout timeline --style craft-handmade');
    console.log('');
    console.log('布局选项: linear-progression, binary-comparison, bento-grid, 等');
    console.log('风格选项: craft-handmade, claymation, kawaii, 等');
    process.exit(1);
  }

  console.log('🎨 信息图生成器');
  console.log('========================================');
  console.log(`布局: ${params.layout}`);
  console.log(`风格: ${params.style}`);
  console.log(`比例: ${params.aspect}`);
  console.log('');

  // 读取内容
  const content = readContent(params.content);
  console.log(`内容长度: ${content.length} 字符`);

  // 读取布局和风格定义
  const layoutDef = readLayout(params.layout);
  const styleDef = readStyle(params.style);

  // 构建 Prompt
  const prompt = buildPrompt(content, params.layout, params.style, layoutDef, styleDef);

  // 生成图片
  console.log('');
  console.log('📸 正在生成图片...');
  const size = getSize(params.aspect);

  try {
    const result = await generateImage(prompt, { size });

    console.log('');
    console.log('✅ 生成成功！');
    console.log(`图片 URL: ${result.url}`);

    // 如果指定了输出路径，下载图片
    if (params.output) {
      console.log(`正在下载到: ${params.output}`);
      const response = await fetch(result.url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(params.output, Buffer.from(buffer));
      console.log('✅ 下载完成');
    }

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
