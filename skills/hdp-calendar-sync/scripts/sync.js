/**
 * HDP 课程行程同步到飞书日历
 * 
 * 功能：
 * 1. 自动登录 HDP 系统查询课程安排
 * 2. 解析行程数据（课程题目、时间、地点、课酬、对接人等）
 * 3. 自动同步到飞书日历（智能去重，避免重复添加）
 * 4. 执行完成后自动记录到飞书任务执行记录表
 * 
 * 环境变量：
 * - FEISHU_USER_TOKEN: 飞书用户 Access Token
 * - FEISHU_CALENDAR_ID: 飞书日历 ID（可选，默认使用主日历）
 * - CRON_TASK_ID: Cron 任务 ID（用于执行记录关联）
 * 
 * 使用方式：
 * node scripts/sync.js
 */

const { chromium } = require('playwright');
const { logExecution } = require('./log-to-feishu');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  hdp: {
    loginUrl: 'https://hdp.huashijingji.com/#/user/login',
    username: '廖宏',
    password: '888999',
    tripApi: 'https://hdp.huashijingji.com/admin/trip.index/index'
  },
  feishu: {
    calendarApi: 'https://open.feishu.cn/open-apis/calendar/v4/calendars',
    eventsApi: '/events'
  }
};

// Token 刷新配置
const APP_ID = 'cli_a9184c4094b8dcbb';
const APP_SECRET = 'sNEMtAe7F8I43vneAYBwCeHbmlqild3d';
const TOKEN_FILE = path.join(process.env.HOME || '/root', '.openclaw/workspace/lib/feishu-user-token.json');

/**
 * 刷新飞书 User Token
 */
async function refreshUserToken() {
  try {
    const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    
    if (!tokenInfo.refresh_token) {
      console.error('❌ 缺少 refresh_token');
      return null;
    }
    
    const res = await fetch('https://open.feishu.cn/open-apis/authen/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        refresh_token: tokenInfo.refresh_token
      })
    });
    
    const data = await res.json();
    
    if (data.code === 0) {
      const newTokenInfo = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
        scope: data.scope,
        obtainedAt: new Date().toISOString()
      };
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(newTokenInfo, null, 2));
      console.log('✅ Token 已自动刷新');
      return data.access_token;
    } else {
      console.error('❌ Token 刷新失败:', data.msg);
      return null;
    }
  } catch (e) {
    console.error('❌ 刷新 Token 异常:', e.message);
    return null;
  }
}

/**
 * 获取飞书 Token（自动刷新过期 Token）
 */
async function getFeishuToken() {
  // 1. 优先从环境变量获取
  if (process.env.FEISHU_USER_TOKEN) {
    return process.env.FEISHU_USER_TOKEN;
  }
  
  // 2. 从本地 token 文件读取
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const tokenInfo = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      const now = Date.now();
      
      // 检查是否过期（提前 5 分钟判断）
      if (tokenInfo.expiresAt && tokenInfo.expiresAt > now + 300000) {
        return tokenInfo.access_token;
      }
      
      // Token 过期，尝试刷新
      console.log('⚠️ Token 已过期，正在自动刷新...');
      return await refreshUserToken();
    }
  } catch (e) {
    console.error('读取 Token 文件失败:', e.message);
  }
  
  return null;
}

/**
 * 写入记录到本地 Dashboard 数据库
 */
async function writeToDashboard(cronJobId, taskName, status, result, error, durationMs) {
  try {
    const { execSync } = require('child_process');
    const dashboardPath = path.join(process.env.HOME || '/root', '.openclaw/workspace/skills/task-dashboard/scripts/write-record.js');
    
    if (!fs.existsSync(dashboardPath)) {
      console.log('⚠️ Dashboard 未安装，跳过本地记录');
      return;
    }
    
    const args = [
      'node',
      dashboardPath,
      '--cron-job-id', cronJobId,
      '--task-name', taskName,
      '--status', status,
      '--result', result || '',
      '--error', error || '',
      '--duration-ms', String(durationMs || 0)
    ];
    
    execSync(args.join(' '), { encoding: 'utf-8' });
  } catch (e) {
    console.error('写入 Dashboard 记录失败:', e.message);
  }
}

