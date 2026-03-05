# 伙伴任务打卡系统 - 7×24 小时自动开发指令

## 🎯 任务目标

**完成伙伴任务打卡系统 MVP，直到 e2e 测试通过，可运行**

技术栈：React + Node.js + TypeScript + Prisma + SQLite

---

## 📋 开发清单

### Phase 1: 后端核心 API (优先级 P0)
- [ ] 用户 API (已完成 auth 注册/登录)
- [ ] 关系 API - 邀请/接受/解除/冷静期
- [ ] 任务 API - CRUD/打卡/审核
- [ ] 奖励 API - 资产/流水/兑换
- [ ] 小屋 API - 装饰/装扮/温暖度
- [ ] 成就 API - 解锁/展示
- [ ] 消息 API - 通知/私信
- [ ] 敏感词管理 API - CRUD

### Phase 2: 前端页面 (优先级 P0)
- [ ] 登录/注册页
- [ ] 引导者仪表盘
- [ ] 成长者仪表盘
- [ ] 任务管理页
- [ ] 小屋装扮页
- [ ] 奖励商店页
- [ ] 个人中心

### Phase 3: 集成测试 (优先级 P1)
- [ ] 安装所有依赖
- [ ] 数据库初始化
- [ ] 后端启动测试
- [ ] 前端启动测试
- [ ] API 联调测试
- [ ] e2e 测试

### Phase 4: 部署准备 (优先级 P2)
- [ ] Docker 配置
- [ ] 生产环境配置
- [ ] OSS 上传配置
- [ ] 文档完善

---

## 🔄 执行流程

每次被唤醒时：

1. **检查进度** - 查看哪些 API/页面已完成
2. **继续开发** - 按优先级完成下一个模块
3. **提交代码** - git add/commit/push 到 GitHub
4. **测试验证** - 确保新代码可运行
5. **更新进度** - 在本文件中标记完成项
6. **报告状态** - 输出当前完成百分比

---

## 📊 进度追踪

```bash
# 检查后端文件
ls -la /root/.openclaw/workspace/partner-task-app/server/src/routes/
ls -la /root/.openclaw/workspace/partner-task-app/server/src/handlers/

# 检查前端文件
ls -la /root/.openclaw/workspace/partner-task-app/client/src/pages/
ls -la /root/.openclaw/workspace/partner-task-app/client/src/layouts/

# 检查 Git 状态
cd /root/.openclaw/workspace/partner-task-app && git status
```

---

## ⚠️ 注意事项

1. **代码质量** - TypeScript 严格模式，不跳过类型检查
2. **提交频率** - 每完成一个功能点就提交
3. **测试先行** - 关键功能先写简单测试
4. **合规第一** - 敏感词过滤必须实现
5. **错误处理** - 所有 API 都要有错误处理

---

## 🚀 开始命令

```bash
# 安装后端依赖
cd /root/.openclaw/workspace/partner-task-app/server
npm install

# 安装前端依赖
cd /root/.openclaw/workspace/partner-task-app/client
npm install

# 初始化数据库
cd /root/.openclaw/workspace/partner-task-app/server
npx prisma generate
npx prisma db push

# 启动后端
npm run dev

# 启动前端 (新终端)
cd ../client
npm run dev
```

---

**当前状态**: 框架已搭建，开始开发核心 API
**目标**: MVP 可运行版本
**预计工时**: 6-9 天 (7×24 小时自动开发)
