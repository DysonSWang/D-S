/**
 * Tasks API Integration Tests
 * 任务 API 集成测试
 * 
 * 测试范围:
 * - 任务创建
 * - 任务列表查询
 * - 任务状态流转
 * - 任务审核
 * - 重复任务
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import taskRoutes from '../routes/task';
import authRoutes from '../routes/auth';
import { prisma } from '../db';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

describe('Tasks API', () => {
  let guideToken: string;
  let growerToken: string;
  let guideId: number;
  let growerId: number;
  let relationshipId: number;
  let taskId: number;

  const guideUser = {
    username: `guide_task_${Date.now()}`,
    email: `guide_task_${Date.now()}@example.com`,
    password: 'Test123456!',
    role: 'GUIDE' as const,
  };

  const growerUser = {
    username: `grower_task_${Date.now()}`,
    email: `grower_task_${Date.now()}@example.com`,
    password: 'Test123456!',
    role: 'GROWER' as const,
  };

  // 创建测试用户和关系
  beforeAll(async () => {
    // 创建引导者
    const guideRes = await request(app)
      .post('/api/auth/register')
      .send(guideUser);
    guideToken = guideRes.body.token;
    guideId = guideRes.body.user.id;

    // 创建成长者
    const growerRes = await request(app)
      .post('/api/auth/register')
      .send(growerUser);
    growerToken = growerRes.body.token;
    growerId = growerRes.body.user.id;

    // 创建关系
    const relRes = await request(app)
      .post('/api/relationships/create')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        inviteeUsername: growerUser.username,
        mode: 'PARTNER',
      });
    relationshipId = relRes.body.relationship.id;

    // 接受关系
    await request(app)
      .post(`/api/relationships/${relationshipId}/accept`)
      .set('Authorization', `Bearer ${growerToken}`);
  });

  // 清理测试数据
  afterAll(async () => {
    try {
      await prisma.task.deleteMany({
        where: { relationshipId },
      });
      await prisma.relationship.delete({ where: { id: relationshipId } });
      await prisma.user.delete({ where: { id: guideId } });
      await prisma.user.delete({ where: { id: growerId } });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('POST /api/tasks/create', () => {
    const taskData = {
      relationshipId: 0, // Will be set in test
      name: '每日打卡',
      description: '完成每日任务打卡',
      difficulty: 2,
      proofType: 'TEXT',
      repeatType: 'DAILY',
      rewardConfig: {
        bones: 100,
        fish: 50,
      },
    };

    it('应该成功创建任务', async () => {
      const response = await request(app)
        .post('/api/tasks/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          ...taskData,
          relationshipId,
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.name).toBe(taskData.name);
      expect(response.body.task.relationshipId).toBe(relationshipId);
      expect(response.body.task.status).toBe('PENDING');

      taskId = response.body.task.id;
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/tasks/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          relationshipId,
          // 缺少 name
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝无效难度', async () => {
      const response = await request(app)
        .post('/api/tasks/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          relationshipId,
          name: 'Test Task',
          difficulty: 10, // 超出范围
        });

      expect(response.status).toBe(400);
    });

    it('应该拒绝负数奖励', async () => {
      const response = await request(app)
        .post('/api/tasks/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          relationshipId,
          name: 'Test Task',
          rewardConfig: {
            bones: -100,
            fish: 50,
          },
        });

      expect(response.status).toBe(400);
    });

    it('应该拒绝非活跃关系的任务创建', async () => {
      // 创建一个未激活的关系
      const otherUser = {
        username: `other_task_${Date.now()}`,
        email: `other_task_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);

      const relRes = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: otherUser.username,
          mode: 'PARTNER',
        });

      const response = await request(app)
        .post('/api/tasks/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          relationshipId: relRes.body.relationship.id,
          name: 'Test Task',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // 清理
      await prisma.relationship.delete({ where: { id: relRes.body.relationship.id } });
      await prisma.user.delete({ where: { id: otherRes.body.user.id } });
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .post('/api/tasks/create')
        .send({
          relationshipId,
          name: 'Test Task',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tasks/my', () => {
    it('成长者应该能获取任务列表', async () => {
      const response = await request(app)
        .get('/api/tasks/my')
        .set('Authorization', `Bearer ${growerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);

      const task = response.body.tasks.find((t: any) => t.id === taskId);
      expect(task).toBeTruthy();
    });

    it('引导者应该能获取任务列表', async () => {
      const response = await request(app)
        .get('/api/tasks/my')
        .set('Authorization', `Bearer ${guideToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
    });

    it('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/tasks/my?status=PENDING')
        .set('Authorization', `Bearer ${growerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .get('/api/tasks/my');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/tasks/:id/start', () => {
    it('成长者应该能开始任务', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/start`)
        .set('Authorization', `Bearer ${growerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.status).toBe('IN_PROGRESS');
    });

    it('应该拒绝引导者开始任务', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/start`)
        .set('Authorization', `Bearer ${guideToken}`);

      expect(response.status).toBe(403);
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/start`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/tasks/:id/submit', () => {
    it('成长者应该能提交任务', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/submit`)
        .set('Authorization', `Bearer ${growerToken}`)
        .send({
          proofText: '任务已完成',
          proofImages: [],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.status).toBe('PENDING_REVIEW');
    });

    it('应该验证提交内容', async () => {
      // 先重新开始任务
      await request(app)
        .post(`/api/tasks/${taskId}/start`)
        .set('Authorization', `Bearer ${growerToken}`);

      const response = await request(app)
        .post(`/api/tasks/${taskId}/submit`)
        .set('Authorization', `Bearer ${growerToken}`)
        .send({
          // 缺少 proofText
        });

      expect(response.status).toBe(400);
    });

    it('应该拒绝引导者提交任务', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/submit`)
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          proofText: 'Test',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/tasks/:id/review', () => {
    it('引导者应该能审核通过任务', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/review`)
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          approved: true,
          feedback: '完成得很好！',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.status).toBe('COMPLETED');
    });

    it('引导者应该能审核拒绝任务', async () => {
      // 重新开始并提交任务
      await request(app)
        .post(`/api/tasks/${taskId}/start`)
        .set('Authorization', `Bearer ${growerToken}`);

      await request(app)
        .post(`/api/tasks/${taskId}/submit`)
        .set('Authorization', `Bearer ${growerToken}`)
        .send({
          proofText: 'Test',
        });

      const response = await request(app)
        .post(`/api/tasks/${taskId}/review`)
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          approved: false,
          feedback: '需要改进',
        });

      expect(response.status).toBe(200);
      expect(response.body.task.status).toBe('NEEDS_IMPROVEMENT');
    });

    it('应该拒绝成长者审核任务', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/review`)
        .set('Authorization', `Bearer ${growerToken}`)
        .send({
          approved: true,
          feedback: 'Test',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('任务状态流转', () => {
    it('任务应该完整流转：PENDING → IN_PROGRESS → PENDING_REVIEW → COMPLETED', async () => {
      // 创建新任务
      const newTaskRes = await request(app)
        .post('/api/tasks/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          relationshipId,
          name: '状态流转测试',
          difficulty: 1,
          proofType: 'TEXT',
          repeatType: 'ONCE',
        });

      const newTaskId = newTaskRes.body.task.id;
      expect(newTaskRes.body.task.status).toBe('PENDING');

      // 开始任务
      const startRes = await request(app)
        .post(`/api/tasks/${newTaskId}/start`)
        .set('Authorization', `Bearer ${growerToken}`);

      expect(startRes.body.task.status).toBe('IN_PROGRESS');

      // 提交任务
      const submitRes = await request(app)
        .post(`/api/tasks/${newTaskId}/submit`)
        .set('Authorization', `Bearer ${growerToken}`)
        .send({
          proofText: '完成',
        });

      expect(submitRes.body.task.status).toBe('PENDING_REVIEW');

      // 审核通过
      const reviewRes = await request(app)
        .post(`/api/tasks/${newTaskId}/review`)
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          approved: true,
          feedback: '好！',
        });

      expect(reviewRes.body.task.status).toBe('COMPLETED');

      // 清理
      await prisma.task.delete({ where: { id: newTaskId } });
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('应该能获取任务详情', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${guideToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.id).toBe(taskId);
    });

    it('应该拒绝访问他人的任务', async () => {
      const otherUser = {
        username: `other2_task_${Date.now()}`,
        email: `other2_task_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherRes.body.token}`);

      expect(response.status).toBe(403);

      // 清理
      await prisma.user.delete({ where: { id: otherRes.body.user.id } });
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('引导者应该能删除任务', async () => {
      // 创建一个新任务用于删除
      const newTaskRes = await request(app)
        .post('/api/tasks/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          relationshipId,
          name: '待删除任务',
          difficulty: 1,
          proofType: 'TEXT',
          repeatType: 'ONCE',
        });

      const newTaskId = newTaskRes.body.task.id;

      const response = await request(app)
        .delete(`/api/tasks/${newTaskId}`)
        .set('Authorization', `Bearer ${guideToken}`);

      expect(response.status).toBe(200);
    });

    it('应该拒绝成长者删除任务', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${growerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
