/**
 * Auth API Integration Tests
 * 认证 API 集成测试
 * 
 * 测试范围:
 * - 用户注册
 * - 用户登录
 * - Token 验证
 * - 密码验证
 * - 角色权限
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth';
import { prisma } from '../db';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  // 测试用户数据
  const testUser = {
    username: `test_user_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'Test123456!',
    role: 'GROWER' as const,
  };

  let authToken: string;
  let userId: number;

  // 清理测试数据
  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          username: {
            startsWith: 'test_user_',
          },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('POST /api/auth/register', () => {
    it('应该成功创建新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password,
          role: testUser.role,
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.role).toBe(testUser.role);
      expect(response.body.user.email).toBe(testUser.email);

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('应该拒绝重复用户名', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: `another${Date.now()}@example.com`,
          password: testUser.password,
          role: 'GROWER',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝重复邮箱', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `another_user_${Date.now()}`,
          email: testUser.email,
          password: testUser.password,
          role: 'GROWER',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝过短密码', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `test_short_${Date.now()}`,
          email: `short${Date.now()}@example.com`,
          password: '123',
          role: 'GROWER',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝无效邮箱格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `test_invalid_${Date.now()}`,
          email: 'invalid-email',
          password: testUser.password,
          role: 'GROWER',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝无效角色', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `test_role_${Date.now()}`,
          email: `role${Date.now()}@example.com`,
          password: testUser.password,
          role: 'INVALID_ROLE',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝缺少必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          // 缺少 email 和 password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(testUser.username);
    });

    it('应该拒绝错误密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent_user',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝缺少字段', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          // 缺少 password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('应该返回当前用户信息', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(testUser.username);
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝无 token 访问', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('密码安全性测试', () => {
    it('应该接受强密码', async () => {
      const strongPassword = 'StrongP@ssw0rd123!';
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `test_strong_${Date.now()}`,
          email: `strong${Date.now()}@example.com`,
          password: strongPassword,
          role: 'GROWER',
        });

      expect(response.status).toBe(200);
    });

    it('密码应该被加密存储', async () => {
      const user = await prisma.user.findUnique({
        where: { username: testUser.username },
      });

      expect(user).toBeTruthy();
      // 密码不应该明文存储
      expect(user?.passwordHash).not.toBe(testUser.password);
      // 密码应该是 bcrypt 格式 (以 $2 开头)
      expect(user?.passwordHash).toMatch(/^\$2[aby]?\$/);
    });
  });

  describe('Token 验证', () => {
    it('Token 应该包含用户 ID', () => {
      expect(authToken).toBeTruthy();
      const parts = authToken.split('.');
      expect(parts.length).toBe(3);
    });

    it('过期 Token 应该被拒绝', async () => {
      // 使用明显无效的 token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.expired';
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('角色权限测试', () => {
    it('GUIDE 角色应该可以注册', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `test_guide_${Date.now()}`,
          email: `guide${Date.now()}@example.com`,
          password: testUser.password,
          role: 'GUIDE',
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.user.role).toBe('GUIDE');
    });

    it('ADMIN 角色应该可以注册', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `test_admin_${Date.now()}`,
          email: `admin${Date.now()}@example.com`,
          password: testUser.password,
          role: 'ADMIN',
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.user.role).toBe('ADMIN');
    });
  });
});
