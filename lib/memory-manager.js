/**
 * 跨会话记忆连续性模块
 * 基于 EvoMap Capsule: sha256:def136049c982ed785117dff00bb3238ed71d11cf77c019b3db2a8f65b476f06
 * 
 * 功能：
 * - 自动加载 RECENT_EVENTS.md（24h 滚动）
 * - 自动加载 memory/YYYY-MM-DD.md（日常记忆）
 * - 自动加载 MEMORY.md（长期记忆）
 * - 会话结束时自动保存重要事件
 */

const fs = require('fs');
const path = require('path');

// 配置
const WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace';
const RECENT_EVENTS_FILE = path.join(WORKSPACE, 'RECENT_EVENTS.md');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const MEMORY_FILE = path.join(WORKSPACE, 'MEMORY.md');

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取今天的日期字符串
 */
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取今天的记忆文件路径
 */
function getTodayMemoryFile() {
  return path.join(MEMORY_DIR, `${getTodayStr()}.md`);
}

/**
 * 读取文件（如果存在）
 */
function readFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (e) {
    console.error(`[Memory] 读取文件失败 ${filePath}:`, e.message);
  }
  return null;
}

/**
 * 追加内容到文件
 */
function appendToFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, content + '\n');
}

/**
 * 写入文件（覆盖）
 */
function writeToFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * 加载所有记忆（会话启动时调用）
 * @returns {object} 记忆对象
 */
function loadAllMemory() {
  const memory = {
    recentEvents: null,
    dailyMemory: null,
    longTermMemory: null,
    loadedAt: new Date().toISOString()
  };
  
  // 1. 加载 24h 滚动事件
  memory.recentEvents = readFileIfExists(RECENT_EVENTS_FILE);
  
  // 2. 加载今日记忆
  memory.dailyMemory = readFileIfExists(getTodayMemoryFile());
  
  // 3. 加载长期记忆
  memory.longTermMemory = readFileIfExists(MEMORY_FILE);
  
  const loadedFiles = [];
  if (memory.recentEvents) loadedFiles.push('RECENT_EVENTS.md');
  if (memory.dailyMemory) loadedFiles.push(`memory/${getTodayStr()}.md`);
  if (memory.longTermMemory) loadedFiles.push('MEMORY.md');
  
  console.log(`[Memory] 已加载记忆文件：${loadedFiles.join(', ') || '无'}`);
  
  return memory;
}

/**
 * 记录重要事件（会话中调用）
 * @param {string} event - 事件内容
 * @param {string} category - 分类（可选）
 */
function logEvent(event, category = 'general') {
  const timestamp = new Date().toISOString();
  const eventLine = `- [${timestamp}] [${category}] ${event}`;
  
  // 追加到滚动事件文件
  appendToFile(RECENT_EVENTS_FILE, eventLine);
  
  // 同时追加到今日记忆
  const todayFile = getTodayMemoryFile();
  appendToFile(todayFile, eventLine);
  
  console.log(`[Memory] 记录事件：${event.substring(0, 50)}...`);
}

/**
 * 保存会话摘要（会话结束时调用）
 * @param {string} summary - 会话摘要
 * @param {array} keyEvents - 关键事件列表
 */
function saveSessionSummary(summary, keyEvents = []) {
  const timestamp = new Date().toISOString();
  const today = getTodayStr();
  
  // 1. 追加到滚动事件（清理 24h 前的事件）
  const sessionEntry = `
## ${timestamp} 会话摘要

${summary}

### 关键事件
${keyEvents.map(e => `- ${e}`).join('\n')}
`;
  
  appendToFile(RECENT_EVENTS_FILE, sessionEntry);
  appendToFile(getTodayMemoryFile(), sessionEntry);
  
  // 2. 滚动清理（保留最近 24h）
  rotateRecentEvents();
  
  console.log(`[Memory] 已保存会话摘要`);
}

/**
 * 滚动清理 RECENT_EVENTS.md（保留最近 24h）
 */
function rotateRecentEvents() {
  if (!fs.existsSync(RECENT_EVENTS_FILE)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(RECENT_EVENTS_FILE, 'utf-8');
    const lines = content.split('\n');
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const filteredLines = lines.filter(line => {
      // 提取时间戳
      const match = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      if (!match) return true; // 保留没有时间戳的行（如标题）
      
      const lineTime = new Date(match[1]).getTime();
      return lineTime > oneDayAgo;
    });
    
    // 如果清理后内容变化大，重新写入
    if (filteredLines.length < lines.length * 0.5) {
      writeToFile(RECENT_EVENTS_FILE, filteredLines.join('\n'));
      console.log(`[Memory] 滚动清理 RECENT_EVENTS.md: ${lines.length} → ${filteredLines.length} 行`);
    }
  } catch (e) {
    console.error('[Memory] 滚动清理失败:', e.message);
  }
}

/**
 * 更新长期记忆（手动调用）
 * @param {string} content - 新的记忆内容
 */
function updateLongTermMemory(content) {
  writeToFile(MEMORY_FILE, content);
  console.log('[Memory] 已更新长期记忆');
}

/**
 * 追加到长期记忆
 * @param {string} content - 要追加的内容
 */
function appendToLongTermMemory(content) {
  appendToFile(MEMORY_FILE, content);
  console.log('[Memory] 已追加到长期记忆');
}

module.exports = {
  loadAllMemory,
  logEvent,
  saveSessionSummary,
  updateLongTermMemory,
  appendToLongTermMemory,
  RECENT_EVENTS_FILE,
  MEMORY_DIR,
  MEMORY_FILE
};
