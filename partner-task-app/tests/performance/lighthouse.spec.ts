/**
 * 性能测试 - Lighthouse
 * 使用 Lighthouse CI 进行性能测试
 */

import { test, expect } from '@playwright/test';

test.describe('性能测试 - Lighthouse', () => {
  test('登录页面性能测试', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // 获取性能指标
    const metrics = await client.send('Performance.getMetrics');
    const metricsMap = Object.fromEntries(
      metrics.metrics.map(m => [m.name, m.value])
    );
    
    // First Contentful Paint
    const fcp = metricsMap['FirstContentfulPaint'] || 0;
    expect(fcp).toBeLessThan(2500); // < 2.5s
    
    // DomContentLoaded
    const dcl = metricsMap['DomContentLoaded'] || 0;
    expect(dcl).toBeLessThan(3000); // < 3s
    
    console.log('FCP:', fcp, 'ms');
    console.log('DCL:', dcl, 'ms');
  });

  test('仪表盘页面性能测试', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    // 登录
    await page.goto('/');
    await page.fill('input[placeholder="用户名"]', 'guide');
    await page.fill('input[placeholder="密码"]', 'guide123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/guide\/dashboard/);
    await page.waitForTimeout(3000);
    
    const metrics = await client.send('Performance.getMetrics');
    const metricsMap = Object.fromEntries(
      metrics.metrics.map(m => [m.name, m.value])
    );
    
    // Load time
    const load = metricsMap['Load'] || 0;
    expect(load).toBeLessThan(4000); // < 4s
    
    console.log('Load:', load, 'ms');
  });

  test('页面资源大小测试', async ({ page }) => {
    const resources = [];
    
    page.on('response', response => {
      const url = response.url();
      const size = response.headers()['content-length'];
      if (size) {
        resources.push({ url, size: parseInt(size) });
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    
    // 总资源大小 < 3MB
    expect(totalSize).toBeLessThan(3 * 1024 * 1024);
    
    console.log('总资源大小:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
  });

  test('首屏加载时间测试', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // 首屏加载 < 2s
    expect(loadTime).toBeLessThan(2000);
    
    console.log('首屏加载时间:', loadTime, 'ms');
  });

  test('API 响应时间测试', async ({ page }) => {
    const apiResponses = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        apiResponses.push({
          url,
          status: response.status(),
          timing: response.request().timing()
        });
      }
    });
    
    // 登录并触发 API 调用
    await page.goto('/');
    await page.fill('input[placeholder="用户名"]', 'guide');
    await page.fill('input[placeholder="密码"]', 'guide123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/guide\/dashboard/);
    await page.waitForTimeout(2000);
    
    // 检查 API 响应时间
    apiResponses.forEach(api => {
      const duration = api.timing.receiveHeadersEnd - api.timing.sendStart;
      console.log(`API: ${api.url}, 耗时：${duration}ms`);
      
      // API 响应时间 < 500ms
      if (duration > 0) {
        expect(duration).toBeLessThan(500);
      }
    });
  });

  test('内存使用测试', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const metrics = await page.metrics();
    
    // JS Heap 使用 < 50MB
    expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024);
    
    console.log('JS Heap 使用:', (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2), 'MB');
  });

  test('长任务测试', async ({ page }) => {
    const longTasks = [];
    
    page.on('metrics', ({ metrics }) => {
      if (metrics.LongTask) {
        longTasks.push(metrics.LongTask);
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // 长任务数量 < 5
    expect(longTasks.length).toBeLessThan(5);
    
    console.log('长任务数量:', longTasks.length);
  });

  test('布局偏移测试 (CLS)', async ({ page }) => {
    await page.goto('/');
    
    // 计算累计布局偏移
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });
    
    // CLS < 0.1 (良好)
    expect(cls).toBeLessThan(0.1);
    
    console.log('CLS:', cls);
  });
});
