/**
 * 移动端 E2E 测试 - 小屋装扮功能
 * 测试设备：Pixel 5, iPhone 12, iPad Pro
 */

import { test, expect } from '@playwright/test';

test.describe('移动端小屋功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.fill('input[name="username"]', 'grower');
    await page.fill('input[type="password"]', 'grower123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grower/);
  });

  test('应该能查看小屋页面', async ({ page }) => {
    // 导航到小屋页面
    await page.click('a:has-text("小屋"), [data-testid="nav-cottage"]');
    await page.waitForTimeout(1000);
    
    // 检查小屋视图存在
    await expect(page.locator('[data-testid="cottage-view"], .cottage-view, [data-testid="cottage"]')).toBeVisible();
  });

  test('小屋应该显示温暖度', async ({ page }) => {
    // 导航到小屋页面
    await page.click('a:has-text("小屋"), [data-testid="nav-cottage"]');
    await page.waitForTimeout(1000);
    
    // 检查温暖度显示
    await expect(page.locator('text=温暖度, [data-testid="warmth"], .warmth-score')).toBeVisible();
  });

  test('应该能查看装饰列表', async ({ page }) => {
    // 导航到小屋页面
    await page.click('a:has-text("小屋"), [data-testid="nav-cottage"]');
    await page.waitForTimeout(1000);
    
    // 点击装饰按钮
    const decorateButton = page.locator('button:has-text("装饰"), button:has-text("装扮"), [data-testid="decorate"]');
    if (await decorateButton.isVisible()) {
      await decorateButton.click();
      await page.waitForTimeout(500);
      
      // 检查装饰列表显示
      await expect(page.locator('[data-testid="decoration-list"], .decoration-list')).toBeVisible();
    }
  });

  test('装饰应该支持点击选择', async ({ page }) => {
    // 导航到小屋页面
    await page.click('a:has-text("小屋"), [data-testid="nav-cottage"]');
    await page.waitForTimeout(1000);
    
    // 点击装饰按钮
    const decorateButton = page.locator('button:has-text("装饰"), button:has-text("装扮"), [data-testid="decorate"]');
    if (await decorateButton.isVisible()) {
      await decorateButton.click();
      await page.waitForTimeout(500);
      
      // 点击第一个装饰品
      const decorations = page.locator('[data-testid="decoration-item"], .decoration-item');
      const count = await decorations.count();
      
      if (count > 0) {
        await decorations.first().click();
        await page.waitForTimeout(500);
        
        // 检查选择状态
        const selectedDecoration = page.locator('[data-testid="decoration-item"].selected, .decoration-item.selected');
        expect(await selectedDecoration.count()).toBeGreaterThan(0);
      }
    }
  });

  test('小屋页面应该适配横屏', async ({ page }) => {
    // 导航到小屋页面
    await page.click('a:has-text("小屋"), [data-testid="nav-cottage"]');
    await page.waitForTimeout(1000);
    
    // 切换到横屏
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    
    // 检查页面正常显示
    await expect(page.locator('[data-testid="cottage-view"], .cottage-view')).toBeVisible();
    
    // 检查内容不溢出
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 844;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