// 日历 ID
const FEISHU_CALENDAR_ID = process.env.FEISHU_CALENDAR_ID || 'feishu.cn_6aG4WxQMimvp7xZwQLVKwa@group.calendar.feishu.cn';

/**
 * 解析时间字符串，返回开始和结束时间（小时和分钟）
 * 支持格式：
 * - "上午:09:00-12:00，下午:14:00-17:00"
 * - "09:00-12:00"
 * - "全天"
 */
function parseTimeSchedule(timeStr, courseName = '') {
  // 如果是休息日或者没有时间信息，返回全天
  if (!timeStr || 
      timeStr.includes('全天') || 
      timeStr.includes('待确定') ||
      (courseName && courseName.includes('休息'))) {
    return { startHour: 0, startMin: 0, endHour: 23, endMin: 59 };
  }
  
  // 提取所有时间段
  const times = [];
  const timePattern = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
  let match;
  
  while ((match = timePattern.exec(timeStr)) !== null) {
    times.push({
      startHour: parseInt(match[1]),
      startMin: parseInt(match[2]),
      endHour: parseInt(match[3]),
      endMin: parseInt(match[4])
    });
  }
  
  if (times.length === 0) {
    // 默认 9:00-17:00
    return { startHour: 9, startMin: 0, endHour: 17, endMin: 0 };
  }
  
  // 返回最早开始时间和最晚结束时间
  const startTime = times.reduce((min, t) => 
    (t.startHour * 60 + t.startMin) < (min.startHour * 60 + min.startMin) ? t : min
  , times[0]);
  
  const endTime = times.reduce((max, t) => 
    (t.endHour * 60 + t.endMin) > (max.endHour * 60 + max.endMin) ? t : max
  , times[0]);
  
  return {
    startHour: startTime.startHour,
    startMin: startTime.startMin,
    endHour: endTime.endHour,
    endMin: endTime.endMin
  };
}

/**
 * 解析 HTML 格式的行程信息（13 条信息）
 */
function parseScheduleInfo(info) {
  if (!info) return {};
  
  const text = info
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
  
  const result = {};
  
  // 1. 机构名称
  const orgMatch = text.match(/机构名称.*?[：:]\s*(.+)/);
  if (orgMatch) result.organization = orgMatch[1].trim();
  
  // 2. 客户名称
  const clientMatch = text.match(/客户名称.*?[：:]\s*(.+)/);
  if (clientMatch) result.client = clientMatch[1].trim();
  
  // 3. 课程题目
  const titleMatch = text.match(/课程题目.*?[：:]\s*(.+)/);
  if (titleMatch) result.courseTitle = titleMatch[1].trim();
  
  // 4. 对象人数
  const audienceMatch = text.match(/对象人数.*?[：:]\s*(.+)/);
  if (audienceMatch) result.audience = audienceMatch[1].trim();
  
  // 5. 当地天气
  const weatherMatch = text.match(/当地天气.*?[：:]\s*(.+)/);
  if (weatherMatch) result.weather = weatherMatch[1].trim();
  
  // 6. 时间安排
  const timeMatch = text.match(/时间安排.*?[：:]\s*(.+)/);
  if (timeMatch) {
    result.schedule = timeMatch[1].trim();
    // 解析具体时间
    const courseName = result.courseTitle || '';
    result.timeParsed = parseTimeSchedule(result.schedule, courseName);
  }
  
  // 7. 行程安排（去程/回程）
  const tripMatch = text.match(/行程安排如下.*?[：:]\s*([\s\S]*?)(?=\n\d+、|$)/);
  if (tripMatch) result.tripInfo = tripMatch[1].trim();
  
  // 8. 上课地址
  const addressMatch = text.match(/上课地址.*?[：:]\s*(.+)/);
  if (addressMatch && addressMatch[1].trim()) result.address = addressMatch[1].trim();
  
  // 9. 住宿地址
  const hotelMatch = text.match(/住宿地址.*?[：:]\s*(.+)/);
  if (hotelMatch && hotelMatch[1].trim()) result.hotel = hotelMatch[1].trim();
  
  // 10. 机构对接人
  const contactMatch = text.match(/机构对接人.*?[：:]\s*(.+)/);
  if (contactMatch) result.contact = contactMatch[1].trim();
  
  // 11. 备注信息（本机构还请过...）
  const noteMatch = text.match(/本机构还请过\s*([^\n]+)/);
  if (noteMatch) result.note = noteMatch[1].trim();
  
  // 12. 课酬天数
  const moneyMatch = text.match(/课酬天数.*?[：:]\s*(.+)/);
  if (moneyMatch) result.moneyInfo = moneyMatch[1].trim();
  
  // 13. 其他要求（老师您这边还有什么...）
  const requirementMatch = text.match(/老师您这边还有什么[^\n]+/);
  if (requirementMatch) result.requirement = requirementMatch[0].trim();
  
  // 额外：课题名称
  const courseNameMatch = text.match(/课题名称 [：:](.+)/);
  if (courseNameMatch) result.courseName = courseNameMatch[1].trim();
  
  return result;
}

