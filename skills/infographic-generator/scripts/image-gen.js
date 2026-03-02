/**
 * 图片生成 API
 * 
 * 支持:
 * - 火山引擎即梦 doubao-seedream-5-0-260128 (支持文字渲染)
 * - 阿里云百炼 wanx-v1 (通用图片生成)
 */

const fs = require('fs');
const path = require('path');

// 火山引擎配置 (推荐，支持文字渲染)
const VOLC_API_KEY = '5f62a702-1e17-4882-85e8-7e31272f78ad';
const VOLC_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const VOLC_MODEL = 'doubao-seedream-5-0-260128';

// 阿里云百炼配置 (备用)
const BAILIAN_API_KEY = 'sk-8eb68b4901d54235bf31bfe8cca4beac';
const BAILIAN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const BAILIAN_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';
const BAILIAN_MODEL = 'wanx-v1';

/**
 * 使用火山引擎生成图片 (支持文字渲染)
 */
async function generateImageVolc(prompt, options = {}) {
  const {
    size = '1920x1920',
    n = 1
  } = options;

  console.log(`模型: ${VOLC_MODEL}`);
  console.log(`尺寸: ${size}`);

  // 火山引擎要求至少 3686400 像素 (约 1920x1920)
  const [width, height] = size.split('x').map(Number);
  const pixels = width * height;
  
  let actualSize = size;
  if (pixels < 3686400) {
    // 自动调整为最小支持尺寸
    actualSize = '1920x1920';
    console.log(`尺寸调整为: ${actualSize} (火山引擎最小要求)`);
  }

  const response = await fetch(VOLC_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VOLC_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: VOLC_MODEL,
      prompt,
      size: actualSize,
      n
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`火山引擎图片生成失败: ${error}`);
  }

  const data = await response.json();
  
  if (data.data && data.data[0]) {
    const imageUrl = data.data[0].url;
    console.log('✅ 生成成功！');
    
    // 下载图片到本地
    const outputDir = path.join(process.env.HOME, '.openclaw/workspace/output/infographics');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = path.join(outputDir, `infographic-${timestamp}.png`);
    
    console.log('正在下载图片...');
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    console.log(`✅ 图片已保存: ${outputPath}`);

    return {
      url: imageUrl,
      localPath: outputPath
    };
  }
  
  throw new Error('图片生成失败: 无返回数据');
}

/**
 * 使用阿里云百炼生成图片 (备用)
 */
async function generateImageBailian(prompt, options = {}) {
  const {
    size = '1280x720',
    n = 1
  } = options;

  console.log(`模型: ${BAILIAN_MODEL}`);
  console.log(`尺寸: ${size}`);

  // 提交任务
  const response = await fetch(BAILIAN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BAILIAN_API_KEY}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable'
    },
    body: JSON.stringify({
      model: BAILIAN_MODEL,
      input: { prompt },
      parameters: { style: '<auto>', size, n }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`阿里云图片生成失败: ${error}`);
  }

  const data = await response.json();
  const taskId = data.output.task_id;
  console.log(`任务 ID: ${taskId}`);

  // 轮询等待结果
  let result = null;
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await sleep(2000);

    const taskResponse = await fetch(`${BAILIAN_TASK_URL}/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${BAILIAN_API_KEY}`
      }
    });

    const taskData = await taskResponse.json();
    const status = taskData.output.task_status;

    if (status === 'SUCCEEDED') {
      const imageUrl = taskData.output.results[0].url;
      console.log('✅ 生成成功！');
      
      // 下载图片
      const outputDir = path.join(process.env.HOME, '.openclaw/workspace/output/infographics');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const outputPath = path.join(outputDir, `infographic-bailian-${timestamp}.png`);
      
      console.log('正在下载图片...');
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      
      console.log(`✅ 图片已保存: ${outputPath}`);

      result = {
        url: imageUrl,
        localPath: outputPath
      };
      break;
    } else if (status === 'FAILED') {
      throw new Error(`图片生成失败: ${JSON.stringify(taskData.output)}`);
    }

    attempts++;
    if (attempts % 5 === 0) {
      console.log(`等待生成中... (${attempts * 2}s)`);
    }
  }

  if (!result) {
    throw new Error('图片生成超时');
  }

  return result;
}

/**
 * 生成图片 (自动选择最佳模型)
 * @param {string} prompt - 图片描述
 * @param {object} options - 选项
 * @returns {Promise<{url: string, localPath: string}>}
 */
async function generateImage(prompt, options = {}) {
  const { provider = 'volc' } = options;
  
  // 火山引擎优先（支持文字渲染）
  if (provider === 'volc' || !provider) {
    try {
      return await generateImageVolc(prompt, options);
    } catch (error) {
      console.log(`火山引擎失败: ${error.message}`);
      console.log('尝试阿里云百炼...');
      return await generateImageBailian(prompt, options);
    }
  }
  
  return await generateImageBailian(prompt, options);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generateImage,
  generateImageVolc,
  generateImageBailian
};
