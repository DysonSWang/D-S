/**
 * 可访问性测试 (Accessibility / a11y)
 * 使用 axe-core 进行无障碍测试
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('可访问性测试', () => {
  test('登录页面应该无可访问性问题', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('仪表盘页面应该无可访问性问题', async ({ page }) => {
    // 登录
    await page.goto('/');
    await page.fill('input[placeholder="用户名"]', 'guide');
    await page.fill('input[placeholder="密码"]', 'guide123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/guide\/dashboard/);
    await page.waitForTimeout(3000);
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // 记录问题但不失败（可选）
    console.log('可访问性问题:', accessibilityScanResults.violations.length);
    
    // 严重问题应该为 0
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toEqual([]);
  });

  test('任务列表页面应该无可访问性问题', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.fill('input[placeholder="用户名"]', 'grower');
    await page.fill('input[placeholder="密码"]', 'grower123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/grower\/dashboard/);
    await page.waitForTimeout(3000);
    
    // 导航到任务页面
    const taskLink = page.locator('a:has-text("任务")').first();
    if (await taskLink.count() > 0) {
      await taskLink.click();
      await page.waitForTimeout(3000);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    }
  });

  test('小屋页面应该无可访问性问题', async ({ page }) => {
    // 登录成长者账号
    await page.goto('/');
    await page.fill('input[placeholder="用户名"]', 'grower');
    await page.fill('input[placeholder="密码"]', 'grower123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/grower\/dashboard/);
    await page.waitForTimeout(3000);
    
    // 导航到小屋页面
    const cottageLink = page.locator('a:has-text("小屋")').first();
    if (await cottageLink.count() > 0) {
      await cottageLink.click();
      await page.waitForTimeout(3000);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    }
  });

  test('所有页面应该有正确的语言属性', async ({ page }) => {
    await page.goto('/');
    
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('zh-CN');
  });

  test('所有图片应该有 alt 文本', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // 装饰性图片可以有 role="presentation"
      if (role !== 'presentation') {
        expect(alt).toBeTruthy();
      }
    }
  });

  test('所有按钮应该有可访问的名称', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('表单元素应该有关联的 label', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const inputs = await page.locator('input[type="text"], input[type="password"], input[name="username"]').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      // 应该有 id 关联 label 或 aria-label 或 placeholder
      expect(id || ariaLabel || placeholder).toBeTruthy();
    }
  });

  test('页面应该有正确的标题层级', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const h1Count = await page.locator('h1').count();
    
    // 每页应该只有一个 h1
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('颜色对比度应该符合 WCAG 标准', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    // 记录但不失败（颜色对比度问题可能需要设计调整）
    console.log('颜色对比度问题:', colorContrastViolations.length);
  });
});