/**
 * 从行程数据构建日历事件
 */
function buildCalendarEvent(schedule) {
  const parsed = parseScheduleInfo(schedule.info);
  
  // 解析日期（只取日期部分）
  const dateStr = schedule.start.split(' ')[0]; // "2026-02-26"
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // 根据解析的时间设置开始和结束时间
  const isRestDay = schedule.title && schedule.title.includes('休息');
  const timeInfo = parsed.timeParsed || { startHour: 0, startMin: 0, endHour: 23, endMin: 59 };
  
  // 如果是休息日，覆盖为全天
  const finalTimeInfo = isRestDay ? { startHour: 0, startMin: 0, endHour: 23, endMin: 59 } : timeInfo;
  
  const startTime = new Date(year, month - 1, day, finalTimeInfo.startHour, finalTimeInfo.startMin, 0);
  const endTime = new Date(year, month - 1, day, finalTimeInfo.endHour, finalTimeInfo.endMin, 0);
  
  // 解析上课天数
  const totalDay = parseFloat(schedule.totalday) || 0;
  const dayText = totalDay > 0 ? `${totalDay}天` : '1 天';
  
  // 构建事件标题：城市 - 上课天数 - 课题方向 - 跟进人
  let summary = '';
  
  // 城市（优先使用 mtitle，如果是"预定"则从 title 中提取）
  let city = '待定';
  if (schedule.mtitle && schedule.mtitle !== '预定') {
    city = schedule.mtitle;
  } else if (schedule.title) {
    // 从 title 中提取城市（格式：休息，廖宏，昆明市，姜雷 1）
    const titleParts = schedule.title.split(',');
    if (titleParts.length >= 3) {
      city = titleParts[2].trim();
    }
  }
  summary += city;
  
  // 上课天数
  summary += `-${dayText}`;
  
  // 课题方向
  const courseName = parsed.courseTitle || parsed.courseName || '';
  if (courseName) {
    const cleanName = courseName.replace(/[《》]/g, '');
    summary += `-${cleanName}`;
  } else if (isRestDay) {
    summary += '-休息';
  } else {
    summary += '-课题待定';
  }
  
  // 跟进人（从 title 中提取最后一个逗号后的内容）
  const titleParts = schedule.title ? schedule.title.split(',') : [];
  const follower = titleParts.length > 0 ? titleParts[titleParts.length - 1].trim() : '待定';
  summary += `-${follower}`;
  
  // 构建事件描述（13 条信息）
  const description = [];
  description.push(`【课程信息】`);
  description.push(`HDP事件ID：${schedule.id}`);
  if (parsed.organization) description.push(`1. 机构名称：${parsed.organization}`);
  if (parsed.client) description.push(`2. 客户名称：${parsed.client}`);
  if (parsed.courseTitle) description.push(`3. 课程题目：${parsed.courseTitle}`);
  if (parsed.audience) description.push(`4. 对象人数：${parsed.audience}`);
  if (parsed.weather) description.push(`5. 当地天气：${parsed.weather}`);
  if (parsed.schedule) description.push(`6. 时间安排：${parsed.schedule}`);
  if (parsed.tripInfo) description.push(`7. 行程安排：${parsed.tripInfo}`);
  if (parsed.address) description.push(`8. 上课地址：${parsed.address}`);
  if (parsed.hotel) description.push(`9. 住宿地址：${parsed.hotel}`);
  if (parsed.contact) description.push(`10. 机构对接人：${parsed.contact}`);
  if (parsed.note) description.push(`11. 备注：${parsed.note}`);
  if (parsed.moneyInfo) description.push(`12. 课酬天数：${parsed.moneyInfo}`);
  if (schedule.totalmoney && schedule.totalmoney !== '0.00') description.push(`   总金额：${schedule.totalmoney}元`);
  if (parsed.requirement) description.push(`13. 其他要求：${parsed.requirement}`);
  
  description.push(`\n【订单信息】`);
  description.push(`来源：HDP 系统`);
  description.push(`预定时间：${schedule.booktime}`);
  description.push(`确定时间：${schedule.confirm_time || '无'}`);
  if (schedule.itemno) description.push(`订单号：${schedule.itemno}`);
  if (schedule.status === '1') description.push(`状态：已确定`);
  else if (schedule.status === '2') description.push(`状态：预定`);
  
  return {
    summary,
    description: description.join('\n'),
    startTime: Math.floor(startTime.getTime() / 1000),
    endTime: Math.floor(endTime.getTime() / 1000),
    hdpEventId: schedule.id,
    hdpTitle: schedule.title,
    startDate: dateStr
  };
}

