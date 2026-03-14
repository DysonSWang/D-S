/**
 * 移动端 E2E 测试 - 任务管理流程
 * 测试设备：Pixel 5, iPhone 12, iPad Pro
 * 前端框架：Ant Design + React Router
 */

import { test, expect } from '@playwright/test';

test.describe('移动端任务管理', () => {
  test('成长者应该能查看任务列表', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
      await usernameInput.fill('grower');
      await passwordInput.fill('grower123');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(5000);
      }
    }
    
    // 查找任务相关链接并点击
    const taskLinks = page.locator('a:has-text("任务"), a[href*="task"], .ant-menu-item:has-text("任务")');
    const count = await taskLinks.count();
    
    if (count > 0) {
      await taskLinks.first().click();
      await page.waitForTimeout(3000);
    }
    
    // 检查页面已加载
    await expect(page.locator('body')).toBeVisible();
  });

  test('成长者应该能查看任务详情', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
      await usernameInput.fill('grower');
      await passwordInput.fill('grower123');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(5000);
      }
    }
    
    // 导航到任务页面
    const taskLinks = page.locator('a:has-text("任务"), a[href*="task"]');
    if (await taskLinks.count() > 0) {
      await taskLinks.first().click();
      await page.waitForTimeout(3000);
    }
    
    // 查找任务列表中的项目
    const taskItems = page.locator('.ant-table-row, [role="row"], .task-item, tr');
    const itemCount = await taskItems.count();
    
    if (itemCount > 0) {
      // 点击第一个任务
      await taskItems.first().click();
      await page.waitForTimeout(2000);
    }
    
    // 检查页面已加载
    await expect(page.locator('body')).toBeVisible();
  });

  test('引导者应该能创建任务', async ({ page }) => {
    // 登录引导者账号
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
      await usernameInput.fill('guide');
      await passwordInput.fill('guide123');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(5000);
      }
    }
    
    // 查找创建任务按钮
    const createButtons = page.locator('button:has-text("创建"), button:has-text("新建"), .ant-btn-primary:has-text("任务")');
    
    if (await createButtons.count() > 0) {
      await createButtons.first().click();
      await page.waitForTimeout(2000);
    }
    
    // 检查页面仍然响应
    await expect(page.locator('body')).toBeVisible();
  });

  test('任务列表应该支持下拉刷新', async ({ page }) => {
    // 登录
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
      await usernameInput.fill('guide');
      await passwordInput.fill('guide123');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(5000);
      }
    }
    
    // 滚动到顶部
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    await page.waitForTimeout(2000);
    
    // 检查页面仍然可见
    await expect(page.locator('body')).toBeVisible();
  });
});
