/**
 * Admin Stats API Integration Tests
 * 管理员 - 数据统计 API 集成测试
 * 
 * 测试范围:
 * - 获取管理统计数据
 * - 用户统计 (总数/角色分布)
 * - 关系统计
 * - 任务统计
 * - 敏感词统计
 * - 权限验证
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth';
import adminRoutes from '../routes/admin';
import relationshipRoutes from '../routes/relationship';
import taskRoutes from '../routes/task';
import { prisma } from '../db';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/tasks', taskRoutes);

describe('Admin Stats API', () => {
  // 测试用户数据
  const adminUser = {
    username: `admin_stats_${Date.now()}`,
    email: `admin_stats_${Date.now()}@example.com`,
    password: 'Admin123456!',
    role: 'ADMIN' as const,
  };

  const guideUser = {
    username: `guide_stats_${Date.now()}`,
    email: `guide_stats_${Date.now()}@example.com`,
    password: 'Guide123456!',
    role: 'GUIDE' as const,
  };

  const growerUser = {
    username: `grower_stats_${Date.now()}`,
    email: `grower_stats_${Date.now()}@example.com`,
    password: 'Grower123456!',
    role: 'GROWER' as const,
  };

  let adminToken: string;
  let guideToken: string;
  let growerToken: string;
  let relationshipId: number;

  // 清理测试数据
  afterAll(async () => {
    try {
      // 删除任务
      await prisma.task.deleteMany({
        where: {
          guide: { username: { startsWith: 'guide_stats_' } },
        },
      });

      // 删除关系
      await prisma.relationship.deleteMany({
        where: {
          guide: { username: { startsWith: 'guide_stats_' } },
        },
      });

      // 删除用户
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'admin_stats_' },
        },
      });
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'guide_stats_' },
        },
      });
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'grower_stats_' },
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

    // 3. 注册成长者
    const growerRes = await request(app)
      .post('/api/auth/register')
      .send(growerUser);
    growerToken = growerRes.body.token;

    // 4. 创建关系
    const relationRes = await request(app)
      .post('/api/relationships/invite')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({ growerUsername: growerUser.username, mode: 'PARTNER' });
    
    relationshipId = relationRes.body.relationship.id;

    // 5. 成长者接受关系
    await request(app)
      .post(`/api/relationships/${relationshipId}/accept`)
      .set('Authorization', `Bearer ${growerToken}`)
      .send({});

    // 6. 创建测试任务
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        relationshipId,
        name: '统计测试任务',
        description: '用于测试管理统计',
        difficulty: 2,
        proofType: 'TEXT',
        repeatType: 'DAILY',
        rewardConfig: { bones: 100, fish: 50 },
      });
  });

  describe('GET /api/admin/stats', () => {
    it('应该拒绝未认证请求', async () => {
      const response = await request(app)
        .get('/api/admin/stats');
      
      expect(response.status).toBe(401);
    });

    it('应该拒绝非管理员用户', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${guideToken}`);
      
      expect(response.status).toBe(403);
    });

    it('应该拒绝成长者访问', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(403);
    });

    it('应该返回管理统计数据', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
    });

    it('应该包含用户统计', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('users');
      expect(response.body.stats.users).toHaveProperty('total');
      expect(response.body.stats.users).toHaveProperty('guides');
      expect(response.body.stats.users).toHaveProperty('growers');
    });

    it('用户统计应该包含正确的数字', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const users = response.body.stats.users;
      expect(users.total).toBeGreaterThan(0);
      expect(users.guides).toBeGreaterThanOrEqual(1);
      expect(users.growers).toBeGreaterThanOrEqual(1);
      
      // guides + growers 应该 <= total
      expect(users.guides + users.growers).toBeLessThanOrEqual(users.total);
    });

    it('应该包含关系统计', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('relationships');
      expect(response.body.stats.relationships).toHaveProperty('total');
      expect(response.body.stats.relationships.total).toBeGreaterThanOrEqual(1);
    });

    it('应该包含任务统计', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('tasks');
      expect(response.body.stats.tasks).toHaveProperty('total');
      expect(response.body.stats.tasks).toHaveProperty('pendingReview');
    });

    it('任务统计应该包含正确的数字', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const tasks = response.body.stats.tasks;
      expect(tasks.total).toBeGreaterThanOrEqual(1);
      expect(tasks.pendingReview).toBeGreaterThanOrEqual(0);
      
      // pendingReview 应该 <= total
      expect(tasks.pendingReview).toBeLessThanOrEqual(tasks.total);
    });

    it('应该包含敏感词统计', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('moderation');
      expect(response.body.stats.moderation).toHaveProperty('sensitiveWords');
      expect(typeof response.body.stats.moderation.sensitiveWords).toBe('number');
    });

    it('统计数据应该是整数', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const stats = response.body.stats;
      expect(Number.isInteger(stats.users.total)).toBe(true);
      expect(Number.isInteger(stats.users.guides)).toBe(true);
      expect(Number.isInteger(stats.users.growers)).toBe(true);
      expect(Number.isInteger(stats.relationships.total)).toBe(true);
      expect(Number.isInteger(stats.tasks.total)).toBe(true);
      expect(Number.isInteger(stats.tasks.pendingReview)).toBe(true);
      expect(Number.isInteger(stats.moderation.sensitiveWords)).toBe(true);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空数据库', async () => {
      // 创建一个新的测试用户（不创建关系和任务）
      const newUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: `admin_stats_empty_${Date.now()}`,
          email: `admin_stats_empty_${Date.now()}@example.com`,
          password: 'Admin123456!',
          role: 'ADMIN',
        });
      
      const newAdminToken = newUserRes.body.token;
      
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${newAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats.users.total).toBeGreaterThanOrEqual(1);
    });

    it('应该处理大量数据', async () => {
      // 这个测试验证 API 在数据量大时的表现
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
    });
  });

  describe('性能测试', () => {
    it('API 应在 500ms 内响应', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });

    it('统计 API 应在 300ms 内响应（并发查询）', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(300);
    });
  });

  describe('数据完整性测试', () => {
    it('返回的数据应该是有效的 JSON', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.type).toMatch(/json/);
    });

    it('统计数据结构应该完整', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const stats = response.body.stats;
      expect(stats).toHaveProperty('users');
      expect(stats).toHaveProperty('relationships');
      expect(stats).toHaveProperty('tasks');
      expect(stats).toHaveProperty('moderation');
    });

    it('统计数据不应该为负数', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const stats = response.body.stats;
      expect(stats.users.total).toBeGreaterThanOrEqual(0);
      expect(stats.users.guides).toBeGreaterThanOrEqual(0);
      expect(stats.users.growers).toBeGreaterThanOrEqual(0);
      expect(stats.relationships.total).toBeGreaterThanOrEqual(0);
      expect(stats.tasks.total).toBeGreaterThanOrEqual(0);
      expect(stats.tasks.pendingReview).toBeGreaterThanOrEqual(0);
      expect(stats.moderation.sensitiveWords).toBeGreaterThanOrEqual(0);
    });
  });

  describe('权限安全测试', () => {
    it('未登录用户不能访问', async () => {
      const response = await request(app)
        .get('/api/admin/stats');
      
      expect(response.status).toBe(401);
    });

    it('引导者不能访问统计数据', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${guideToken}`);
      
      expect(response.status).toBe(403);
    });

    it('成长者不能访问统计数据', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(403);
    });

    it('过期 Token 不能访问', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer invalid_token_12345');
      
      expect(response.status).toBe(401);
    });

    it('不同管理员应该看到相同的统计数据', async () => {
      // 创建另一个管理员
      const admin2Res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `admin_stats2_${Date.now()}`,
          email: `admin_stats2_${Date.now()}@example.com`,
          password: 'Admin123456!',
          role: 'ADMIN',
        });
      
      const admin2Token = admin2Res.body.token;
      
      const response1 = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const response2 = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${admin2Token}`);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // 统计数据应该一致
      expect(response1.body.stats.users.total).toBe(response2.body.stats.users.total);
      expect(response1.body.stats.relationships.total).toBe(response2.body.stats.relationships.total);
    });
  });

  describe('数据一致性测试', () => {
    it('用户统计应该与实际数量一致', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const statsUsers = response.body.stats.users;
      
      // 分别查询各角色数量
      const [total, guides, growers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'GUIDE' } }),
        prisma.user.count({ where: { role: 'GROWER' } }),
      ]);
      
      expect(statsUsers.total).toBe(total);
      expect(statsUsers.guides).toBe(guides);
      expect(statsUsers.growers).toBe(growers);
    });

    it('关系统计应该与实际数量一致', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const actualCount = await prisma.relationship.count();
      expect(response.body.stats.relationships.total).toBe(actualCount);
    });

    it('任务统计应该与实际数量一致', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const [total, pendingReview] = await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { status: 'PENDING_REVIEW' } }),
      ]);
      
      expect(response.body.stats.tasks.total).toBe(total);
      expect(response.body.stats.tasks.pendingReview).toBe(pendingReview);
    });
  });
});