/**
 * 获取飞书日历事件列表（用于去重）
 */
async function getFeishuEvents(token, calendarId, startTime, endTime) {
  const url = `${CONFIG.feishu.calendarApi}/${calendarId}${CONFIG.feishu.eventsApi}`;
  
  const params = new URLSearchParams({
    time_min: String(startTime),
    time_max: String(endTime)
  });
  
  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.code === 0) {
      const events = result.data.items || [];
    
    // 为每个事件添加 hdpEventId（从描述中解析）
    for (const event of events) {
      if (event.description) {
        const match = event.description.match(/HDP事件ID[：:]\s*(\S+)/);
        if (match) {
          event.hdpEventId = match[1];
        }
      }
    }
    
    return events;
    }
  } catch (e) {
    console.error('获取事件列表失败:', e.message);
  }
  
  return [];
}

/**
 * 删除飞书日历事件
 */
async function deleteFeishuEvent(token, calendarId, eventId) {
  try {
    const res = await fetch(`https://open.feishu.cn/open-apis/calendar/v4/calendars/${calendarId}/events/${eventId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });
    const data = await res.json();
    if (data.code === 0) {
      return { success: true };
    } else {
      console.error("删除事件失败:", data.msg);
      return { success: false, error: data.msg };
    }
  } catch (e) {
    console.error("删除事件异常:", e.message);
    return { success: false, error: e.message };
  }
}

/**
 * 检查事件是否已存在（通过标题和日期判断）
 */
function isEventExists(existingEvents, newEvent) {
  const newStart = newEvent.startTime;
  const newEnd = newEvent.endTime;
  const newSummary = newEvent.summary;
  
  for (const event of existingEvents) {
    // 检查标题是否相同
    if (event.summary === newSummary) {
      // 检查时间是否重叠
      const eventStart = new Date(event.start_time.timestamp * 1000).getTime() / 1000;
      const eventEnd = new Date(event.end_time.timestamp * 1000).getTime() / 1000;
      
      if (Math.abs(eventStart - newStart) < 86400) { // 同一天内
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 创建飞书日历事件
 */
async function createFeishuEvent(token, calendarId, event) {
  const url = `${CONFIG.feishu.calendarApi}/${calendarId}${CONFIG.feishu.eventsApi}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start_time: {
        timestamp: event.startTime,
        timezone: 'Asia/Shanghai'
      },
      end_time: {
        timestamp: event.endTime,
        timezone: 'Asia/Shanghai'
      },
      free_busy_status: 'busy',
      visibility: 'private'
    })
  });
  
  const result = await response.json();
  
  if (result.code === 0) {
    return {
      success: true,
      eventId: result.data.event.event_id,
      appLink: result.data.event.app_link
    };
  } else {
    return {
      success: false,
      error: result.msg
    };
  }
}

