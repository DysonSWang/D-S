/**
 * 移动端 E2E 测试 - 认证流程
 * 测试设备：Pixel 5, iPhone 12, iPad Pro
 */

import { test, expect } from '@playwright/test';

test.describe('移动端认证流程', () => {
  test('应该成功打开登录页面', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/星契|伙伴任务/);
    
    // 检查登录表单存在
    await expect(page.locator('input[type="email"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('应该显示表单验证错误', async ({ page }) => {
    await page.goto('/');
    
    // 尝试提交空表单
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // 应该显示验证错误
    await expect(page.locator('input[required]:invalid')).toBeVisible();
  });

  test('应该成功登录', async ({ page }) => {
    await page.goto('/');
    
    // 填写登录表单
    await page.fill('input[name="username"]', 'guide');
    await page.fill('input[type="password"]', 'guide123');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待导航
    await page.waitForURL(/\/guide/);
    
    // 检查是否成功跳转到仪表盘
    await expect(page).toHaveURL(/\/guide/);
  });

  test('应该显示登录错误提示', async ({ page }) => {
    await page.goto('/');
    
    // 填写错误的密码
    await page.fill('input[name="username"]', 'guide');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 应该显示错误提示
    await expect(page.locator('text=密码错误,text=用户不存在,text=错误')).toBeVisible({ timeout: 5000 });
  });

  test('应该支持退出登录', async ({ page }) => {
    // 先登录
    await page.goto('/');
    await page.fill('input[name="username"]', 'guide');
    await page.fill('input[type="password"]', 'guide123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guide/);
    
    // 找到退出按钮并点击
    const logoutButton = page.locator('button:has-text("退出"), button:has-text("登出"), [data-testid="logout"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // 应该返回登录页
      await expect(page).toHaveURL(/\/login|^\//);
    }
  });
});
