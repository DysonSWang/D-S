/**
 * Achievements API Integration Tests
 * 成就 API 集成测试
 * 
 * 测试范围:
 * - 成就列表查询
 * - 成就解锁
 * - 成就进度追踪
 * - 成就分类
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth';
import achievementRoutes from '../routes/achievements';
import { prisma } from '../db';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/achievements', achievementRoutes);

describe('Achievements API', () => {
  let userToken: string;
  let userId: number;

  const testUser = {
    username: `achievement_test_${Date.now()}`,
    email: `achievement_test_${Date.now()}@example.com`,
    password: 'Test123456!',
    role: 'GROWER' as const,
  };

  // 创建测试用户
  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    userToken = response.body.token;
    userId = response.body.user.id;
  });

  // 清理测试数据
  afterAll(async () => {
    try {
      await prisma.userAchievement.deleteMany({
        where: { userId },
      });
      await prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('GET /api/achievements/list', () => {
    it('应该返回成就列表', async () => {
      const response = await request(app)
        .get('/api/achievements/list')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('achievements');
      expect(Array.isArray(response.body.achievements)).toBe(true);
    });

    it('成就应该包含必要字段', async () => {
      const response = await request(app)
        .get('/api/achievements/list')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.body.achievements.length > 0) {
        const achievement = response.body.achievements[0];
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('difficulty');
      }
    });

    it('成就应该按分类组织', async () => {
      const response = await request(app)
        .get('/api/achievements/list')
        .set('Authorization', `Bearer ${userToken}`);

      const categories = new Set(
        response.body.achievements.map((a: any) => a.category)
      );
      expect(categories.size).toBeGreaterThan(0);
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .get('/api/achievements/list');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/achievements/my', () => {
    it('应该返回用户成就列表', async () => {
      const response = await request(app)
        .get('/api/achievements/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('achievements');
      expect(Array.isArray(response.body.achievements)).toBe(true);
    });

    it('用户成就应该包含解锁状态', async () => {
      const response = await request(app)
        .get('/api/achievements/my')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.body.achievements.length > 0) {
        const achievement = response.body.achievements[0];
        expect(achievement).toHaveProperty('unlocked');
        expect(achievement).toHaveProperty('progress');
        expect(achievement).toHaveProperty('unlockedAt');
      }
    });

    it('应该区分已解锁和未解锁成就', async () => {
      const response = await request(app)
        .get('/api/achievements/my')
        .set('Authorization', `Bearer ${userToken}`);

      const unlocked = response.body.achievements.filter((a: any) => a.unlocked);
      const locked = response.body.achievements.filter((a: any) => !a.unlocked);

      // 至少应该有未解锁的成就
      expect(locked.length).toBeGreaterThan(0);
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .get('/api/achievements/my');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/achievements/stats', () => {
    it('应该返回成就统计', async () => {
      const response = await request(app)
        .get('/api/achievements/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('total');
      expect(response.body.stats).toHaveProperty('unlocked');
      expect(response.body.stats).toHaveProperty('progress');
    });

    it('统计应该包含完成率', async () => {
      const response = await request(app)
        .get('/api/achievements/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.body.stats).toHaveProperty('completionRate');
      expect(typeof response.body.stats.completionRate).toBe('number');
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .get('/api/achievements/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('成就进度追踪', () => {
    it('新用户应该从 0 进度开始', async () => {
      const response = await request(app)
        .get('/api/achievements/my')
        .set('Authorization', `Bearer ${userToken}`);

      // 所有成就的进度应该都是 0 或很低
      const achievements = response.body.achievements;
      if (achievements.length > 0) {
        const avgProgress = achievements.reduce(
          (sum: number, a: any) => sum + (a.progress || 0),
          0
        ) / achievements.length;
        expect(avgProgress).toBeLessThan(50); // 新用户进度应该低于 50%
      }
    });
  });

  describe('成就分类筛选', () => {
    it('应该支持按分类筛选成就', async () => {
      // 先获取所有成就以确定分类
      const allResponse = await request(app)
        .get('/api/achievements/list')
        .set('Authorization', `Bearer ${userToken}`);

      if (allResponse.body.achievements.length > 0) {
        const category = allResponse.body.achievements[0].category;

        const response = await request(app)
          .get(`/api/achievements/list?category=${category}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('achievements');
        
        // 所有返回的成就都应该是指定分类
        response.body.achievements.forEach((a: any) => {
          expect(a.category).toBe(category);
        });
      }
    });

    it('应该支持按难度筛选成就', async () => {
      const response = await request(app)
        .get('/api/achievements/list?difficulty=1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('achievements');
    });
  });

  describe('成就解锁条件', () => {
    it('应该有不同难度的成就', async () => {
      const response = await request(app)
        .get('/api/achievements/list')
        .set('Authorization', `Bearer ${userToken}`);

      const difficulties = new Set(
        response.body.achievements.map((a: any) => a.difficulty)
      );
      
      // 应该有多个难度等级
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    });

    it('高难度成就应该有更详细的描述', async () => {
      const response = await request(app)
        .get('/api/achievements/list')
        .set('Authorization', `Bearer ${userToken}`);

      const hardAchievements = response.body.achievements.filter(
        (a: any) => a.difficulty >= 3
      );

      if (hardAchievements.length > 0) {
        const hardAchievement = hardAchievements[0];
        expect(hardAchievement.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('边界条件测试', () => {
    it('应该处理无效的 category 参数', async () => {
      const response = await request(app)
        .get('/api/achievements/list?category=INVALID_CATEGORY')
        .set('Authorization', `Bearer ${userToken}`);

      // 应该返回空列表或不报错
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('achievements');
    });

    it('应该处理无效的 difficulty 参数', async () => {
      const response = await request(app)
        .get('/api/achievements/list?difficulty=999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('性能测试', () => {
    it('成就列表 API 应在 500ms 内响应', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/achievements/list')
        .set('Authorization', `Bearer ${userToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
      expect(response.status).toBe(200);
    });

    it('我的成就 API 应在 500ms 内响应', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/achievements/my')
        .set('Authorization', `Bearer ${userToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
      expect(response.status).toBe(200);
    });
  });
});