/**
 * 主函数
 */
async function syncSchedule() {
  const startTime = Date.now(); // 记录开始时间，用于计算耗时
  console.log('🚀 开始同步 HDP 课程行程到飞书日历...\n');
  
  // 获取 Token（自动刷新过期 Token）
  const FEISHU_TOKEN = await getFeishuToken();
  
  // 检查 Token
  if (!FEISHU_TOKEN) {
    console.error('❌ 错误：无法获取飞书 Token');
    console.log('请设置环境变量 FEISHU_USER_TOKEN 或确保 ~/.openclaw/workspace/lib/feishu-user-token.json 存在且有效');
    process.exit(1);
  } else {
    console.log('✅ 飞书 Token 已获取');
  }
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  let scheduleData = null;
  
  // 监听 API 响应
  page.on('response', async response => {
    if (response.url().includes('trip.index/index')) {
      try {
        scheduleData = await response.json();
      } catch (e) {
        console.error('解析行程数据失败:', e.message);
      }
    }
  });
  
  try {
    // 1. 登录 HDP 系统
    console.log('📝 正在登录 HDP 系统...');
    await page.goto(CONFIG.hdp.loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="username"]', CONFIG.hdp.username);
    await page.fill('input[name="password"]', CONFIG.hdp.password);
    await page.press('input[name="password"]', 'Enter');
    await page.waitForTimeout(5000);
    
    // 2. 导航到行程页面
    console.log('📅 查询行程数据...');
    await page.goto('https://hdp.huashijingji.com/#/trip/index', { waitUntil: 'networkidle', timeout: 60000 });
    
    // 等待 API 响应，最多等待 60 秒，持续重试
    let retries = 0;
    const maxRetries = 60;
    while (!scheduleData && retries < maxRetries) {
      await page.waitForTimeout(1000);
      retries++;
      if (retries % 10 === 0) {
        console.log(`   等待数据响应... (${retries}s)`);
      }
    }
    
    // 3. 处理行程数据
    if (!scheduleData || scheduleData.code !== 0) {
      console.error('❌ 获取行程数据失败');
      console.error(`   等待时间: ${retries}秒`);
      console.error(`   scheduleData: ${scheduleData ? JSON.stringify(scheduleData).substring(0, 200) : 'null'}`);
      await browser.close();
      return;
    }
    
    const schedules = scheduleData.data || [];
    console.log(`✅ 获取到 ${schedules.length} 条行程记录\n`);
    
    if (schedules.length === 0) {
      console.log('当前没有行程安排');
      return;
    }
    
    // 4. 获取现有飞书日历事件（用于去重）
    console.log('📋 获取现有日历事件...');
    const now = Math.floor(Date.now() / 1000);
    const threeMonthsLater = now + (90 * 24 * 60 * 60); // 3 个月后
    const existingEvents = await getFeishuEvents(FEISHU_TOKEN, FEISHU_CALENDAR_ID, now, threeMonthsLater);
    console.log(`   当前日历中有 ${existingEvents.length} 个事件\n`);
    
    // 5. 同步到飞书日历
    console.log('🔄 开始同步到飞书日历...\n');

    // 6. 检查并删除已变色的行程（之前是红色同步的，现在变黄了）
    console.log("\n🗑️ 检查已变色行程...");
    let deleteCount = 0;
    
    // 获取当前 HDP 中的有效行程 ID 列表（红色的/已完成的）
    const currentRedIds = new Set();
    for (const s of schedules) {
      const scheduleDate = new Date(s.start.split(" ")[0]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (scheduleDate < today) {
        currentRedIds.add(s.id);
      }
    }
    
    // 遍历已同步的事件，检查是否需要删除
    for (const event of existingEvents) {
      // 只有带 HDP 标记的事件才检查
      if (event.hdpEventId && !currentRedIds.has(event.hdpEventId)) {
        console.log(`   🗑️ 删除变色行程: ${event.summary} (ID: ${event.hdpEventId})`);
        await deleteFeishuEvent(FEISHU_TOKEN, FEISHU_CALENDAR_ID, event.eventId);
        deleteCount++;
      }
    }
    if (deleteCount > 0) {
      console.log(`   ✅ 已删除 ${deleteCount} 条变色行程`);
    } else {
      console.log("   ✅ 无需删除的变色行程");
    }
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    for (const schedule of schedules) {
      // 只处理红色（已完成的）行程 - 过滤掉未完成的
      const scheduleDate = new Date(schedule.start.split(" ")[0]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 如果日期在今天或之后（未完成），跳过
      if (scheduleDate >= today) {
        console.log("   ⏭️  未完成（跳过）: " + (schedule.title || schedule.mtitle || "未命名"));
        skipCount++;
        continue;
      }
      const event = buildCalendarEvent(schedule);
      
      console.log(`📌 处理：${event.summary}`);
      console.log(`   时间：${new Date(event.startTime * 1000).toLocaleString('zh-CN')} - ${new Date(event.endTime * 1000).toLocaleString('zh-CN')}`);
      
      // 检查是否已存在
      const exists = isEventExists(existingEvents, event);
      
      if (exists) {
        console.log('   ⏭️  已存在，跳过\n');
        skipCount++;
        continue;
      }
      
      // 创建事件
      const result = await createFeishuEvent(FEISHU_TOKEN, FEISHU_CALENDAR_ID, event);
      
      if (result.success) {
        console.log(`   ✅ 创建成功`);
        console.log(`   链接：${result.appLink}\n`);
        successCount++;
        
        // 添加到已存在列表，避免同一批次重复
        existingEvents.push({
          summary: event.summary,
          start_time: { timestamp: event.startTime },
          end_time: { timestamp: event.endTime }
        });
      } else {
        console.log(`   ❌ 创建失败：${result.error}\n`);
        failCount++;
      }
    }
    
    // 6. 输出统计
    console.log('\n' + '='.repeat(50));
    console.log('📊 同步完成');
    console.log(`   ✅ 成功：${successCount}`);
    console.log(`   ⏭️  跳过：${skipCount}`);
    console.log(`   ❌ 失败：${failCount}`);
    console.log('='.repeat(50));
    
    // 7. 记录到飞书任务执行表
    const finalStatus = failCount > 0 ? (successCount > 0 ? '部分成功' : '失败') : '成功';
    const resultSummary = `成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}`;
    await logExecution(
      'HDP 课程日历同步',
      finalStatus,
      resultSummary,
      failCount > 0 ? `${failCount} 条记录同步失败` : '',
      process.env.CRON_TASK_ID || ''
    );
    
    // 执行记录由 sync-records.js 定时同步，这里不再重复写入
    return { successCount, skipCount, failCount };
    
  } catch (error) {
    console.error('❌ 执行出错:', error.message);
    
    // 记录失败
    await logExecution(
      'HDP 课程日历同步',
      '失败',
      '',
      error.message,
      process.env.CRON_TASK_ID || ''
    );
    
    // 执行记录由 sync-records.js 定时同步
    return { successCount: 0, skipCount: 0, failCount: 0, error: error.message };
  } finally {
    await browser.close();
  }
}

// 执行
syncSchedule().catch(console.error);
