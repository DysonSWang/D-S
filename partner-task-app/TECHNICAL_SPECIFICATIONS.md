# 星契 Starpact - 技术规范与编码标准

**版本**: 1.0.0  
**生效日期**: 2026-03-08  
**适用范围**: 所有参与星契项目开发的工程师

---

## 📋 目录

1. [技术栈规范](#1-技术栈规范)
2. [项目结构规范](#2-项目结构规范)
3. [编码规范](#3-编码规范)
4. [API 设计规范](#4-api-设计规范)
5. [数据库规范](#5-数据库规范)
6. [安全规范](#6-安全规范)
7. [测试规范](#7-测试规范)
8. [文档规范](#8-文档规范)
9. [Git 工作流](#9-git-工作流)
10. [代码审查清单](#10-代码审查清单)

---

## 1. 技术栈规范

### 1.1 后端技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | 18.x LTS | 长期支持版本 |
| 语言 | TypeScript | 5.x | 严格模式 |
| Web 框架 | Express | 4.x | 轻量级框架 |
| ORM | Prisma | 5.x | 类型安全数据库访问 |
| 数据库 | SQLite | 3.x | 开发环境 |
| 数据库 | PostgreSQL | 15.x | 生产环境（规划） |
| 缓存 | Redis | 7.x | 会话/缓存（规划） |
| 认证 | JWT | - | JSON Web Token |
| 密码 | bcryptjs | 2.x | 密码哈希 |

### 1.2 前端技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | React | 18.x | UI 框架 |
| 语言 | TypeScript | 5.x | 严格模式 |
| 构建工具 | Vite | 5.x | 快速构建 |
| UI 库 | Ant Design | 5.x | 组件库 |
| 状态管理 | Zustand | 4.x | 轻量级状态管理 |
| 路由 | React Router | 6.x | 客户端路由 |
| HTTP 客户端 | Axios | 1.x | API 请求 |
| 日期处理 | Day.js | 1.x | 日期格式化 |

### 1.3 开发工具

| 用途 | 工具 | 版本 | 说明 |
|------|------|------|------|
| 包管理 | npm | 9.x | 依赖管理 |
| 代码规范 | ESLint | 8.x | 代码检查 |
| 格式化 | Prettier | 3.x | 代码格式化 |
| 测试 | Jest | 29.x | 单元测试 |
| API 测试 | Supertest | 6.x | API 测试 |
| E2E 测试 | Playwright | 1.x | 端到端测试 |

---

## 2. 项目结构规范

### 2.1 后端目录结构

```
server/
├── src/
│   ├── index.ts              # 应用入口
│   ├── routes/               # API 路由层
│   │   ├── auth.ts           # 认证相关
│   │   ├── user.ts           # 用户相关
│   │   ├── task.ts           # 任务相关
│   │   └── ...
│   ├── services/             # 业务逻辑层
│   │   ├── authService.ts
│   │   ├── taskService.ts
│   │   └── ...
│   ├── middleware/           # 中间件
│   │   ├── auth.ts           # 认证中间件
│   │   ├── errorHandler.ts   # 错误处理
│   │   ├── rateLimiter.ts    # 限流中间件
│   │   └── validator.ts      # 请求验证
│   ├── lib/                  # 工具库
│   │   ├── prisma.ts         # 数据库连接单例
│   │   ├── logger.ts         # 日志配置
│   │   └── validator.ts      # 验证器配置
│   ├── schemas/              # Zod Schema
│   │   ├── auth.ts
│   │   ├── task.ts
│   │   └── ...
│   ├── types/                # 类型定义
│   │   ├── express.d.ts      # Express 类型扩展
│   │   └── index.ts
│   └── utils/                # 工具函数
│       ├── encrypt.ts
│       └── ...
├── prisma/
│   ├── schema.prisma         # 数据模型
│   ├── migrations/           # 数据库迁移
│   └── seed.ts               # 种子数据
├── tests/                    # 测试文件
│   ├── unit/
│   └── integration/
├── .env.example              # 环境变量示例
├── .env                      # 环境变量（不提交）
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2 前端目录结构

```
client/
├── src/
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 根组件
│   ├── api/                  # API 层
│   │   ├── request.ts        # Axios 配置
│   │   ├── auth.ts           # 认证 API
│   │   ├── task.ts           # 任务 API
│   │   └── ...
│   ├── components/           # 组件
│   │   ├── ui/               # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── business/         # 业务组件
│   │   │   ├── TaskCard.tsx
│   │   │   ├── RewardDisplay.tsx
│   │   │   └── ...
│   │   └── index.ts          # 统一导出
│   ├── pages/                # 页面组件
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── guide/
│   │   ├── grower/
│   │   └── admin/
│   ├── layouts/              # 布局组件
│   │   ├── AuthLayout.tsx
│   │   ├── GuideLayout.tsx
│   │   └── ...
│   ├── store/                # 状态管理
│   │   ├── authStore.ts
│   │   └── ...
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   └── ...
│   ├── utils/                # 工具函数
│   │   ├── responsive.ts
│   │   └── ...
│   ├── styles/               # 全局样式
│   │   ├── variables.css     # CSS 变量
│   │   └── global.css
│   ├── types/                # 类型定义
│   │   ├── api.ts
│   │   └── index.ts
│   └── assets/               # 静态资源
│       ├── images/
│       └── icons/
├── public/                   # 公共静态文件
├── .env.example              # 环境变量示例
├── .env                      # 环境变量（不提交）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### 2.3 文件命名规范

| 类型 | 命名方式 | 示例 |
|------|---------|------|
| TypeScript 源文件 | 小驼峰 | `userService.ts` |
| React 组件 | 大驼峰 | `UserProfile.tsx` |
| 测试文件 | `.test` 后缀 | `userService.test.ts` |
| 配置文件 | 小写 + 扩展名 | `vite.config.ts` |
| 样式文件 | 小写 + 模块 | `global.css` |

---

## 3. 编码规范

### 3.1 TypeScript 规范

#### 3.1.1 类型定义优先
```typescript
// ✅ 推荐：使用 interface 或 type
interface User {
  id: number;
  username: string;
  email?: string;
  role: 'ADMIN' | 'GUIDE' | 'GROWER';
}

type CreateUserInput = Omit<User, 'id'>;

// ❌ 避免：隐式 any
function getUser(id) {  // id 类型为 any
  // ...
}
```

#### 3.1.2 严格空值检查
```typescript
// ✅ 推荐
function getUserEmail(user: User | null): string {
  return user?.email ?? 'no-email@example.com';
}

// ❌ 避免
function getUserEmail(user: User | null): string {
  return user.email;  // 可能为 null
}
```

#### 3.1.3 泛型使用
```typescript
// ✅ 推荐：泛型约束
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  // ...
}

// ❌ 避免：any 泛型
async function fetchData(): Promise<ApiResponse<any>> {
  // ...
}
```

### 3.2 函数规范

#### 3.2.1 函数长度
```typescript
// ✅ 推荐：单一职责，< 50 行
async function approveTask(taskId: number, guideId: number) {
  const task = await getTask(taskId);
  await validatePermission(task, guideId);
  await updateTaskStatus(taskId, 'APPROVED');
  await distributeRewards(task);
  await sendNotification(task.growerId);
}

// ❌ 避免：上帝函数
async function handleTask(req, res) {
  // 100+ 行代码...
}
```

#### 3.2.2 参数数量
```typescript
// ✅ 推荐：对象参数（> 3 个参数时）
interface CreateTaskParams {
  relationshipId: number;
  name: string;
  description?: string;
  difficulty?: number;
  deadline?: Date;
}

async function createTask(params: CreateTaskParams) {
  // ...
}

// ❌ 避免：过多参数
async function createTask(
  relationshipId: number,
  name: string,
  description: string | undefined,
  difficulty: number | undefined,
  deadline: Date | undefined
) {
  // ...
}
```

#### 3.2.3 异步错误处理
```typescript
// ✅ 推荐：try-catch + 自定义错误
async function getUser(id: number): Promise<User> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to get user', { id, error });
    throw new DatabaseError('Failed to fetch user');
  }
}

// ❌ 避免：吞掉错误
async function getUser(id: number): Promise<User | null> {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    return null;  // 错误信息丢失
  }
}
```

### 3.3 React 规范

#### 3.3.1 组件结构
```typescript
// ✅ 推荐：函数组件 + Hooks
import { useState, useEffect } from 'react';

interface TaskCardProps {
  task: Task;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function TaskCard({ task, onApprove, onReject }: TaskCardProps) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(task.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3>{task.name}</h3>
      <Button onClick={handleApprove} loading={loading}>
        通过
      </Button>
    </Card>
  );
}

// ❌ 避免：类组件（除非必要）
class TaskCard extends React.Component {
  // ...
}
```

#### 3.3.2 Props 类型定义
```typescript
// ✅ 推荐：interface 定义 Props
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

export function Button({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary',
  size = 'medium'
}: ButtonProps) {
  // ...
}

// ❌ 避免：内联类型
export function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  // ...
}) {
  // ...
}
```

#### 3.3.3 副作用管理
```typescript
// ✅ 推荐：清晰的依赖数组
useEffect(() => {
  const subscription = eventBus.subscribe('task.updated', handleUpdate);
  return () => subscription.unsubscribe();
}, [handleUpdate]);

// ❌ 避免：缺少依赖或依赖过多
useEffect(() => {
  // ...
});  // 缺少依赖

useEffect(() => {
  // ...
}, [a, b, c, d, e, f]);  // 依赖过多
```

### 3.4 样式规范

#### 3.4.1 CSS 变量
```css
/* ✅ 推荐：使用 CSS 变量 */
:root {
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --border-radius: 8px;
}

.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
}

/* ❌ 避免：硬编码值 */
.button {
  background-color: #667eea;
  padding: 8px 16px;
  border-radius: 8px;
}
```

#### 3.4.2 响应式设计
```css
/* ✅ 推荐：移动优先 */
.container {
  padding: 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

---

## 4. API 设计规范

### 4.1 RESTful 规范

#### 4.1.1 资源命名
```
✅ 推荐：
GET    /api/users           # 获取用户列表
GET    /api/users/:id       # 获取单个用户
POST   /api/users           # 创建用户
PUT    /api/users/:id       # 更新用户
DELETE /api/users/:id       # 删除用户

❌ 避免：
GET    /api/getUsers
POST   /api/createUser
```

#### 4.1.2 HTTP 方法语义
| 方法 | 用途 | 幂等 |
|------|------|------|
| GET | 获取资源 | 是 |
| POST | 创建资源 | 否 |
| PUT | 全量更新 | 是 |
| PATCH | 部分更新 | 否 |
| DELETE | 删除资源 | 是 |

### 4.2 响应格式

#### 4.2.1 成功响应
```typescript
// 单资源
{
  "data": {
    "id": 1,
    "username": "john",
    "email": "john@example.com"
  },
  "message": "Success"
}

// 列表资源
{
  "data": [
    { "id": 1, "username": "john" },
    { "id": 2, "username": "jane" }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 20
}
```

#### 4.2.2 错误响应
```typescript
{
  "error": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "code": "USER_EMAIL_REQUIRED",
  "field": "email",
  "timestamp": "2026-03-08T10:00:00.000Z"
}
```

#### 4.2.3 HTTP 状态码
| 状态码 | 用途 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无内容） |
| 400 | 请求错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 冲突 |
| 422 | 验证失败 |
| 429 | 请求过多 |
| 500 | 服务器错误 |

### 4.3 分页规范

```typescript
// 请求
GET /api/tasks?page=1&pageSize=20&sortBy=createdAt&order=desc

// 响应
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 4.4 版本控制

```
/api/v1/users
/api/v2/users
```

**规范**:
- 重大变更时升级版本号
- 保持向后兼容至少 6 个月
- 在文档中明确标注废弃时间

---

## 5. 数据库规范

### 5.1 命名规范

#### 5.1.1 表名
```prisma
// ✅ 推荐：单数，大驼峰
model User {}
model TaskTemplate {}
model UserDecoration {}

// ❌ 避免：复数
model Users {}
model TaskTemplates {}
```

#### 5.1.2 字段名
```prisma
// ✅ 推荐：小驼峰
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ❌ 避免：蛇形
model User {
  user_name  String
  created_at DateTime
}
```

#### 5.1.3 索引命名
```prisma
// ✅ 推荐：描述性
@@index([username])
@@index([guideId, status])
@@unique([guideId, growerId])
```

### 5.2 数据建模

#### 5.2.1 必填字段
```prisma
// ✅ 推荐：明确可选/必填
model User {
  username  String   // 必填
  email     String?  // 可选
  status    Int      @default(1)  // 必填，有默认值
}
```

#### 5.2.2 时间字段
```prisma
// ✅ 推荐：统一命名
model User {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?  // 软删除
}
```

#### 5.2.3 外键约束
```prisma
// ✅ 推荐：明确关系
model Task {
  guideId      Int
  guide        User     @relation("TaskGuide", fields: [guideId], references: [id])
  growerId     Int
  grower       User     @relation("TaskGrower", fields: [growerId], references: [id])
  
  @@index([guideId])
  @@index([growerId])
}
```

### 5.3 迁移规范

#### 5.3.1 迁移文件命名
```bash
# 格式：YYYYMMDDHHmmss_description.sql
20260308100000_add_user_preferences.sql
20260308120000_add_shop_system.sql
```

#### 5.3.2 迁移审查清单
- [ ] 向后兼容
- [ ] 数据迁移脚本
- [ ] 回滚脚本
- [ ] 性能影响评估
- [ ] 索引添加

---

## 6. 安全规范

### 6.1 认证安全

#### 6.1.1 JWT 配置
```typescript
// ✅ 推荐
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET!,  // 至少 32 字符
  expiresIn: '7d',
  algorithm: 'HS256',
};

// ❌ 避免
const JWT_SECRET = 'change-this-secret-in-production';
```

#### 6.1.2 密码存储
```typescript
// ✅ 推荐
const saltRounds = 12;
const passwordHash = await bcrypt.hash(password, saltRounds);

// ❌ 避免
const passwordHash = await bcrypt.hash(password, 10);  // 强度不足
```

### 6.2 输入验证

#### 6.2.1 Zod Schema
```typescript
import { z } from 'zod';

const createTaskSchema = z.object({
  relationshipId: z.number().positive(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  difficulty: z.number().min(1).max(5).default(1),
  deadline: z.string().datetime().optional(),
});

// 使用
const validated = createTaskSchema.parse(req.body);
```

### 6.3 输出编码

```typescript
// ✅ React 默认转义
<div>{userInput}</div>

// ❌ 避免（除非必要）
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 6.4 敏感数据

#### 6.4.1 环境变量
```bash
# .env.example
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-minimum-32-characters
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# 生产环境
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=production-secret-key
NODE_ENV=production
```

#### 6.4.2 敏感字段加密
```typescript
// 安全词、边界等敏感字段
const encrypted = encrypt(user.safetyWordRed);
await prisma.user.update({
  where: { id: userId },
  data: { safetyWordRedEncrypted: encrypted },
});
```

---

## 7. 测试规范

### 7.1 测试分类

| 类型 | 范围 | 工具 | 覆盖率目标 |
|------|------|------|-----------|
| 单元测试 | 函数/类 | Jest | 80% |
| 集成测试 | API 端点 | Supertest | 70% |
| E2E 测试 | 用户流程 | Playwright | 关键流程 |

### 7.2 单元测试

```typescript
// taskService.test.ts
import { TaskService } from './taskService';
import { prisma } from '@/lib/prisma';

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService(prisma);
  });

  describe('approveTask', () => {
    it('should approve task and distribute rewards', async () => {
      // Arrange
      const taskId = 1;
      const guideId = 2;

      // Act
      const result = await taskService.approveTask(taskId, guideId);

      // Assert
      expect(result.status).toBe('COMPLETED');
      expect(result.auditedBy).toBe(guideId);
    });

    it('should throw ForbiddenError if not guide', async () => {
      // Arrange
      const taskId = 1;
      const wrongGuideId = 999;

      // Act & Assert
      await expect(taskService.approveTask(taskId, wrongGuideId))
        .rejects.toThrow(ForbiddenError);
    });
  });
});
```

### 7.3 API 测试

```typescript
// auth.test.ts
import request from 'supertest';
import app from '../src/index';

describe('POST /api/auth/login', () => {
  it('should return token on valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'test123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
  });

  it('should return 401 on invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
});
```

### 7.4 E2E 测试

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and see dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="username"]', 'test');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/grower/dashboard');
  await expect(page.locator('text=欢迎')).toBeVisible();
});
```

---

## 8. 文档规范

### 8.1 代码注释

#### 8.1.1 JSDoc
```typescript
/**
 * 审核任务并发放奖励
 * 
 * @param taskId - 任务 ID
 * @param guideId - 引导者 ID
 * @param auditComment - 审核意见（可选）
 * @returns 更新后的任务
 * @throws {NotFoundError} 任务不存在
 * @throws {ForbiddenError} 无权限审核
 * 
 * @example
 * ```typescript
 * const task = await approveTask(1, 2, '做得很好！');
 * ```
 */
async function approveTask(
  taskId: number,
  guideId: number,
  auditComment?: string
): Promise<Task> {}
```

#### 8.1.2 行内注释
```typescript
// ✅ 推荐：解释为什么
// 使用缓存避免重复查询数据库
const cached = await redis.get(`user:${userId}`);

// ❌ 避免：解释是什么
// 设置变量为 1
let count = 1;
```

### 8.2 README 规范

```markdown
# 项目名称

> 简短描述

## 功能特性

- 功能 1
- 功能 2

## 快速开始

```bash
# 安装
npm install

# 运行
npm run dev
```

## 技术栈

- 技术 1
- 技术 2

## 贡献指南

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT
```

---

## 9. Git 工作流

### 9.1 分支策略

```
main (生产)
  ↑
develop (开发)
  ↑
feature/xxx (功能分支)
  ↑
fix/xxx (修复分支)
```

### 9.2 提交规范

```bash
# 格式：<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
test:     测试用例
chore:    构建/工具

# 示例
feat(auth): 添加用户注册功能
fix(task): 修复任务审核并发问题
docs(api): 更新 API 文档
refactor(db): 优化数据库连接管理
test(e2e): 添加端到端测试用例
```

### 9.3 PR 审查清单

- [ ] 代码符合规范
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 文档已更新
- [ ] 向后兼容

---

## 10. 代码审查清单

### 10.1 后端审查

- [ ] 输入验证完整
- [ ] 错误处理恰当
- [ ] 数据库查询优化
- [ ] 敏感信息不暴露
- [ ] 日志记录完整
- [ ] 事务使用正确
- [ ] 无 N+1 查询

### 10.2 前端审查

- [ ] 组件职责单一
- [ ] Props 类型完整
- [ ] 副作用管理正确
- [ ] 响应式设计
- [ ] 无障碍访问
- [ ] 性能优化（memo、lazy）
- [ ] 无内存泄漏

### 10.3 通用审查

- [ ] 命名清晰
- [ ] 函数长度合理
- [ ] 注释必要且清晰
- [ ] 无重复代码
- [ ] 遵循 DRY 原则
- [ ] 遵循 KISS 原则

---

## 附录

### A. 快速参考

```bash
# 开发启动
make deps
make init
make dev

# 代码检查
npm run lint
npm run format

# 测试
npm run test
npm run test:e2e

# 构建
npm run build
```

### B. 常用命令

```bash
# 数据库
npx prisma generate
npx prisma db push
npx prisma studio

# Git
git pull origin develop
git checkout -b feature/xxx
git commit -m "feat: description"
git push origin feature/xxx
```

### C. 联系方式

- 项目仓库：https://github.com/DysonSWang/D-S.git
- 问题反馈：GitHub Issues

---

**文档版本**: 1.0.0  
**最后更新**: 2026-03-08  
**维护者**: 星契开发团队
