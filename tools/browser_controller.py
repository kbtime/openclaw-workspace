#!/usr/bin/env python3
"""
Browser Controller for OpenClaw AI Agent
VPS 有头浏览器控制模块

在 Xvfb :99 虚拟显示器上运行真实 Chromium
"""

import os
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# 默认配置
DEFAULT_DISPLAY = ":99"
DEFAULT_VIEWPORT = {"width": 1280, "height": 1024}

class BrowserController:
    """VPS 有头浏览器控制器"""
    
    def __init__(self):
        self.display = os.environ.get("DISPLAY", DEFAULT_DISPLAY)
        self.browser = None
        self.page = None
        
    def setup_environment(self):
        """设置环境变量"""
        os.environ["DISPLAY"] = self.display
        os.environ["PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD"] = "1"
        print(f"📺 虚拟显示器: {self.display}")
        
    async def start(self, headless: bool = False):
        """启动浏览器"""
        from playwright.async_api import async_playwright
        
        self.setup_environment()
        
        print("🚀 正在启动 Chromium...")
        self.playwright = await async_playwright().start()
        
        self.browser = await self.playwright.chromium.launch(
            headless=headless,  # False = 有头模式，使用 Xvfb
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                f"--window-size={DEFAULT_VIEWPORT['width']},{DEFAULT_VIEWPORT['height']}"
            ]
        )
        
        context = await self.browser.new_context(
            viewport=DEFAULT_VIEWPORT,
            screen=DEFAULT_VIEWPORT
        )
        
        self.page = await context.new_page()
        print(f"✅ 浏览器已启动")
        return self.page
    
    async def navigate(self, url: str, timeout: int = 60000):
        """导航到页面"""
        if not self.page:
            raise RuntimeError("浏览器未启动，请先调用 start()")
        
        print(f"🌐 导航到: {url}")
        await self.page.goto(url, wait_until="networkidle", timeout=timeout)
        print("✅ 页面加载完成")
        return self.page
    
    async def screenshot(self, path: Optional[str] = None, full_page: bool = True) -> str:
        """截图"""
        if not self.page:
            raise RuntimeError("浏览器未启动")
        
        if path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            path = f"/tmp/screenshot_{timestamp}.png"
        
        print(f"📸 截图保存到: {path}")
        await self.page.screenshot(path=path, full_page=full_page)
        return path
    
    async def click(self, selector: str, timeout: int = 10000):
        """点击元素"""
        if not self.page:
            raise RuntimeError("浏览器未启动")
        
        print(f"🖱️ 点击: {selector}")
        await self.page.click(selector, timeout=timeout)
        print("✅ 点击完成")
    
    async def fill(self, selector: str, text: str):
        """填写表单"""
        if not self.page:
            raise RuntimeError("浏览器未启动")
        
        print(f"⌨️ 输入 '{text}' 到: {selector}")
        await self.page.fill(selector, text)
        print("✅ 输入完成")
    
    async def get_content(self) -> str:
        """获取页面内容"""
        if not self.page:
            raise RuntimeError("浏览器未启动")
        return await self.page.content()
    
    async def evaluate(self, script: str):
        """执行 JavaScript"""
        if not self.page:
            raise RuntimeError("浏览器未启动")
        return await self.page.evaluate(script)
    
    async def close(self):
        """关闭浏览器"""
        if self.browser:
            print("🛑 正在关闭浏览器...")
            await self.browser.close()
            print("✅ 浏览器已关闭")
        if hasattr(self, 'playwright'):
            await self.playwright.stop()


# 便捷函数
def ensure_xvfb_running():
    """检查 Xvfb 是否在运行"""
    result = subprocess.run(
        ["pgrep", "-x", "Xvfb"],
        capture_output=True
    )
    if result.returncode != 0:
        print("⚠️ Xvfb 未运行，正在启动...")
        subprocess.run(["systemctl", "start", "xvfb"])
        import time
        time.sleep(2)
    else:
        print(f"✅ Xvfb 正在运行 (PID: {result.stdout.decode().strip()})")


# 使用示例
async def demo():
    """演示用法"""
    ensure_xvfb_running()
    
    controller = BrowserController()
    await controller.start(headless=False)  # 有头模式
    
    # 导航到示例页面
    await controller.navigate("https://example.com")
    
    # 截图
    await controller.screenshot("/tmp/demo.png")
    
    # 关闭
    await controller.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(demo())
