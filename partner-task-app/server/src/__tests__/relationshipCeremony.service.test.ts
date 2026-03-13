/**
 * Relationship Ceremony Service Tests
 * 签约仪式服务层测试
 * 
 * 测试范围:
 * - 协议模板管理
 * - 签约仪式创建
 * - 签名验证
 * - 证书生成
 * - 签约日记
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db';
import * as ceremonyService from '../services/relationshipCeremony.service';

// Mock prisma
vi.mock('../db', () => ({
  prisma: {
    relationshipCeremony: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    ceremonySignature: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    ceremonyJournal: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn) => fn(prisma)),
  },
}));

describe('Relationship Ceremony Service', () => {
  const mockRelationship = {
    id: 1,
    guideId: 1,
    growerId: 2,
    status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAgreementTemplates', () => {
    it('应该返回所有协议模板', () => {
      const templates = ceremonyService.getAgreementTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('模板应该包含必要字段', () => {
      const templates = ceremonyService.getAgreementTemplates();

      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('icon');
        expect(template).toHaveProperty('content');
      });
    });

    it('应该包含标准伙伴协议', () => {
      const templates = ceremonyService.getAgreementTemplates();
      const standard = templates.find((t) => t.id === 'standard');

      expect(standard).toBeTruthy();
      expect(standard?.name).toBe('标准伙伴协议');
    });

    it('应该包含情侣成长协议', () => {
      const templates = ceremonyService.getAgreementTemplates();
      const couple = templates.find((t) => t.id === 'couple');

      expect(couple).toBeTruthy();
      expect(couple?.name).toBe('情侣成长协议');
    });

    it('应该包含亲子成长协议', () => {
      const templates = ceremonyService.getAgreementTemplates();
      const parentChild = templates.find((t) => t.id === 'parent_child');

      expect(parentChild).toBeTruthy();
      expect(parentChild?.name).toBe('亲子成长协议');
    });

    it('应该包含友谊成长协议', () => {
      const templates = ceremonyService.getAgreementTemplates();
      const friend = templates.find((t) => t.id === 'friend');

      expect(friend).toBeTruthy();
      expect(friend?.name).toBe('友谊成长协议');
    });

    it('应该包含健身打卡协议', () => {
      const templates = ceremonyService.getAgreementTemplates();
      const fitness = templates.find((t) => t.id === 'fitness');

      expect(fitness).toBeTruthy();
      expect(fitness?.name).toBe('健身打卡协议');
    });

    it('模板内容应该不为空', () => {
      const templates = ceremonyService.getAgreementTemplates();

      templates.forEach((template) => {
        expect(template.content).toBeTruthy();
        expect(template.content.length).toBeGreaterThan(10);
      });
    });
  });

  describe('createCeremony', () => {
    const ceremonyData = {
      relationshipId: 1,
      agreementId: 'standard',
      customContent: null,
    };

    it('应该成功创建签约仪式', async () => {
      const mockCeremony = {
        id: 1,
        relationshipId: 1,
        agreementId: 'standard',
        status: 'PENDING',
        createdAt: new Date(),
      };

      (prisma.relationshipCeremony.create as any).mockResolvedValue(mockCeremony);

      const result = await ceremonyService.createCeremony(ceremonyData);

      expect(result).toEqual(mockCeremony);
      expect(prisma.relationshipCeremony.create).toHaveBeenCalledWith({
        data: {
          relationshipId: 1,
          agreementId: 'standard',
          customContent: null,
          status: 'PENDING',
        },
      });
    });

    it('应该支持自定义协议内容', async () => {
      const customCeremonyData = {
        relationshipId: 1,
        agreementId: 'custom',
        customContent: '这是自定义协议内容',
      };

      const mockCeremony = {
        id: 1,
        relationshipId: 1,
        agreementId: 'custom',
        customContent: '这是自定义协议内容',
        status: 'PENDING',
        createdAt: new Date(),
      };

      (prisma.relationshipCeremony.create as any).mockResolvedValue(mockCeremony);

      const result = await ceremonyService.createCeremony(customCeremonyData);

      expect(result.customContent).toBe('这是自定义协议内容');
      expect(prisma.relationshipCeremony.create).toHaveBeenCalledWith({
        data: {
          relationshipId: 1,
          agreementId: 'custom',
          customContent: '这是自定义协议内容',
          status: 'PENDING',
        },
      });
    });

    it('应该验证关系 ID', async () => {
      const invalidData = {
        relationshipId: 0,
        agreementId: 'standard',
      };

      await expect(ceremonyService.createCeremony(invalidData)).rejects.toThrow();
    });

    it('应该验证协议模板 ID', async () => {
      const invalidData = {
        relationshipId: 1,
        agreementId: 'invalid_template',
      };

      await expect(ceremonyService.createCeremony(invalidData)).rejects.toThrow();
    });

    it('应该处理数据库错误', async () => {
      (prisma.relationshipCeremony.create as any).mockRejectedValue(
        new Error('Database error')
      );

      await expect(ceremonyService.createCeremony(ceremonyData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('addSignature', () => {
    const signatureData = {
      ceremonyId: 1,
      userId: 1,
      signatureImage: 'data:image/png;base64,...',
    };

    it('应该成功添加签名', async () => {
      const mockSignature = {
        id: 1,
        ceremonyId: 1,
        userId: 1,
        signatureImage: 'data:image/png;base64,...',
        signedAt: new Date(),
      };

      (prisma.ceremonySignature.create as any).mockResolvedValue(mockSignature);

      const result = await ceremonyService.addSignature(signatureData);

      expect(result).toEqual(mockSignature);
      expect(prisma.ceremonySignature.create).toHaveBeenCalledWith({
        data: signatureData,
      });
    });

    it('应该验证签名图片', async () => {
      const invalidData = {
        ceremonyId: 1,
        userId: 1,
        signatureImage: '',
      };

      await expect(ceremonyService.addSignature(invalidData)).rejects.toThrow();
    });

    it('应该验证仪式 ID', async () => {
      const invalidData = {
        ceremonyId: 0,
        userId: 1,
        signatureImage: 'data:image/png;base64,...',
      };

      await expect(ceremonyService.addSignature(invalidData)).rejects.toThrow();
    });
  });

  describe('completeCeremony', () => {
    it('应该完成签约仪式', async () => {
      const mockCeremony = {
        id: 1,
        relationshipId: 1,
        status: 'COMPLETED',
        completedAt: new Date(),
      };

      (prisma.relationshipCeremony.update as any).mockResolvedValue(mockCeremony);

      const result = await ceremonyService.completeCeremony(1);

      expect(result.status).toBe('COMPLETED');
      expect(prisma.relationshipCeremony.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'COMPLETED' },
      });
    });

    it('应该验证仪式 ID', async () => {
      await expect(ceremonyService.completeCeremony(0)).rejects.toThrow();
    });

    it('应该处理不存在的仪式', async () => {
      (prisma.relationshipCeremony.update as any).mockRejectedValue(
        new Error('Ceremony not found')
      );

      await expect(ceremonyService.completeCeremony(999)).rejects.toThrow(
        'Ceremony not found'
      );
    });
  });

  describe('getCeremonyByRelationship', () => {
    it('应该获取关系的仪式信息', async () => {
      const mockCeremony = {
        id: 1,
        relationshipId: 1,
        status: 'COMPLETED',
        signatures: [],
      };

      (prisma.relationshipCeremony.findMany as any).mockResolvedValue([mockCeremony]);

      const result = await ceremonyService.getCeremonyByRelationship(1);

      expect(result).toEqual([mockCeremony]);
      expect(prisma.relationshipCeremony.findMany).toHaveBeenCalledWith({
        where: { relationshipId: 1 },
        include: {
          signatures: true,
          journals: true,
        },
      });
    });

    it('应该返回空数组当没有仪式', async () => {
      (prisma.relationshipCeremony.findMany as any).mockResolvedValue([]);

      const result = await ceremonyService.getCeremonyByRelationship(1);

      expect(result).toEqual([]);
    });
  });

  describe('addJournal', () => {
    const journalData = {
      ceremonyId: 1,
      userId: 1,
      content: '今天的签约仪式很有意义',
    };

    it('应该成功添加日记', async () => {
      const mockJournal = {
        id: 1,
        ceremonyId: 1,
        userId: 1,
        content: '今天的签约仪式很有意义',
        createdAt: new Date(),
      };

      (prisma.ceremonyJournal.create as any).mockResolvedValue(mockJournal);

      const result = await ceremonyService.addJournal(journalData);

      expect(result).toEqual(mockJournal);
      expect(prisma.ceremonyJournal.create).toHaveBeenCalledWith({
        data: journalData,
      });
    });

    it('应该验证日记内容', async () => {
      const invalidData = {
        ceremonyId: 1,
        userId: 1,
        content: '',
      };

      await expect(ceremonyService.addJournal(invalidData)).rejects.toThrow();
    });

    it('应该验证内容长度', async () => {
      const invalidData = {
        ceremonyId: 1,
        userId: 1,
        content: '太短',
      };

      await expect(ceremonyService.addJournal(invalidData)).rejects.toThrow();
    });
  });

  describe('边界条件测试', () => {
    it('应该处理超长自定义内容', async () => {
      const longContent = 'A'.repeat(10000);
      const ceremonyData = {
        relationshipId: 1,
        agreementId: 'custom',
        customContent: longContent,
      };

      const mockCeremony = {
        id: 1,
        relationshipId: 1,
        agreementId: 'custom',
        customContent: longContent,
        status: 'PENDING',
        createdAt: new Date(),
      };

      (prisma.relationshipCeremony.create as any).mockResolvedValue(mockCeremony);

      const result = await ceremonyService.createCeremony(ceremonyData);

      expect(result.customContent).toBe(longContent);
    });

    it('应该处理特殊字符内容', async () => {
      const specialContent = 'Special chars: <>&"\' 你好世界 🎉';
      const ceremonyData = {
        relationshipId: 1,
        agreementId: 'custom',
        customContent: specialContent,
      };

      const mockCeremony = {
        id: 1,
        relationshipId: 1,
        agreementId: 'custom',
        customContent: specialContent,
        status: 'PENDING',
        createdAt: new Date(),
      };

      (prisma.relationshipCeremony.create as any).mockResolvedValue(mockCeremony);

      const result = await ceremonyService.createCeremony(ceremonyData);

      expect(result.customContent).toBe(specialContent);
    });
  });

  describe('事务处理', () => {
    it('应该使用事务创建仪式和签名', async () => {
      const ceremonyData = {
        relationshipId: 1,
        agreementId: 'standard',
      };

      const signatureData = {
        ceremonyId: 1,
        userId: 1,
        signatureImage: 'data:image/png;base64,...',
      };

      // Mock transaction
      (prisma.$transaction as any).mockImplementation(async (fn) => {
        await ceremonyService.createCeremony(ceremonyData);
        await ceremonyService.addSignature(signatureData);
        return { success: true };
      });

      const result = await prisma.$transaction(async () => {
        const ceremony = await ceremonyService.createCeremony(ceremonyData);
        const signature = await ceremonyService.addSignature(signatureData);
        return { ceremony, signature };
      });

      expect(result).toHaveProperty('ceremony');
      expect(result).toHaveProperty('signature');
    });
  });
});
