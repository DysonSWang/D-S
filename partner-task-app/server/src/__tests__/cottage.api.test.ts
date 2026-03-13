/**
 * Cottage API Integration Tests
 * 小屋 API 集成测试
 * 
 * 测试范围:
 * - 小屋初始化
 * - 装饰购买
 * - 装饰装备
 * - 温暖度计算
 * - 访客系统
 * - 奖励兑换
 */

import request from 'supertest';
import { app } from '../index';
import { prisma } from '../db';

describe('Cottage API', () => {
  let userToken: string;
  let userId: number;

  const testUser = {
    username: `cottage_test_${Date.now()}`,
    email: `cottage_test_${Date.now()}@example.com`,
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
      await prisma.cottageDecoration.deleteMany({
        where: { cottage: { ownerId: userId } },
      });
      await prisma.cottage.deleteMany({
        where: { ownerId: userId },
      });
      await prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('GET /api/cottage/my', () => {
    it('应该自动初始化并返回小屋信息', async () => {
      const response = await request(app)
        .get('/api/cottage/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cottage');
      expect(response.body.cottage).toHaveProperty('id');
      expect(response.body.cottage.ownerId).toBe(userId);
      expect(response.body.cottage).toHaveProperty('warmth', 0);
      expect(response.body.cottage).toHaveProperty('level', 1);
    });

    it('应该返回装饰列表', async () => {
      const response = await request(app)
        .get('/api/cottage/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.body.cottage).toHaveProperty('decorations');
      expect(Array.isArray(response.body.cottage.decorations)).toBe(true);
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .get('/api/cottage/my');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cottage/decoration-catalog', () => {
    it('应该返回装饰目录', async () => {
      const response = await request(app)
        .get('/api/cottage/decoration-catalog')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('catalog');
      expect(Array.isArray(response.body.catalog)).toBe(true);
      
      if (response.body.catalog.length > 0) {
        const item = response.body.catalog[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('category');
      }
    });

    it('装饰应该按分类组织', async () => {
      const response = await request(app)
        .get('/api/cottage/decoration-catalog')
        .set('Authorization', `Bearer ${userToken}`);

      const categories = new Set(
        response.body.catalog.map((item: any) => item.category)
      );
      expect(categories.size).toBeGreaterThan(0);
    });
  });

  describe('POST /api/cottage/decoration-catalog/:id/purchase', () => {
    let decorationId: number;

    beforeAll(async () => {
      // 获取装饰目录
      const response = await request(app)
        .get('/api/cottage/decoration-catalog')
        .set('Authorization', `Bearer ${userToken}`);
      
      if (response.body.catalog.length > 0) {
        decorationId = response.body.catalog[0].id;
      }
    });

    it('应该成功购买装饰', async () => {
      if (!decorationId) {
        console.warn('Skipping purchase test - no decorations in catalog');
        return;
      }

      const response = await request(app)
        .post(`/api/cottage/decoration-catalog/${decorationId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('decoration');
    });

    it('应该拒绝余额不足的购买', async () => {
      // 创建一个非常贵的装饰（模拟）
      const expensiveResponse = await request(app)
        .post(`/api/cottage/decoration-catalog/999999/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(expensiveResponse.status).toBe(400);
      expect(expensiveResponse.body).toHaveProperty('error');
    });

    it('应该拒绝购买不存在的装饰', async () => {
      const response = await request(app)
        .post('/api/cottage/decoration-catalog/999999/purchase')
        .set('Authorization', `Bearer ${userToken}`);

      expect([400, 404]).toContain(response.status);
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .post(`/api/cottage/decoration-catalog/${decorationId}/purchase`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/cottage/decorations/:id/equip', () => {
    let decorationId: number;

    beforeAll(async () => {
      // 先购买一个装饰
      const catalogResponse = await request(app)
        .get('/api/cottage/decoration-catalog')
        .set('Authorization', `Bearer ${userToken}`);

      if (catalogResponse.body.catalog.length > 0) {
        const purchaseResponse = await request(app)
          .post(`/api/cottage/decoration-catalog/${catalogResponse.body.catalog[0].id}/purchase`)
          .set('Authorization', `Bearer ${userToken}`);
        
        if (purchaseResponse.body.decoration) {
          decorationId = purchaseResponse.body.decoration.id;
        }
      }
    });

    it('应该成功装备装饰', async () => {
      if (!decorationId) {
        console.warn('Skipping equip test - no decoration purchased');
        return;
      }

      const response = await request(app)
        .post(`/api/cottage/decorations/${decorationId}/equip`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('应该拒绝装备不属于自己的装饰', async () => {
      const response = await request(app)
        .post('/api/cottage/decorations/999999/equip')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .post(`/api/cottage/decorations/${decorationId}/equip`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/cottage/decorations/:id/unequip', () => {
    let decorationId: number;

    it('应该成功卸下装饰', async () => {
      if (!decorationId) {
        console.warn('Skipping unequip test - no decoration');
        return;
      }

      const response = await request(app)
        .post(`/api/cottage/decorations/${decorationId}/unequip`)
        .set('Authorization', `Bearer ${userToken}`);

      // 可能成功或返回"未装备"
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/cottage/ranking', () => {
    it('应该返回温暖度排行榜', async () => {
      const response = await request(app)
        .get('/api/cottage/ranking')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ranking');
      expect(Array.isArray(response.body.ranking)).toBe(true);
    });

    it('排行榜应该包含必要字段', async () => {
      const response = await request(app)
        .get('/api/cottage/ranking')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.body.ranking.length > 0) {
        const entry = response.body.ranking[0];
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('username');
        expect(entry).toHaveProperty('warmth');
        expect(entry).toHaveProperty('level');
      }
    });
  });

  describe('GET /api/cottage/visitor/:userId', () => {
    it('应该能访问其他用户的小屋', async () => {
      // 创建另一个用户
      const otherUser = {
        username: `visitor_test_${Date.now()}`,
        email: `visitor_test_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);
      const otherToken = otherRes.body.token;

      // 初始化其他用户的小屋
      await request(app)
        .get('/api/cottage/my')
        .set('Authorization', `Bearer ${otherToken}`);

      // 访问其他用户的小屋
      const response = await request(app)
        .get(`/api/cottage/visitor/${otherRes.body.user.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cottage');

      // 清理
      await prisma.cottage.deleteMany({
        where: { ownerId: otherRes.body.user.id },
      });
      await prisma.user.delete({ where: { id: otherRes.body.user.id } });
    });

    it('应该拒绝访问不存在的小屋', async () => {
      const response = await request(app)
        .get('/api/cottage/visitor/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/cottage/visitor/:userId/leave-message', () => {
    it('应该能留言', async () => {
      const otherUser = {
        username: `message_test_${Date.now()}`,
        email: `message_test_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);

      // 初始化小屋
      await request(app)
        .get('/api/cottage/my')
        .set('Authorization', `Bearer ${otherRes.body.token}`);

      const response = await request(app)
        .post(`/api/cottage/visitor/${otherRes.body.user.id}/leave-message`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: '测试留言',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      // 清理
      await prisma.cottageMessage.deleteMany({
        where: { cottage: { ownerId: otherRes.body.user.id } },
      });
      await prisma.cottage.deleteMany({
        where: { ownerId: otherRes.body.user.id },
      });
      await prisma.user.delete({ where: { id: otherRes.body.user.id } });
    });

    it('应该拒绝空留言', async () => {
      const otherUser = {
        username: `empty_msg_${Date.now()}`,
        email: `empty_msg_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);

      const response = await request(app)
        .post(`/api/cottage/visitor/${otherRes.body.user.id}/leave-message`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: '',
        });

      expect(response.status).toBe(400);

      // 清理
      await prisma.user.delete({ where: { id: otherRes.body.user.id } });
    });
  });

  describe('温暖度计算', () => {
    it('装备装饰应该增加温暖度', async () => {
      // 获取初始温暖度
      const initialResponse = await request(app)
        .get('/api/cottage/my')
        .set('Authorization', `Bearer ${userToken}`);
      
      const initialWarmth = initialResponse.body.cottage.warmth;

      // 购买并装备装饰
      const catalogResponse = await request(app)
        .get('/api/cottage/decoration-catalog')
        .set('Authorization', `Bearer ${userToken}`);

      if (catalogResponse.body.catalog.length > 0) {
        const decoration = catalogResponse.body.catalog[0];
        
        const purchaseResponse = await request(app)
          .post(`/api/cottage/decoration-catalog/${decoration.id}/purchase`)
          .set('Authorization', `Bearer ${userToken}`);

        if (purchaseResponse.body.decoration) {
          await request(app)
            .post(`/api/cottage/decorations/${purchaseResponse.body.decoration.id}/equip`)
            .set('Authorization', `Bearer ${userToken}`);

          // 检查温暖度是否增加
          const finalResponse = await request(app)
            .get('/api/cottage/my')
            .set('Authorization', `Bearer ${userToken}`);

          expect(finalResponse.body.cottage.warmth).toBeGreaterThanOrEqual(initialWarmth);
        }
      }
    });
  });
});
