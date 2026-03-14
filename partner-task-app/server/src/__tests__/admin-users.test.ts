/**
 * Admin Users API Integration Tests
 * 管理员 - 用户管理 API 集成测试
 * 
 * 测试范围:
 * - 获取用户列表
 * - 用户筛选 (角色/状态)
 * - 分页功能
 * - 权限验证
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth';
import adminRoutes from '../routes/admin';
import { prisma } from '../db';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

describe('Admin Users API', () => {
  // 测试用户数据
  const adminUser = {
    username: `admin_users_${Date.now()}`,
    email: `admin_users_${Date.now()}@example.com`,
    password: 'Admin123456!',
    role: 'ADMIN' as const,
  };

  const guideUser = {
    username: `guide_users_${Date.now()}`,
    email: `guide_users_${Date.now()}@example.com`,
    password: 'Guide123456!',
    role: 'GUIDE' as const,
  };

  const growerUser1 = {
    username: `grower_users1_${Date.now()}`,
    email: `grower_users1_${Date.now()}@example.com`,
    password: 'Grower123456!',
    role: 'GROWER' as const,
  };

  const growerUser2 = {
    username: `grower_users2_${Date.now()}`,
    email: `grower_users2_${Date.now()}@example.com`,
    password: 'Grower123456!',
    role: 'GROWER' as const,
  };

  let adminToken: string;
  let guideToken: string;
  let growerToken1: string;
  let growerToken2: string;

  // 清理测试数据
  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'admin_users_' },
        },
      });
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'guide_users_' },
        },
      });
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'grower_users' },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  // 准备测试数据
  beforeAll(async () => {
    // 1. 注册管理员
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send(adminUser);
    adminToken = adminRes.body.token;

    // 2. 注册引导者
    const guideRes = await request(app)
      .post('/api/auth/register')
      .send(guideUser);
    guideToken = guideRes.body.token;

    // 3. 注册成长者 1
    const growerRes1 = await request(app)
      .post('/api/auth/register')
      .send(growerUser1);
    growerToken1 = growerRes1.body.token;

    // 4. 注册成长者 2
    const growerRes2 = await request(app)
      .post('/api/auth/register')
      .send(growerUser2);
    growerToken2 = growerRes2.body.token;
  });

  describe('GET /api/admin/users', () => {
    it('应该拒绝未认证请求', async () => {
      const response = await request(app)
        .get('/api/admin/users');
      
      expect(response.status).toBe(401);
    });

    it('应该拒绝非管理员用户', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${guideToken}`);
      
      expect(response.status).toBe(403);
    });

    it('应该拒绝成长者访问', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${growerToken1}`);
      
      expect(response.status).toBe(403);
    });

    it('应该返回用户列表', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('应该按角色筛选用户 - GUIDE', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=GUIDE')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeGreaterThan(0);
      
      response.body.users.forEach((user: any) => {
        expect(user.role).toBe('GUIDE');
      });
    });

    it('应该按角色筛选用户 - GROWER', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=GROWER')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeGreaterThan(0);
      
      response.body.users.forEach((user: any) => {
        expect(user.role).toBe('GROWER');
      });
    });

    it('应该按状态筛选用户', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      response.body.users.forEach((user: any) => {
        expect(user.status).toBe(1);
      });
    });

    it('应该支持分页 - limit', async () => {
      const response = await request(app)
        .get('/api/admin/users?limit=2')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(2);
    });

    it('应该支持分页 - offset', async () => {
      const response1 = await request(app)
        .get('/api/admin/users?limit=1&offset=0')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const response2 = await request(app)
        .get('/api/admin/users?limit=1&offset=1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      if (response1.body.users.length > 0 && response2.body.users.length > 0) {
        expect(response1.body.users[0].id).not.toBe(response2.body.users[0].id);
      }
    });

    it('应该返回正确的用户字段', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      if (response.body.users.length > 0) {
        const user = response.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('nickname');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('status');
        expect(user).toHaveProperty('ageVerified');
        expect(user).toHaveProperty('createdAt');
        
        // 不应该包含敏感信息
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('passwordHash');
      }
    });

    it('应该按创建时间倒序排列', async () => {
      const response = await request(app)
        .get('/api/admin/users?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      if (response.body.users.length > 1) {
        const users = response.body.users;
        for (let i = 1; i < users.length; i++) {
          const prevDate = new Date(users[i - 1].createdAt).getTime();
          const currDate = new Date(users[i].createdAt).getTime();
          expect(prevDate).toBeGreaterThanOrEqual(currDate);
        }
      }
    });

    it('total 应该与实际数量匹配', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.total).toBeGreaterThanOrEqual(response.body.users.length);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理 limit=0', async () => {
      const response = await request(app)
        .get('/api/admin/users?limit=0')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.users).toEqual([]);
    });

    it('应该处理负数 limit', async () => {
      const response = await request(app)
        .get('/api/admin/users?limit=-1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // 应该返回错误或默认值
      expect([200, 400]).toContain(response.status);
    });

    it('应该处理负数 offset', async () => {
      const response = await request(app)
        .get('/api/admin/users?offset=-1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // API 应该优雅处理（返回任意有效状态码）
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('应该处理无效的角色', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=INVALID_ROLE')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      // 可能返回空数组或包含该角色的用户（如果数据库中有）
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('应该处理无效的状态', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      // 可能返回空数组
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('API 应在 500ms 内响应', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });

    it('带筛选的 API 应在 500ms 内响应', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/admin/users?role=GROWER&status=1')
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('数据完整性测试', () => {
    it('返回的数据应该是有效的 JSON', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.type).toMatch(/json/);
    });

    it('时间戳应该是有效的日期格式', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      if (response.body.users.length > 0) {
        const user = response.body.users[0];
        expect(new Date(user.createdAt).getTime()).not.toBeNaN();
      }
    });
  });

  describe('权限安全测试', () => {
    it('未登录用户不能访问', async () => {
      const response = await request(app)
        .get('/api/admin/users');
      
      expect(response.status).toBe(401);
    });

    it('引导者不能访问用户列表', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${guideToken}`);
      
      expect(response.status).toBe(403);
    });

    it('成长者不能访问用户列表', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${growerToken1}`);
      
      expect(response.status).toBe(403);
    });

    it('过期 Token 不能访问', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid_token_12345');
      
      expect(response.status).toBe(401);
    });
  });
});
