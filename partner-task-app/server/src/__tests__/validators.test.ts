/**
 * 验证器测试
 * 测试 Zod 验证器
 */

import { z } from 'zod';

describe('Validators', () => {
  describe('User Validator', () => {
    const userSchema = z.object({
      username: z.string().min(3).max(20),
      password: z.string().min(6),
      nickname: z.string().optional(),
    });

    it('应该验证有效的用户数据', () => {
      const valid = {
        username: 'testuser',
        password: 'password123',
        nickname: '测试',
      };
      
      expect(() => userSchema.parse(valid)).not.toThrow();
    });

    it('应该拒绝过短的用户名', () => {
      const invalid = {
        username: 'ab',
        password: 'password123',
      };
      
      expect(() => userSchema.parse(invalid)).toThrow();
    });

    it('应该拒绝过短的密码', () => {
      const invalid = {
        username: 'testuser',
        password: '123',
      };
      
      expect(() => userSchema.parse(invalid)).toThrow();
    });
  });

  describe('Task Validator', () => {
    const taskSchema = z.object({
      title: z.string().min(1).max(100),
      description: z.string().optional(),
      type: z.enum(['DAILY', 'WEEKLY', 'CHALLENGE']),
    });

    it('应该验证有效的任务数据', () => {
      const valid = {
        title: '测试任务',
        description: '描述',
        type: 'DAILY' as const,
      };
      
      expect(() => taskSchema.parse(valid)).not.toThrow();
    });

    it('应该拒绝空标题', () => {
      const invalid = {
        title: '',
        type: 'DAILY' as const,
      };
      
      expect(() => taskSchema.parse(invalid)).toThrow();
    });

    it('应该拒绝无效的类型', () => {
      const invalid = {
        title: '测试任务',
        type: 'INVALID',
      };
      
      expect(() => taskSchema.parse(invalid)).toThrow();
    });
  });

  describe('Reward Validator', () => {
    const rewardSchema = z.object({
      name: z.string().min(1).max(50),
      price: z.number().positive(),
      stock: z.number().int().nonnegative(),
    });

    it('应该验证有效的奖励数据', () => {
      const valid = {
        name: '测试奖励',
        price: 100,
        stock: 50,
      };
      
      expect(() => rewardSchema.parse(valid)).not.toThrow();
    });

    it('应该拒绝负价格', () => {
      const invalid = {
        name: '测试奖励',
        price: -100,
        stock: 50,
      };
      
      expect(() => rewardSchema.parse(invalid)).toThrow();
    });

    it('应该拒绝负库存', () => {
      const invalid = {
        name: '测试奖励',
        price: 100,
        stock: -1,
      };
      
      expect(() => rewardSchema.parse(invalid)).toThrow();
    });
  });
});
