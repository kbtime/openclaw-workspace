#!/usr/bin/env node
/**
 * Browser Control Interface for OpenClaw AI Agent
 * 浏览器控制接口层 - AI 的"神经纤维"
 * 
 * Usage:
 *   node browser-control.js start           # 启动浏览器
 *   node browser-control.js navigate <url>  # 导航到页面
 *   node browser-control.js screenshot      # 截图
 *   node browser-control.js click <xpath>   # 点击元素
 *   node browser-control.js type <xpath> <text>  # 输入文本
 *   node browser-control.js stop            # 关闭浏览器
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_FILE = '/tmp/browser-control-state.json';
const SCREENSHOT_DIR = '/tmp/browser-screenshots';

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
    } catch (e) {}
    return null;
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function clearState() {
    if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
    }
}

async function startBrowser() {
    console.log('🚀 正在启动浏览器...');
    
    // 检查 DISPLAY 环境变量
    if (!process.env.DISPLAY) {
        process.env.DISPLAY = ':99';
        console.log('   设置 DISPLAY=:99');
    }
    
    const browser = await chromium.launch({
        headless: false,  // 有头模式，使用 Xvfb
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1280,1024'
        ]
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1024 },
        screen: { width: 1280, height: 1024 }
    });
    
    const page = await context.newPage();
    
    // 保存状态
    saveState({
        pid: browser.process().pid,
        wsEndpoint: browser.wsEndpoint(),
        startTime: new Date().toISOString()
    });
    
    console.log(`✅ 浏览器已启动 (PID: ${browser.process().pid})`);
    console.log(`📺 虚拟显示器: ${process.env.DISPLAY}`);
    
    return { browser, page };
}

async function getPage() {
    const state = loadState();
    if (!state || !state.wsEndpoint) {
        console.error('❌ 浏览器未启动，请先运行: start');
        process.exit(1);
    }
    
    const browser = await chromium.connectOverCDP(state.wsEndpoint);
    const contexts = browser.contexts();
    if (contexts.length === 0) {
        console.error('❌ 没有找到浏览器上下文');
        process.exit(1);
    }
    
    const pages = contexts[0].pages();
    if (pages.length === 0) {
        console.error('❌ 没有找到页面');
        process.exit(1);
    }
    
    return { browser, page: pages[0] };
}

async function navigate(url) {
    console.log(`🌐 导航到: ${url}`);
    const { page } = await getPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('✅ 页面加载完成');
}

async function screenshot(name = 'screenshot') {
    console.log('📸 正在截图...');
    const { page } = await getPage();
    const filename = `${name}_${Date.now()}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`✅ 截图已保存: ${filepath}`);
    return filepath;
}

async function click(selector) {
    console.log(`🖱️  点击: ${selector}`);
    const { page } = await getPage();
    await page.click(selector, { timeout: 10000 });
    console.log('✅ 点击完成');
}

async function typeText(selector, text) {
    console.log(`⌨️  输入: ${text} -> ${selector}`);
    const { page } = await getPage();
    await page.fill(selector, text);
    console.log('✅ 输入完成');
}

async function stopBrowser() {
    console.log('🛑 正在关闭浏览器...');
    try {
        const state = loadState();
        if (state && state.pid) {
            try {
                process.kill(state.pid, 'SIGTERM');
            } catch (e) {}
        }
        clearState();
        console.log('✅ 浏览器已关闭');
    } catch (e) {
        console.error('⚠️ 关闭时出错:', e.message);
    }
}

async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            await startBrowser();
            break;
        case 'navigate':
            await navigate(process.argv[3]);
            break;
        case 'screenshot':
            await screenshot(process.argv[3]);
            break;
        case 'click':
            await click(process.argv[3]);
            break;
        case 'type':
            await typeText(process.argv[3], process.argv[4]);
            break;
        case 'stop':
            await stopBrowser();
            break;
        default:
            console.log(`
🤖 Browser Control Interface for OpenClaw AI Agent

Usage:
  node browser-control.js start                    # 启动浏览器
  node browser-control.js navigate <url>           # 导航到页面
  node browser-control.js screenshot [name]        # 截图
  node browser-control.js click <selector>         # 点击元素
  node browser-control.js type <selector> <text>   # 输入文本
  node browser-control.js stop                     # 关闭浏览器

Environment:
  DISPLAY=:99  (Xvfb virtual display)
            `);
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
