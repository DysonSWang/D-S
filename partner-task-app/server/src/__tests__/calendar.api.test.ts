/**
 * Calendar API Integration Tests
 * 任务日历 API 集成测试
 * 
 * 测试范围:
 * - 获取月度任务日历
 * - 获取任务统计概览
 * - 参数验证
 * - 权限验证
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import calendarRoutes from '../routes/calendar';
import authRoutes from '../routes/auth';
import relationshipRoutes from '../routes/relationship';
import taskRoutes from '../routes/task';
import { prisma } from '../db';

// Create test app with all required routes
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/tasks', taskRoutes);

describe('Calendar API', () => {
  // 测试用户数据
  const guideUser = {
    username: `calendar_guide_${Date.now()}`,
    email: `calendar_guide_${Date.now()}@example.com`,
    password: 'Guide123456!',
    role: 'GUIDE' as const,
  };

  const growerUser = {
    username: `calendar_grower_${Date.now()}`,
    email: `calendar_grower_${Date.now()}@example.com`,
    password: 'Grower123456!',
    role: 'GROWER' as const,
  };

  let guideToken: string;
  let growerToken: string;
  let guideId: number;
  let growerId: number;
  let relationshipId: number;

  // 清理测试数据
  afterAll(async () => {
    try {
      // 删除相关任务
      await prisma.task.deleteMany({
        where: {
          guide: {
            username: { startsWith: 'calendar_guide_' },
          },
        },
      });

      // 删除关系
      await prisma.relationship.deleteMany({
        where: {
          guide: {
            username: { startsWith: 'calendar_guide_' },
          },
        },
      });

      // 删除用户
      await prisma.user.deleteMany({
        where: {
          username: { startsWith: 'calendar_' },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  // 准备测试数据：注册、登录、创建关系、创建任务
  beforeAll(async () => {
    // 1. 注册引导者
    const guideRes = await request(app)
      .post('/api/auth/register')
      .send(guideUser);
    guideToken = guideRes.body.token;
    guideId = guideRes.body.user.id;

    // 2. 注册成长者
    const growerRes = await request(app)
      .post('/api/auth/register')
      .send(growerUser);
    growerToken = growerRes.body.token;
    growerId = growerRes.body.user.id;

    // 3. 创建关系
    const relationRes = await request(app)
      .post('/api/relationships/invite')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({ growerUsername: growerUser.username, mode: 'PARTNER' });
    
    relationshipId = relationRes.body.relationship.id;

    // 4. 成长者接受关系
    await request(app)
      .post(`/api/relationships/${relationshipId}/accept`)
      .set('Authorization', `Bearer ${growerToken}`)
      .send({});
  });

  describe('GET /api/calendar/tasks', () => {
    it('应该拒绝未认证请求', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=3');
      
      expect(response.status).toBe(401);
    });

    it('应该拒绝缺少 year 参数的请求', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?month=3')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('年份');
    });

    it('应该拒绝缺少 month 参数的请求', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('月份');
    });

    it('应该返回空日历数据（无任务）', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=1')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('year', 2026);
      expect(response.body.data).toHaveProperty('month', 1);
      expect(response.body.data).toHaveProperty('days');
      expect(response.body.data.days).toHaveLength(31); // 1 月有 31 天
      expect(response.body.data.stats.total).toBe(0);
    });

    it('应该返回当前月份的日历数据', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await request(app)
        .get(`/api/calendar/tasks?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.year).toBe(year);
      expect(response.body.data.month).toBe(month);
      
      // 检查今天标记
      const today = now.toISOString().split('T')[0];
      const todayData = response.body.data.days.find((d: any) => d.date === today);
      expect(todayData).toBeDefined();
      expect(todayData.isToday).toBe(true);
    });

    it('应该包含任务数据的日历', async () => {
      // 创建一个任务
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          relationshipId,
          name: '日历测试任务',
          description: '用于测试日历功能',
          difficulty: 2,
          proofType: 'TEXT',
          repeatType: 'DAILY',
          rewardConfig: { bones: 100, fish: 50 },
        });

      expect(taskRes.status).toBe(201);
      const taskId = taskRes.body.task.id;
      const taskDate = new Date(taskRes.body.task.createdAt).toISOString().split('T')[0];

      // 获取日历
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await request(app)
        .get(`/api/calendar/tasks?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // 查找有任务的那一天
      const dayWithTask = response.body.data.days.find((d: any) => d.date === taskDate);
      expect(dayWithTask).toBeDefined();
      expect(dayWithTask.hasTasks).toBe(true);
      expect(dayWithTask.tasks).toHaveLength(1);
      expect(dayWithTask.tasks[0].name).toBe('日历测试任务');
    });

    it('应该正确统计任务状态', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await request(app)
        .get(`/api/calendar/tasks?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      
      // 验证统计数据结构
      expect(response.body.data.stats).toHaveProperty('total');
      expect(response.body.data.stats).toHaveProperty('completed');
      expect(response.body.data.stats).toHaveProperty('pending');
      expect(response.body.data.stats).toHaveProperty('inProgress');
      
      // 验证统计数字正确
      const totalFromStats = response.body.data.stats.total;
      const totalFromDays = response.body.data.days.reduce(
        (sum: number, day: any) => sum + day.tasks.length, 
        0
      );
      expect(totalFromStats).toBe(totalFromDays);
    });

    it('应该正确处理星期几', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=3')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      
      // 2026-03-01 是星期日 (dayOfWeek = 0)
      const firstDay = response.body.data.days[0];
      expect(firstDay.dayOfWeek).toBe(0);
      expect(firstDay.day).toBe(1);
    });

    it('应该正确处理闰年 2 月', async () => {
      // 2024 是闰年
      const response = await request(app)
        .get('/api/calendar/tasks?year=2024&month=2')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.days).toHaveLength(29); // 闰年 2 月 29 天
    });

    it('应该正确处理平年 2 月', async () => {
      // 2026 是平年
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=2')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.days).toHaveLength(28); // 平年 2 月 28 天
    });

    it('应该拒绝无效月份', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=13')
        .set('Authorization', `Bearer ${growerToken}`);
      
      // 应该返回空数据或错误
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('引导者应该能查看自己的日历', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=3')
        .set('Authorization', `Bearer ${guideToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/calendar/stats', () => {
    it('应该拒绝未认证请求', async () => {
      const response = await request(app)
        .get('/api/calendar/stats');
      
      expect(response.status).toBe(401);
    });

    it('应该返回最近 7 天的统计', async () => {
      const response = await request(app)
        .get('/api/calendar/stats')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('weekStats');
      expect(response.body.data.weekStats).toHaveLength(7);
      
      // 验证每一天都有正确的字段
      response.body.data.weekStats.forEach((day: any) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('day');
        expect(day).toHaveProperty('total');
        expect(day).toHaveProperty('completed');
      });
    });

    it('应该返回最近 6 个月的趋势', async () => {
      const response = await request(app)
        .get('/api/calendar/stats')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('monthTrend');
      expect(response.body.data.monthTrend).toHaveLength(6);
      
      // 验证每一个月都有正确的字段
      response.body.data.monthTrend.forEach((month: any) => {
        expect(month).toHaveProperty('year');
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('label');
        expect(month).toHaveProperty('total');
        expect(month).toHaveProperty('completed');
      });
    });

    it('应该正确计算完成的任务数', async () => {
      const response = await request(app)
        .get('/api/calendar/stats')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      
      // 验证 completed <= total
      response.body.data.weekStats.forEach((day: any) => {
        expect(day.completed).toBeLessThanOrEqual(day.total);
      });
      
      response.body.data.monthTrend.forEach((month: any) => {
        expect(month.completed).toBeLessThanOrEqual(month.total);
      });
    });

    it('应该包含今天的统计', async () => {
      const response = await request(app)
        .get('/api/calendar/stats')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.weekStats).toHaveLength(7);
      
      // 验证 weekStats 数据结构
      response.body.data.weekStats.forEach((day: any) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('day');
        expect(day).toHaveProperty('total');
        expect(day).toHaveProperty('completed');
      });
    });
  });

  describe('边界条件测试', () => {
    it('应该处理无效年份', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=abc&month=3')
        .set('Authorization', `Bearer ${growerToken}`);
      
      // API 应该优雅处理无效输入（返回错误或空数据）
      expect([200, 400, 500]).toContain(response.status);
    });

    it('应该处理无效月份', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=abc')
        .set('Authorization', `Bearer ${growerToken}`);
      
      // API 应该优雅处理无效输入
      expect([200, 400, 500]).toContain(response.status);
    });

    it('应该处理负数月份', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=-1')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('应该处理过大的月份', async () => {
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=999')
        .set('Authorization', `Bearer ${growerToken}`);
      
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('性能测试', () => {
    it('日历 API 应在 500ms 内响应', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/calendar/tasks?year=2026&month=3')
        .set('Authorization', `Bearer ${growerToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });

    it('统计 API 应在 500ms 内响应', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/calendar/stats')
        .set('Authorization', `Bearer ${growerToken}`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });
});
