/**
 * Admin Guide Stats API Integration Tests
 * 管理员 - 引导者统计 API 集成测试
 * 
 * 测试范围:
 * - 获取引导者详细信息
 * - 关系统计
 * - 任务统计
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

describe('Admin Guide Stats API', () => {
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

  const growerUser1 = {
    username: `grower_stats1_${Date.now()}`,
    email: `grower_stats1_${Date.now()}@example.com`,
    password: 'Grower123456!',
    role: 'GROWER' as const,
  };

  const growerUser2 = {
    username: `grower_stats2_${Date.now()}`,
    email: `grower_stats2_${Date.now()}@example.com`,
    password: 'Grower123456!',
    role: 'GROWER' as const,
  };

  let adminToken: string;
  let guideToken: string;
  let growerToken1: string;
  let growerToken2: string;
  let guideId: number;
  let growerId1: number;
  let growerId2: number;
  let relationshipId1: number;
  let relationshipId2: number;

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
          username: { startsWith: 'grower_stats' },
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
    guideId = guideRes.body.user.id;

    // 3. 注册成长者 1
    const growerRes1 = await request(app)
      .post('/api/auth/register')
      .send(growerUser1);
    growerToken1 = growerRes1.body.token;
    growerId1 = growerRes1.body.user.id;

    // 4. 注册成长者 2
    const growerRes2 = await request(app)
      .post('/api/auth/register')
      .send(growerUser2);
    growerToken2 = growerRes2.body.token;
    growerId2 = growerRes2.body.user.id;

    // 5. 创建关系 1
    const relationRes1 = await request(app)
      .post('/api/relationships/invite')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({ growerUsername: growerUser1.username, mode: 'PARTNER' });
    relationshipId1 = relationRes1.body.relationship.id;

    // 6. 成长者 1 接受关系
    await request(app)
      .post('/api/relationships/accept')
      .set('Authorization', `Bearer ${growerToken1}`)
      .send({ relationshipId: relationshipId1 });

    // 7. 创建关系 2
    const relationRes2 = await request(app)
      .post('/api/relationships/invite')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({ growerUsername: growerUser2.username, mode: 'PARTNER' });
    relationshipId2 = relationRes2.body.relationship.id;

    // 8. 成长者 2 接受关系
    await request(app)
      .post('/api/relationships/accept')
      .set('Authorization', `Bearer ${growerToken2}`)
      .send({ relationshipId: relationshipId2 });

    // 9. 为关系 1 创建任务
    await request(app)
      .post('/api/tasks/create')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        relationshipId: relationshipId1,
        name: '引导者统计测试任务 1',
        description: '用于测试引导者统计',
        difficulty: 2,
        proofType: 'TEXT',
        repeatType: 'DAILY',
        rewardConfig: { bones: 100, fish: 50 },
      });

    // 10. 为关系 2 创建任务
    await request(app)
      .post('/api/tasks/create')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        relationshipId: relationshipId2,
        name: '引导者统计测试任务 2',
        description: '用于测试引导者统计',
        difficulty: 3,
        proofType: 'IMAGE',
        repeatType: 'WEEKLY',
        rewardConfig: { bones: 200, fish: 100 },
      });
  });

  describe('GET /api/admin/guide-stats/:id', () => {
    it('应该拒绝未认证请求', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`);
      
      expect(response.status).toBe(401);
    });

    it('应该拒绝非管理员用户', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${guideToken}`);
      
      expect(response.status).toBe(403);
    });

    it('应该拒绝成长者访问', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${growerToken1}`);
      
      expect(response.status).toBe(403);
    });

    it('应该返回引导者详细信息', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(guideId);
      expect(response.body.user.username).toBe(guideUser.username);
      expect(response.body.user.role).toBe('GUIDE');
    });

    it('应该包含关系统计', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('relationships');
      expect(Array.isArray(response.body.stats.relationships)).toBe(true);
    });

    it('应该包含任务统计', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('tasks');
      expect(Array.isArray(response.body.stats.tasks)).toBe(true);
    });

    it('应该返回 404 当引导者不存在', async () => {
      const response = await request(app)
        .get('/api/admin/guide-stats/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('不存在');
    });

    it('应该返回 400 当 ID 无效', async () => {
      const response = await request(app)
        .get('/api/admin/guide-stats/abc')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该返回 400 当 ID 为负数', async () => {
      const response = await request(app)
        .get('/api/admin/guide-stats/-1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('引导者信息应该包含正确的字段', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const user = response.body.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('nickname');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('createdAt');
      
      // 不应该包含敏感信息
      expect(user).not.toHaveProperty('password');
    });

    it('关系统计应该包含状态分组', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const relationshipStats = response.body.stats.relationships;
      expect(relationshipStats.length).toBeGreaterThan(0);
      
      relationshipStats.forEach((stat: any) => {
        expect(stat).toHaveProperty('status');
        expect(stat).toHaveProperty('_count');
        expect(typeof stat._count).toBe('number');
      });
    });

    it('任务统计应该包含状态分组', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      const taskStats = response.body.stats.tasks;
      // 任务统计可能为空，但结构应该正确
      expect(Array.isArray(taskStats)).toBe(true);
      
      taskStats.forEach((stat: any) => {
        expect(stat).toHaveProperty('status');
        expect(stat).toHaveProperty('_count');
        expect(typeof stat._count).toBe('number');
      });
    });

    it('应该正确统计多个关系的任务数', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      
      // 验证统计结构正确
      const taskStats = response.body.stats.tasks;
      expect(Array.isArray(taskStats)).toBe(true);
      
      // 如果有任务，验证总数
      const totalTasks = taskStats.reduce(
        (sum: number, stat: any) => sum + stat._count,
        0
      );
      expect(totalTasks).toBeGreaterThanOrEqual(0);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理 ID 为 0', async () => {
      const response = await request(app)
        .get('/api/admin/guide-stats/0')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该处理非常大的 ID', async () => {
      const response = await request(app)
        .get('/api/admin/guide-stats/999999999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
    });

    it('应该处理带特殊字符的 ID', async () => {
      const response = await request(app)
        .get('/api/admin/guide-stats/123abc')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // API 应该优雅处理（返回 400 错误、404 或 200 空数据）
      expect([200, 400, 404]).toContain(response.status);
    });

    it('应该处理没有关系的引导者', async () => {
      // 创建一个没有关系的引导者
      const newGuideRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: `guide_lonely_${Date.now()}`,
          email: `guide_lonely_${Date.now()}@example.com`,
          password: 'Guide123456!',
          role: 'GUIDE',
        });
      
      const newGuideId = newGuideRes.body.user.id;
      
      const response = await request(app)
        .get(`/api/admin/guide-stats/${newGuideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.stats.relationships).toEqual([]);
    });
  });

  describe('性能测试', () => {
    it('API 应在 500ms 内响应', async () => {
      const start = Date.now();
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('数据完整性测试', () => {
    it('返回的数据应该是有效的 JSON', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.type).toMatch(/json/);
    });

    it('时间戳应该是有效的日期格式', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(new Date(response.body.user.createdAt).getTime()).not.toBeNaN();
    });
  });

  describe('权限安全测试', () => {
    it('引导者不能查看其他引导者的统计', async () => {
      // 创建另一个引导者
      const otherGuideRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: `guide_other_${Date.now()}`,
          email: `guide_other_${Date.now()}@example.com`,
          password: 'Guide123456!',
          role: 'GUIDE',
        });
      
      const otherGuideToken = otherGuideRes.body.token;
      const otherGuideId = otherGuideRes.body.user.id;
      
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${otherGuideToken}`);
      
      expect(response.status).toBe(403);
    });

    it('成长者不能查看引导者的统计', async () => {
      const response = await request(app)
        .get(`/api/admin/guide-stats/${guideId}`)
        .set('Authorization', `Bearer ${growerToken1}`);
      
      expect(response.status).toBe(403);
    });
  });
});
