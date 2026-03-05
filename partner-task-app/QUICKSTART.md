# 伙伴任务打卡系统 - 快速开始指南

## 🚀 快速启动

### 1. 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd ../client
npm install
```

### 2. 初始化数据库

```bash
cd server
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

这将创建：
- SQLite 数据库
- 测试账号（见下方）

### 3. 启动后端

```bash
cd server
npm run dev
```

后端将在 http://localhost:3001 启动

### 4. 启动前端（新终端）

```bash
cd client
npm run dev
```

前端将在 http://localhost:5173 启动

---

## 👤 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 引导者 | guide | guide123 |
| 成长者 | grower | grower123 |

---

## 📡 API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 关系
- `POST /api/relationships/invite` - 发送邀请
- `GET /api/relationships/my` - 我的关系

### 任务
- `POST /api/tasks` - 创建任务
- `GET /api/tasks/my` - 我的任务
- `POST /api/tasks/:id/submit` - 提交打卡
- `POST /api/tasks/:id/approve` - 审核通过

### 奖励
- `GET /api/rewards/my` - 我的奖励
- `POST /api/rewards/redeem` - 兑换道具

### 小屋
- `GET /api/cottage/my` - 我的小屋
- `POST /api/cottage/decorate` - 装备装饰

---

## 🧪 测试流程

### 引导者流程
1. 登录 guide 账号
2. 访问 /guide/partners 查看伙伴
3. 访问 /guide/tasks 发布新任务
4. 访问 /guide/checkins 审核打卡

### 成长者流程
1. 登录 grower 账号
2. 访问 /grower/dashboard 查看仪表盘
3. 访问 /grower/tasks 开始任务并提交打卡
4. 访问 /grower/shop 购买装饰
5. 访问 /grower/cottage 装扮小屋

---

## 🛠️ 故障排查

### 后端启动失败
```bash
# 检查端口占用
lsof -i :3001

# 重新安装依赖
cd server
rm -rf node_modules package-lock.json
npm install
```

### 前端启动失败
```bash
# 重新安装依赖
cd client
rm -rf node_modules package-lock.json
npm install
```

### 数据库错误
```bash
# 重置数据库
cd server
rm prisma/dev.db
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 📦 生产部署

### Docker 部署（待实现）

```bash
docker-compose up -d
```

### 环境变量

创建 `.env` 文件：

```env
# 后端
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-secret
DATABASE_URL="file:./prisma/prod.db"

# 前端
VITE_API_URL=https://api.yourdomain.com
```

---

## 📞 支持

如有问题，请查看：
- [README.md](README.md) - 项目说明
- [DEV_PLAN.md](DEV_PLAN.md) - 开发计划
- [PROGRESS.md](PROGRESS.md) - 开发进度
