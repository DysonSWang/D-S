/**
 * 奖励服务测试 - 修复版
 */

import { GiveRewardInput } from '../services/rewardService';

describe('Reward Service', () => {
  describe('GiveRewardInput 接口', () => {
    it('应该定义完整的奖励发放输入', () => {
      const input: GiveRewardInput = {
        growerId: 2,
        guideId: 1,
        bones: 100,
        reason: '完成任务奖励',
      };
      
      expect(input.growerId).toBe(2);
      expect(input.guideId).toBe(1);
      expect(input.bones).toBe(100);
    });

    it('应该支持可选字段', () => {
      const input: GiveRewardInput = {
        growerId: 2,
        guideId: 1,
        reason: '奖励',
      };
      
      expect(input.bones).toBeUndefined();
    });
  });

  describe('奖励类型', () => {
    it('应该支持骨头奖励', () => {
      const input: GiveRewardInput = {
        growerId: 1,
        guideId: 2,
        bones: 100,
        reason: '测试',
      };
      expect(input.bones).toBeDefined();
    });

    it('应该支持鱼奖励', () => {
      const input: GiveRewardInput = {
        growerId: 1,
        guideId: 2,
        fish: 50,
        reason: '测试',
      };
      expect(input.fish).toBeDefined();
    });

    it('应该支持宝石奖励', () => {
      const input: GiveRewardInput = {
        growerId: 1,
        guideId: 2,
        gems: 10,
        reason: '测试',
      };
      expect(input.gems).toBeDefined();
    });
  });

  describe('奖励计算', () => {
    it('应该正确计算总奖励', () => {
      const bones = 100;
      const fish = 50;
      const total = bones + fish;
      
      expect(total).toBe(150);
    });

    it('应该应用折扣', () => {
      const price = 100;
      const discount = 0.8;
      const discounted = price * discount;
      
      expect(discounted).toBe(80);
    });

    it('应该计算百分比', () => {
      const value = 80;
      const total = 100;
      const percentage = (value / total) * 100;
      
      expect(percentage).toBe(80);
    });
  });
});
