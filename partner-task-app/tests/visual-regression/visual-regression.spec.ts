/**
 * 视觉回归测试 - 组件截图对比
 * 使用 Playwright 进行视觉回归测试
 */

import { test, expect } from '@playwright/test';

test.describe('视觉回归测试 - 组件', () => {
  test('Login 页面视觉测试', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // 截图并与基准对比
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Dashboard 页面视觉测试', async ({ page }) => {
    // 登录
    await page.goto('/');
    await page.fill('input[placeholder="用户名"]', 'guide');
    await page.fill('input[placeholder="密码"]', 'guide123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/guide\/dashboard/);
    await page.waitForTimeout(3000);
    
    // 截图对比
    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: false,
      maxDiffPixels: 200,
    });
  });

  test('TaskCard 组件视觉测试', async ({ page }) => {
    await page.goto('/guide/dashboard');
    await page.waitForTimeout(3000);
    
    // 截图任务卡片区域
    const taskCard = page.locator('.ant-card').first();
    await expect(taskCard).toHaveScreenshot('task-card.png', {
      maxDiffPixels: 50,
    });
  });

  test('Cottage 页面视觉测试', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.fill('input[placeholder="用户名"]', 'grower');
    await page.fill('input[placeholder="密码"]', 'grower123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/grower\/dashboard/);
    
    // 导航到小屋页面
    const cottageLink = page.locator('a:has-text("小屋")').first();
    if (await cottageLink.count() > 0) {
      await cottageLink.click();
      await page.waitForTimeout(3000);
      
      // 截图对比
      await expect(page).toHaveScreenshot('cottage-page.png', {
        fullPage: false,
        maxDiffPixels: 200,
      });
    }
  });

  test('响应式布局视觉测试 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test('响应式布局视觉测试 - 平板', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('login-tablet.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test('响应式布局视觉测试 - 桌面', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});
