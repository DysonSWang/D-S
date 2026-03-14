/**
 * Admin Grower Progress API Integration Tests
 * 管理员 - 成长者进度 API 集成测试
 * 
 * 测试范围:
 * - 获取成长者详细信息
 * - 任务统计
 * - 成就统计
 * - 小屋信息
 * - 奖励信息
 * - 权限验证
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth';
import adminSystemRoutes from '../routes/admin-system';
import relationshipRoutes from '../routes/relationship';
import taskRoutes from '../routes/task';
import { prisma } from '../db';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminSystemRoutes);

describe('Admin Grower Progress API', () => {
  // 测试用户数据
  const adminUser = {
    username: `admin_test_${Date.now()}`,
    email: `admin_test_${Date.now()}@example.com`,
    password: 'Admin123456!',
    role: 'ADMIN' as const,
  };

  const growerUser = {
    username: `grower_test_${Date.now()}`,
    email: `grower_test_${Date.now()}@example.com`,
    password: 'Grower123456!',
    role: 'GROWER' as const,
  };

  const guideUser = {
    username: `guide_test_${Date.now()}`,
    email: `guide_test_${Date.now()}@example.com`,
    password: 'Guide123456!',
    role: 'GUIDE' as const,
  };

  let adminToken: string;
  let growerToken: string;
  let guideToken: string;
  let growerId: number;
  let guideId: number;
  let relationshipId: number;

  // 清理测试数据
  afterAll(async () => {
    try {
      // 删除任务
      await prisma.task.deleteMany({
        where: {
          guide: { username: { startsWith: 'guide_test_' } },
        },
      });

      // 删除关系
      await prisma.relationship.deleteMany({
        where: {
          guide: { username: { startsWith: 'guide_test_' } },
        },
      });

      // 删除小屋
      await prisma.cottage.deleteMany({
        where: {
          grower: { username: { startsWith: 'grower_test_' } },
        },
      });

      // 删除奖励
      await prisma.reward.deleteMany({
        where: {
          grower: { username: { startsWith: 'grower_test_' } },
        },
      });

      // 删除用户
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'admin_test_' },
        },
      });
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'grower_test_' },
        },
      });
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'guide_test_' },
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

    // 2. 注册成长者
    const growerRes = await request(app)
      .post('/api/auth/register')
      .send(growerUser);
    growerToken = growerRes.body.token;
    growerId = growerRes.body.user.id;

    // 3. 注册引导者
    const guideRes = await request(app)
      .post('/api/auth/register')
      .send(guideUser);
    guideToken = guideRes.body.token;
    guideId = guideRes.body.user.id;

    // 4. 创建关系
    const relationRes = await request(app)
      .post('/api/relationships/invite')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({ growerUsername: growerUser.username, mode: 'PARTNER' });
    
    relationshipId = relationRes.body.relationship.id;

    // 5. 成长者接受关系
    await request(app)
      .post('/api/relationships/accept')
      .set('Authorization', `Bearer ${growerToken}`)
      .send({ relationshipId });

    // 6. 创建一些测试任务
    await request(app)
      .post('/api/tasks/create')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        relationshipId,
        name: '测试任务 1',
        description: '用于测试成长者进度',
        difficulty: 2,
        proofType: 'TEXT',
        repeatType: 'DAILY',
        rewardConfig: { bones: 100, fish: 50 },
      });

    await request(app)
      .post('/api/tasks/create')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        relationshipId,
        name: '测试任务 2',
        description: '用于测试成长者进度',
        difficulty: 3,
        proofType: 'IMAGE',
        repeatType: 'WEEKLY',
        rewardConfig: { bones: 200, fish: 100 },
      });
  });

  describe('GET /api/admin/grower-progress/:id', () => {
    it('应该拒绝未认证请求', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`);
      
      expect(response.status).toBe(401);
    });

    it('应该拒绝非管理员用户', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(403);
    });

    it('应该拒绝引导者访问', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${guideToken}`);
      
      expect(response.status).toBe(403);
    });

    it('应该返回成长者详细信息', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(growerId);
      expect(response.body.user.username).toBe(growerUser.username);
      expect(response.body.user.role).toBe('GROWER');
    });

    it('应该包含任务统计', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('tasks');
      expect(Array.isArray(response.body.stats.tasks)).toBe(true);
    });

    it('应该包含成就统计', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('achievements');
      expect(typeof response.body.stats.achievements).toBe('number');
    });

    it('应该包含小屋信息', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cottage');
      // 小屋可能为 null（如果还未初始化）
    });

    it('应该包含奖励信息', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reward');
      // 奖励可能为 null（如果还未初始化）
    });

    it('应该返回 404 当用户不存在', async () => {
      const response = await request(app)
        .get('/api/admin/grower-progress/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('不存在');
    });

    it('应该返回 400 当 ID 无效', async () => {
      const response = await request(app)
        .get('/api/admin/grower-progress/abc')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // 可能会返回 400 或 404，取决于实现
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该返回 400 当 ID 为负数', async () => {
      const response = await request(app)
        .get('/api/admin/grower-progress/-1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('成长者信息应该包含正确的字段', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const user = response.body.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('nickname');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('ageVerified');
      expect(user).toHaveProperty('createdAt');
      
      // 不应该包含敏感信息
      expect(user).not.toHaveProperty('password');
    });

    it('任务统计应该包含状态分组', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const taskStats = response.body.stats.tasks;
      // 任务统计可能为空（如果没有任务），但结构应该正确
      expect(Array.isArray(taskStats)).toBe(true);
      
      taskStats.forEach((stat: any) => {
        expect(stat).toHaveProperty('status');
        expect(stat).toHaveProperty('_count');
        expect(typeof stat._count).toBe('number');
      });
    });
  });

  describe('边界条件测试', () => {
    it('应该处理 ID 为 0', async () => {
      const response = await request(app)
        .get('/api/admin/grower-progress/0')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该处理非常大的 ID', async () => {
      const response = await request(app)
        .get('/api/admin/grower-progress/999999999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
    });

    it('应该处理带特殊字符的 ID', async () => {
      const response = await request(app)
        .get('/api/admin/grower-progress/123abc')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // API 应该优雅处理（返回 400 错误、404 或 200 空数据）
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('性能测试', () => {
    it('API 应在 500ms 内响应', async () => {
      const start = Date.now();
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('数据完整性测试', () => {
    it('返回的数据应该是有效的 JSON', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.type).toMatch(/json/);
    });

    it('时间戳应该是有效的日期格式', async () => {
      const response = await request(app)
        .get(`/api/admin/grower-progress/${growerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(new Date(response.body.user.createdAt).getTime()).not.toBeNaN();
    });
  });
});
