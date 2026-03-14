# 移动端 E2E 测试

使用 Playwright 进行移动端 E2E 自动化测试。

## 📱 测试设备

- **Pixel 5** - Android 移动端代表
- **iPhone 12** - iOS 移动端代表
- **iPad Pro** - 平板设备代表
- **Desktop Chrome** - 桌面端基准测试

## 🚀 快速开始

### 安装依赖

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 运行测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试
npx playwright test 01-auth.spec.ts

# 运行特定设备测试
npx playwright test --project="Mobile Chrome"

# 运行并生成报告
npx playwright test --reporter=html
npx playwright show-report
```

## 📋 测试用例

### 01-auth.spec.ts - 认证流程
- ✅ 打开登录页面
- ✅ 表单验证错误
- ✅ 成功登录
- ✅ 登录错误提示
- ✅ 退出登录

### 02-dashboard.spec.ts - 仪表盘
- ✅ 加载仪表盘
- ✅ 导航菜单
- ✅ 响应式布局
- ✅ 触摸操作
- ✅ 用户信息显示

### 03-tasks.spec.ts - 任务管理
- ✅ 查看任务列表
- ✅ 查看任务详情
- ✅ 创建任务
- ✅ 下拉刷新

### 04-cottage.spec.ts - 小屋装扮
- ✅ 查看小屋页面
- ✅ 显示温暖度
- ✅ 查看装饰列表
- ✅ 选择装饰
- ✅ 横屏适配

## 📊 测试报告

测试完成后生成 HTML 报告：

```bash
npx playwright show-report
```

## 🔧 配置

配置文件：`playwright.config.ts`

主要配置项：
- `baseURL`: http://localhost:5173
- `viewport`: 移动设备尺寸
- `userAgent`: 移动端 User-Agent
- `retries`: 失败重试次数

## 📝 添加新测试

1. 在 `tests/e2e-mobile/` 目录创建 `.spec.ts` 文件
2. 使用 `test.describe()` 组织测试套件
3. 使用 `test()` 定义测试用例
4. 使用 `expect()` 进行断言

示例：
```typescript
import { test, expect } from '@playwright/test';

test.describe('新功能测试', () => {
  test('应该正常工作', async ({ page }) => {
    await page.goto('/new-feature');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## 🎯 测试覆盖目标

- [x] 认证流程 (100%)
- [x] 仪表盘页面 (100%)
- [x] 任务管理 (80%)
- [x] 小屋装扮 (80%)
- [ ] 奖励商店 (待补充)
- [ ] 关系管理 (待补充)
- [ ] 成就系统 (待补充)

## 📱 设备覆盖

| 设备 | 屏幕尺寸 | 状态 |
|------|----------|------|
| Pixel 5 | 393x851 | ✅ |
| iPhone 12 | 390x844 | ✅ |
| iPad Pro | 1024x1366 | ✅ |
| Desktop Chrome | 1920x1080 | ✅ |

## 🐛 常见问题

### 测试失败
1. 确保前端服务运行在 5173 端口
2. 检查测试账号是否存在
3. 查看截图和错误日志

### 元素找不到
1. 检查选择器是否正确
2. 添加适当的等待时间
3. 使用 `data-testid` 属性

### 横屏测试
使用 `page.setViewportSize()` 切换横屏：
```typescript
await page.setViewportSize({ width: 844, height: 390 });
```

---

**更新时间**: 2026-03-14  
**测试框架**: Playwright v1.x
