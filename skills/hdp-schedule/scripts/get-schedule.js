/**
 * HDP 系统课程行程查询脚本
 * 使用 Playwright 自动登录并获取行程数据
 */

const { chromium } = require('/tmp/node_modules/playwright');

// 配置
const CONFIG = {
  loginUrl: 'https://hdp.huashijingji.com/#/user/login',
  username: '廖宏',
  password: '888999',
  tripApi: 'https://hdp.huashijingji.com/admin/trip.index/index'
};

async function getSchedule() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 存储行程数据
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
    // 1. 访问登录页面
    console.log('正在访问登录页面...');
    await page.goto(CONFIG.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2. 登录
    console.log('正在登录...');
    await page.fill('input[name="username"]', CONFIG.username);
    await page.fill('input[name="password"]', CONFIG.password);
    await page.press('input[name="password"]', 'Enter');
    await page.waitForTimeout(5000);

    // 3. 点击首页
    console.log('导航到首页...');
    try {
      await page.click('text=首页');
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('首页点击跳过');
    }

    // 4. 点击查行程
    console.log('查询行程...');
    try {
      await page.click('text=查行程');
      await page.waitForTimeout(8000);
    } catch (e) {
      console.log('查行程点击跳过');
    }

    // 5. 输出结果
    if (scheduleData) {
      console.log('\n=== 行程查询结果 ===\n');
      
      if (scheduleData.code === 0 && scheduleData.data) {
        const schedules = scheduleData.data;
        
        if (Array.isArray(schedules) && schedules.length > 0) {
          schedules.forEach((item, index) => {
            console.log(`\n--- 行程 ${index + 1} ---`);
            if (item.info) {
              // 解析 HTML 格式的信息
              const info = item.info
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/&nbsp;/g, ' ')
                .replace(/<[^>]+>/g, '');
              console.log(info);
            }
          });
        } else {
          console.log('当前月份暂无行程安排');
        }
      } else {
        console.log('获取数据失败:', JSON.stringify(scheduleData));
      }
    } else {
      console.log('未能获取行程数据');
    }

  } catch (error) {
    console.error('执行出错:', error.message);
  } finally {
    await browser.close();
  }
}

// 执行
getSchedule().catch(console.error);
