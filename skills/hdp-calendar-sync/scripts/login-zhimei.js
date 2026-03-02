const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('1. 导航到登录页面...');
  await page.goto('https://s.zhimeizhushou.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('页面:', await page.title());
  
  // 输入用户名
  console.log('2. 输入用户名...');
  const usernameInput = await page.$('input[placeholder="请输入您的用户名"]');
  if (usernameInput) {
    await usernameInput.fill('lanstechdemo@ydt');
    console.log('   已输入: lanstechdemo@ydt');
  }
  
  // 输入密码
  console.log('3. 输入密码...');
  const passwordInput = await page.$('input[placeholder="请输入您的密码"]');
  if (passwordInput) {
    await passwordInput.fill('yidiantong');
    console.log('   已输入密码');
  }
  
  // 点击登录按钮
  console.log('4. 点击登录...');
  const loginButton = await page.$('button:has-text("登录")');
  if (loginButton) {
    await loginButton.click();
    console.log('   已点击登录按钮');
  }
  
  // 等待登录结果
  console.log('5. 等待登录结果...');
  await page.waitForTimeout(5000);
  
  // 检查是否登录成功
  const currentUrl = page.url();
  console.log('当前URL:', currentUrl);
  
  // 截图
  await page.screenshot({ path: '/tmp/zhimei-after-login.png', fullPage: true });
  console.log('截图已保存到 /tmp/zhimei-after-login.png');
  
  // 保存 cookies
  const cookies = await context.cookies();
  console.log('\n获取到 Cookies:');
  cookies.forEach(c => {
    console.log(`  ${c.name}: ${c.value.substring(0, 30)}...`);
  });
  
  // 保存 cookies 到文件
  const fs = require('fs');
  fs.writeFileSync('/tmp/zhimei-cookies.json', JSON.stringify(cookies, null, 2));
  console.log('\nCookies 已保存到 /tmp/zhimei-cookies.json');
  
  await browser.close();
}

main().catch(console.error);
