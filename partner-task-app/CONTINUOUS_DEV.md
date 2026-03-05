# 7×24 小时自动开发设置指南

## 问题

OpenClaw cron 工具认证失败（device token mismatch），无法直接创建定时任务。

## 解决方案

### 方案 A：使用系统 cron（推荐）

```bash
# 1. 编辑 crontab
crontab -e

# 2. 添加以下任务（每 15 分钟执行）
*/15 * * * * /root/.openclaw/workspace/partner-task-app/auto-dev.sh >> /root/.openclaw/workspace/partner-task-app/dev-cron.log 2>&1

# 3. 验证
crontab -l
```

### 方案 B：手动触发开发

由于 cron 工具不可用，你可以：

1. **直接告诉我继续开发**
   - 说"继续开发关系 API"
   - 说"检查进度并继续"
   - 说"运行自动开发任务"

2. **我会执行以下流程**：
   - 检查当前文件状态
   - 开发下一个模块
   - 测试代码
   - git 提交推送
   - 更新进度文档

### 方案 C：使用 sessions_spawn（如果可用）

```
创建子代理会话，持续开发直到 MVP 完成
```

---

## 当前开发状态

**进度**: 20%
**下一步**: 开发关系 API (routes/relationship.ts)

**待开发模块**：
1. ⏳ 关系 API
2. ❌ 任务 API
3. ❌ 奖励 API
4. ❌ 小屋 API
5. ❌ 前端页面

---

## 快速继续命令

对我说以下任一命令即可继续开发：

- "继续开发"
- "开发关系 API"
- "检查进度并继续"
- "运行自动开发"
- "推进项目到下一阶段"

---

## Git 仓库

- **Remote**: https://github.com/DysonSWang/D-S.git
- **Branch**: master
- **Latest**: 35542d21 - Update .gitignore

每次开发完成后会自动提交推送。
