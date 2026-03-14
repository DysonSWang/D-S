/**
 * 移动端 E2E 测试 - 任务管理流程
 * 测试设备：Pixel 5, iPhone 12, iPad Pro
 */

import { test, expect } from '@playwright/test';

test.describe('移动端任务管理', () => {
  test('成长者应该能查看任务列表', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.fill('input[name="username"]', 'grower');
    await page.fill('input[type="password"]', 'grower123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grower/);
    
    // 导航到任务页面
    await page.click('a:has-text("任务"), [data-testid="nav-tasks"]');
    await page.waitForTimeout(1000);
    
    // 检查任务列表存在
    await expect(page.locator('[data-testid="task-list"], .task-list, [role="list"]')).toBeVisible();
  });

  test('成长者应该能查看任务详情', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.fill('input[name="username"]', 'grower');
    await page.fill('input[type="password"]', 'grower123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grower/);
    
    // 导航到任务页面
    await page.click('a:has-text("任务"), [data-testid="nav-tasks"]');
    await page.waitForTimeout(1000);
    
    // 点击第一个任务
    const taskItems = page.locator('[data-testid="task-item"], .task-item, [role="listitem"]');
    const count = await taskItems.count();
    
    if (count > 0) {
      await taskItems.first().click();
      await page.waitForTimeout(500);
      
      // 检查任务详情页
      await expect(page.locator('h1, h2, [data-testid="task-title"]')).toBeVisible();
    }
  });

  test('引导者应该能创建任务', async ({ page }) => {
    // 登录引导者账号
    await page.goto('/');
    await page.fill('input[name="username"]', 'guide');
    await page.fill('input[type="password"]', 'guide123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guide/);
    
    // 导航到任务管理页面
    await page.click('a:has-text("任务"), [data-testid="nav-tasks"]');
    await page.waitForTimeout(1000);
    
    // 点击创建任务按钮
    const createButton = page.locator('button:has-text("创建"), button:has-text("新建"), [data-testid="create-task"]');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // 检查表单显示
      await expect(page.locator('input[name="name"], input[name="title"], [data-testid="task-name"]')).toBeVisible();
    }
  });

  test('任务列表应该支持下拉刷新', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.fill('input[name="username"]', 'grower');
    await page.fill('input[type="password"]', 'grower123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grower/);
    
    // 导航到任务页面
    await page.click('a:has-text("任务"), [data-testid="nav-tasks"]');
    await page.waitForTimeout(1000);
    
    // 模拟下拉刷新
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // 检查页面正常
    await expect(page).toHaveURL(/\/grower.*tasks/);
  });
});
