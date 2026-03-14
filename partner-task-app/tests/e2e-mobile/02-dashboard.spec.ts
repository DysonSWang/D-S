/**
 * 移动端 E2E 测试 - 仪表盘页面
 * 测试设备：Pixel 5, iPhone 12, iPad Pro
 */

import { test, expect } from '@playwright/test';

test.describe('移动端仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/');
    await page.fill('input[name="username"]', 'guide');
    await page.fill('input[type="password"]', 'guide123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guide/);
  });

  test('应该加载引导者仪表盘', async ({ page }) => {
    // 检查仪表盘标题
    await expect(page.locator('h1:has-text("仪表盘"), h1:has-text("Dashboard")')).toBeVisible();
    
    // 检查统计数据卡片
    await expect(page.locator('[data-testid="stat-card"], .stat-card, text=伙伴,text=任务')).toBeVisible();
  });

  test('应该显示导航菜单', async ({ page }) => {
    // 检查导航栏
    await expect(page.locator('nav, [data-testid="nav"]')).toBeVisible();
    
    // 检查导航项
    await expect(page.locator('a:has-text("伙伴"), a:has-text("任务"), a:has-text("审核")')).toBeVisible();
  });

  test('应该响应式布局', async ({ page }) => {
    // 检查页面宽度适配
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    
    // 检查内容不溢出
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = viewport!.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth!);
  });

  test('应该支持触摸操作', async ({ page }) => {
    // 测试点击导航项
    const navItems = page.locator('nav a, [data-testid="nav"] a');
    const count = await navItems.count();
    
    if (count > 0) {
      await navItems.first().click();
      await page.waitForTimeout(500);
      
      // 检查页面有变化
      const url = page.url();
      expect(url).not.toMatch(/\/guide\/?$/);
    }
  });

  test('应该显示用户信息', async ({ page }) => {
    // 检查用户头像或用户名显示
    await expect(page.locator('[data-testid="user-avatar"], [data-testid="username"], .user-info')).toBeVisible();
  });
});
