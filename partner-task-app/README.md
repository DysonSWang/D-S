# 伙伴任务打卡系统

> 亲密关系成长工具 - 帮助伴侣建立更有仪式感的互动关系

**技术栈**: React 18 + Node.js + TypeScript + Prisma + SQLite

**GitHub**: https://github.com/DysonSWang/D-S.git

---

## 🚀 快速开始

### 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd ../client
npm install
```

### 初始化数据库

```bash
cd server
npx prisma generate
npx prisma db push
```

### 启动开发服务器

```bash
# 终端 1 - 后端 (端口 3001)
cd server
npm run dev

# 终端 2 - 前端 (端口 5173)
cd client
npm run dev
```

访问 http://localhost:5173

---

## 📁 项目结构

```
partner-task-app/
├── server/                 # Node.js 后端
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件 (auth/敏感词过滤)
│   │   └── index.ts       # 入口
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模型
│   └── package.json
│
├── client/                # React 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── layouts/      # 布局组件
│   │   ├── store/        # 状态管理
│   │   └── App.tsx       # 根组件
│   └── package.json
│
├── docs/                  # 文档
│   ├── PRD.md            # 产品需求文档
│   ├── 功能导图.md         # 功能架构
│   └── 专家评审意见.md      # 合规建议
│
├── DEV_PLAN.md           # 开发计划
├── PROGRESS.md           # 进度追踪
└── auto-dev.sh          # 自动开发脚本
```

---

## 🎯 功能特性

### 核心功能
- ✅ 用户认证（注册/登录/JWT）
- ✅ 敏感词过滤（合规要求）
- ⏳ 伙伴关系管理（邀请/缔结/解除）
- ⏳ 任务系统（发布/打卡/审核）
- ⏳ 奖励系统（虚拟资产/兑换）
- ⏳ 小屋装扮（装饰/温暖度）
- ⏳ 成就系统（解锁/展示）

### 关系模式
- **成长伙伴模式** - 平等的成长伙伴（默认）
- **引导成长模式** - 一方引导，一方成长

### 安全机制
- 安全词设置（黄/红）
- 边界设置
- 紧急暂停
- 冷静期（7 天）

---

## 🔄 7×24 小时自动开发

本项目正在由 AI 助手自动开发中：

- **自动提交**: 每 15 分钟检查进度并提交代码
- **持续开发**: 按优先级完成功能模块
- **实时同步**: 代码自动推送到 GitHub

查看进度：`PROGRESS.md`

---

## 📋 开发清单

详见 `DEV_PLAN.md`

---

## ⚠️ 合规说明

根据专家评审意见：
- 对外定位：「亲密关系成长工具」
- 严格内容审核，禁止违规内容
- 年龄验证（18+）
- 用户自主性（可随时退出关系）

---

## 📄 License

MIT
