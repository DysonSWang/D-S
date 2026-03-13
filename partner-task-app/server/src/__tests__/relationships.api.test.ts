/**
 * Relationships API Integration Tests
 * 关系 API 集成测试
 * 
 * 测试范围:
 * - 创建关系
 * - 接受邀请
 * - 关系状态流转
 * - 关系列表查询
 * - 权限验证
 */

import request from 'supertest';
import { app } from '../index';
import { prisma } from '../db';

describe('Relationships API', () => {
  let guideToken: string;
  let growerToken: string;
  let guideId: number;
  let growerId: number;
  let relationshipId: number;

  // 测试用户
  const guideUser = {
    username: `guide_test_${Date.now()}`,
    email: `guide_test_${Date.now()}@example.com`,
    password: 'Test123456!',
    role: 'GUIDE' as const,
  };

  const growerUser = {
    username: `grower_test_${Date.now()}`,
    email: `grower_test_${Date.now()}@example.com`,
    password: 'Test123456!',
    role: 'GROWER' as const,
  };

  // 创建测试用户
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
  });

  // 清理测试数据
  afterAll(async () => {
    try {
      await prisma.relationship.deleteMany({
        where: {
          OR: [
            { guideId },
            { growerId },
          ],
        },
      });
      await prisma.user.deleteMany({
        where: {
          OR: [
            { id: guideId },
            { id: growerId },
          ],
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('POST /api/relationships/create', () => {
    it('应该成功创建关系邀请', async () => {
      const response = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: growerUser.username,
          mode: 'PARTNER',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('relationship');
      expect(response.body.relationship).toHaveProperty('id');
      expect(response.body.relationship.guideId).toBe(guideId);
      expect(response.body.relationship.status).toBe('PENDING');

      relationshipId = response.body.relationship.id;
    });

    it('应该拒绝重复创建关系', async () => {
      const response = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: growerUser.username,
          mode: 'PARTNER',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝向自己发送邀请', async () => {
      const response = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: guideUser.username,
          mode: 'PARTNER',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: 'nonexistent_user',
          mode: 'PARTNER',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .post('/api/relationships/create')
        .send({
          inviteeUsername: growerUser.username,
          mode: 'PARTNER',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/relationships/my', () => {
    it('成长者应该能获取关系列表', async () => {
      const response = await request(app)
        .get('/api/relationships/my')
        .set('Authorization', `Bearer ${growerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('relationships');
      expect(Array.isArray(response.body.relationships)).toBe(true);
      
      const relationship = response.body.relationships.find(
        (r: any) => r.id === relationshipId
      );
      expect(relationship).toBeTruthy();
      expect(relationship.status).toBe('PENDING');
    });

    it('引导者应该能获取关系列表', async () => {
      const response = await request(app)
        .get('/api/relationships/my')
        .set('Authorization', `Bearer ${guideToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('relationships');
      
      const relationship = response.body.relationships.find(
        (r: any) => r.id === relationshipId
      );
      expect(relationship).toBeTruthy();
    });

    it('应该拒绝未授权访问', async () => {
      const response = await request(app)
        .get('/api/relationships/my');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/relationships/accept', () => {
    it('成长者应该能接受邀请', async () => {
      const response = await request(app)
        .post(`/api/relationships/${relationshipId}/accept`)
        .set('Authorization', `Bearer ${growerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('relationship');
      expect(response.body.relationship.status).toBe('ACTIVE');
    });

    it('应该拒绝重复接受', async () => {
      const response = await request(app)
        .post(`/api/relationships/${relationshipId}/accept`)
        .set('Authorization', `Bearer ${growerToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该拒绝非邀请对象接受', async () => {
      // 创建另一个用户
      const otherUser = {
        username: `other_test_${Date.now()}`,
        email: `other_test_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);
      const otherToken = otherRes.body.token;

      // 尝试接受不属于自己的邀请
      const response = await request(app)
        .post(`/api/relationships/${relationshipId}/accept`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');

      // 清理
      await prisma.user.delete({ where: { id: otherRes.body.user.id } });
    });
  });

  describe('GET /api/relationships/:id', () => {
    it('应该能获取关系详情', async () => {
      const response = await request(app)
        .get(`/api/relationships/${relationshipId}`)
        .set('Authorization', `Bearer ${guideToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('relationship');
      expect(response.body.relationship.id).toBe(relationshipId);
      expect(response.body.relationship.status).toBe('ACTIVE');
    });

    it('应该拒绝访问他人的关系', async () => {
      // 创建另一个用户
      const otherUser = {
        username: `other2_test_${Date.now()}`,
        email: `other2_test_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const otherRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);
      const otherToken = otherRes.body.token;

      const response = await request(app)
        .get(`/api/relationships/${relationshipId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');

      // 清理
      await prisma.user.delete({ where: { id: otherRes.body.user.id } });
    });
  });

  describe('关系状态流转', () => {
    it('关系应该从 PENDING 流转到 ACTIVE', async () => {
      // 创建新关系
      const newGrower = {
        username: `new_grower_${Date.now()}`,
        email: `new_grower_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const growerRes = await request(app)
        .post('/api/auth/register')
        .send(newGrower);
      const newGrowerToken = growerRes.body.token;

      // 创建邀请
      const createRes = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: newGrower.username,
          mode: 'PARTNER',
        });

      expect(createRes.body.relationship.status).toBe('PENDING');

      // 接受邀请
      const acceptRes = await request(app)
        .post(`/api/relationships/${createRes.body.relationship.id}/accept`)
        .set('Authorization', `Bearer ${newGrowerToken}`);

      expect(acceptRes.body.relationship.status).toBe('ACTIVE');

      // 清理
      await prisma.relationship.delete({
        where: { id: createRes.body.relationship.id },
      });
      await prisma.user.delete({ where: { id: growerRes.body.user.id } });
    });
  });

  describe('边界条件测试', () => {
    it('应该处理特殊字符用户名', async () => {
      const specialUser = {
        username: `special_user_${Date.now()}`,
        email: `special_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'GROWER',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(specialUser);

      expect(response.status).toBe(200);

      // 尝试创建关系
      const relResponse = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: specialUser.username,
          mode: 'PARTNER',
        });

      expect(relResponse.status).toBe(200);

      // 清理
      await prisma.relationship.delete({ where: { id: relResponse.body.relationship.id } });
      await prisma.user.delete({ where: { id: response.body.user.id } });
    });

    it('应该拒绝空用户名', async () => {
      const response = await request(app)
        .post('/api/relationships/create')
        .set('Authorization', `Bearer ${guideToken}`)
        .send({
          inviteeUsername: '',
          mode: 'PARTNER',
        });

      expect(response.status).toBe(400);
    });
  });
});
