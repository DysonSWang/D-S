/**
 * Task Template Service Tests
 * 任务模板服务层测试
 * 
 * 测试范围:
 * - 模板创建
 * - 模板应用
 * - 模板分类
 * - 模板搜索
 * - 模板统计
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../db';
import * as taskTemplateService from '../services/taskTemplate.service';

// Mock prisma
vi.mock('../db', () => ({
  prisma: {
    taskTemplate: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(async (fn) => fn(prisma)),
  },
}));

describe('Task Template Service', () => {
  const mockTemplate = {
    id: 1,
    name: '每日打卡模板',
    description: '用于日常任务打卡',
    category: 'DAILY',
    difficulty: 2,
    defaultReward: { bones: 100, fish: 50 },
    proofType: 'TEXT',
    repeatType: 'DAILY',
    isPublic: true,
    createdBy: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTemplate', () => {
    const templateData = {
      name: '新模板',
      description: '测试模板',
      category: 'DAILY',
      difficulty: 2,
      defaultReward: { bones: 100, fish: 50 },
      proofType: 'TEXT',
      repeatType: 'DAILY',
      isPublic: false,
      createdBy: 1,
    };

    it('应该成功创建模板', async () => {
      (prisma.taskTemplate.create as any).mockResolvedValue(mockTemplate);

      const result = await taskTemplateService.createTemplate(templateData);

      expect(result).toEqual(mockTemplate);
      expect(prisma.taskTemplate.create).toHaveBeenCalledWith({
        data: templateData,
      });
    });

    it('应该验证模板名称', async () => {
      const invalidData = {
        ...templateData,
        name: '',
      };

      await expect(taskTemplateService.createTemplate(invalidData)).rejects.toThrow();
    });

    it('应该验证难度范围', async () => {
      const invalidData = {
        ...templateData,
        difficulty: 10, // 超出范围
      };

      await expect(taskTemplateService.createTemplate(invalidData)).rejects.toThrow();
    });

    it('应该验证奖励配置', async () => {
      const invalidData = {
        ...templateData,
        defaultReward: { bones: -100, fish: 50 },
      };

      await expect(taskTemplateService.createTemplate(invalidData)).rejects.toThrow();
    });

    it('应该支持公开模板', async () => {
      const publicTemplate = {
        ...templateData,
        isPublic: true,
      };

      (prisma.taskTemplate.create as any).mockResolvedValue({
        ...mockTemplate,
        isPublic: true,
      });

      const result = await taskTemplateService.createTemplate(publicTemplate);

      expect(result.isPublic).toBe(true);
    });

    it('应该支持私有模板', async () => {
      const privateTemplate = {
        ...templateData,
        isPublic: false,
      };

      (prisma.taskTemplate.create as any).mockResolvedValue({
        ...mockTemplate,
        isPublic: false,
      });

      const result = await taskTemplateService.createTemplate(privateTemplate);

      expect(result.isPublic).toBe(false);
    });
  });

  describe('getTemplateById', () => {
    it('应该获取模板详情', async () => {
      (prisma.taskTemplate.findUnique as any).mockResolvedValue(mockTemplate);

      const result = await taskTemplateService.getTemplateById(1);

      expect(result).toEqual(mockTemplate);
      expect(prisma.taskTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('应该返回 null 当模板不存在', async () => {
      (prisma.taskTemplate.findUnique as any).mockResolvedValue(null);

      const result = await taskTemplateService.getTemplateById(999);

      expect(result).toBeNull();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('应该按分类获取模板列表', async () => {
      const mockTemplates = [
        { ...mockTemplate, id: 1, category: 'DAILY' },
        { ...mockTemplate, id: 2, category: 'DAILY' },
      ];

      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);

      const result = await taskTemplateService.getTemplatesByCategory('DAILY');

      expect(result).toEqual(mockTemplates);
      expect(result).toHaveLength(2);
      expect(prisma.taskTemplate.findMany).toHaveBeenCalledWith({
        where: { category: 'DAILY' },
      });
    });

    it('应该支持获取所有分类', async () => {
      const mockTemplates = [
        { ...mockTemplate, id: 1, category: 'DAILY' },
        { ...mockTemplate, id: 2, category: 'WEEKLY' },
        { ...mockTemplate, id: 3, category: 'CHALLENGE' },
      ];

      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);

      const result = await taskTemplateService.getTemplatesByCategory();

      expect(result).toEqual(mockTemplates);
    });

    it('应该返回空数组当没有模板', async () => {
      (prisma.taskTemplate.findMany as any).mockResolvedValue([]);

      const result = await taskTemplateService.getTemplatesByCategory('DAILY');

      expect(result).toEqual([]);
    });
  });

  describe('getPublicTemplates', () => {
    it('应该获取公开模板列表', async () => {
      const mockTemplates = [
        { ...mockTemplate, id: 1, isPublic: true },
        { ...mockTemplate, id: 2, isPublic: true },
      ];

      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);

      const result = await taskTemplateService.getPublicTemplates();

      expect(result).toEqual(mockTemplates);
      expect(prisma.taskTemplate.findMany).toHaveBeenCalledWith({
        where: { isPublic: true },
      });
    });

    it('应该只返回公开模板', async () => {
      const mockTemplates = [
        { ...mockTemplate, id: 1, isPublic: true },
        { ...mockTemplate, id: 2, isPublic: false }, // 不应该包含
      ];

      (prisma.taskTemplate.findMany as any).mockResolvedValue(
        mockTemplates.filter((t) => t.isPublic)
      );

      const result = await taskTemplateService.getPublicTemplates();

      expect(result).toHaveLength(1);
      expect(result[0].isPublic).toBe(true);
    });
  });

  describe('getUserTemplates', () => {
    it('应该获取用户创建的模板', async () => {
      const mockTemplates = [
        { ...mockTemplate, id: 1, createdBy: 1 },
        { ...mockTemplate, id: 2, createdBy: 1 },
      ];

      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);

      const result = await taskTemplateService.getUserTemplates(1);

      expect(result).toEqual(mockTemplates);
      expect(prisma.taskTemplate.findMany).toHaveBeenCalledWith({
        where: { createdBy: 1 },
      });
    });

    it('应该返回空数组当用户没有模板', async () => {
      (prisma.taskTemplate.findMany as any).mockResolvedValue([]);

      const result = await taskTemplateService.getUserTemplates(999);

      expect(result).toEqual([]);
    });
  });

  describe('applyTemplate', () => {
    const templateApplyData = {
      templateId: 1,
      relationshipId: 1,
      customName: null,
      customDescription: null,
    };

    it('应该应用模板创建任务', async () => {
      const mockTask = {
        id: 1,
        name: '每日打卡模板',
        relationshipId: 1,
        status: 'PENDING',
      };

      (prisma.taskTemplate.findUnique as any).mockResolvedValue(mockTemplate);
      (prisma.task.create as any).mockResolvedValue(mockTask);

      const result = await taskTemplateService.applyTemplate(templateApplyData);

      expect(result).toEqual(mockTask);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          relationshipId: 1,
          name: '每日打卡模板',
          difficulty: 2,
        }),
      });
    });

    it('应该支持自定义任务名称', async () => {
      const customData = {
        ...templateApplyData,
        customName: '我的自定义任务',
      };

      const mockTask = {
        id: 1,
        name: '我的自定义任务',
        relationshipId: 1,
      };

      (prisma.taskTemplate.findUnique as any).mockResolvedValue(mockTemplate);
      (prisma.task.create as any).mockResolvedValue(mockTask);

      const result = await taskTemplateService.applyTemplate(customData);

      expect(result.name).toBe('我的自定义任务');
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '我的自定义任务',
        }),
      });
    });

    it('应该支持自定义描述', async () => {
      const customData = {
        ...templateApplyData,
        customDescription: '自定义描述',
      };

      const mockTask = {
        id: 1,
        description: '自定义描述',
        relationshipId: 1,
      };

      (prisma.taskTemplate.findUnique as any).mockResolvedValue(mockTemplate);
      (prisma.task.create as any).mockResolvedValue(mockTask);

      await taskTemplateService.applyTemplate(customData);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: '自定义描述',
        }),
      });
    });

    it('应该验证模板 ID', async () => {
      const invalidData = {
        ...templateApplyData,
        templateId: 0,
      };

      await expect(taskTemplateService.applyTemplate(invalidData)).rejects.toThrow();
    });

    it('应该验证关系 ID', async () => {
      const invalidData = {
        ...templateApplyData,
        relationshipId: 0,
      };

      await expect(taskTemplateService.applyTemplate(invalidData)).rejects.toThrow();
    });

    it('应该处理不存在的模板', async () => {
      (prisma.taskTemplate.findUnique as any).mockResolvedValue(null);

      await expect(taskTemplateService.applyTemplate(templateApplyData)).rejects.toThrow(
        'Template not found'
      );
    });
  });

  describe('updateTemplate', () => {
    const updateData = {
      name: '更新后的名称',
      description: '更新后的描述',
    };

    it('应该更新模板', async () => {
      const updatedTemplate = {
        ...mockTemplate,
        ...updateData,
      };

      (prisma.taskTemplate.update as any).mockResolvedValue(updatedTemplate);

      const result = await taskTemplateService.updateTemplate(1, updateData);

      expect(result.name).toBe('更新后的名称');
      expect(result.description).toBe('更新后的描述');
      expect(prisma.taskTemplate.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });

    it('应该验证模板 ID', async () => {
      await expect(taskTemplateService.updateTemplate(0, updateData)).rejects.toThrow();
    });

    it('应该处理不存在的模板', async () => {
      (prisma.taskTemplate.update as any).mockRejectedValue(
        new Error('Template not found')
      );

      await expect(taskTemplateService.updateTemplate(999, updateData)).rejects.toThrow(
        'Template not found'
      );
    });
  });

  describe('deleteTemplate', () => {
    it('应该删除模板', async () => {
      (prisma.taskTemplate.delete as any).mockResolvedValue(mockTemplate);

      await taskTemplateService.deleteTemplate(1);

      expect(prisma.taskTemplate.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('应该验证模板 ID', async () => {
      await expect(taskTemplateService.deleteTemplate(0)).rejects.toThrow();
    });

    it('应该处理不存在的模板', async () => {
      (prisma.taskTemplate.delete as any).mockRejectedValue(
        new Error('Template not found')
      );

      await expect(taskTemplateService.deleteTemplate(999)).rejects.toThrow(
        'Template not found'
      );
    });
  });

  describe('getTemplateStats', () => {
    it('应该获取模板统计信息', async () => {
      (prisma.taskTemplate.count as any).mockResolvedValue(50);

      const result = await taskTemplateService.getTemplateStats();

      expect(result.total).toBe(50);
    });

    it('应该按分类统计', async () => {
      (prisma.taskTemplate.count as any).mockResolvedValueOnce(20);

      const result = await taskTemplateService.getTemplateStats('DAILY');

      expect(result.byCategory?.DAILY).toBe(20);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理超长模板名称', async () => {
      const longName = 'A'.repeat(200);
      const templateData = {
        ...mockTemplate,
        name: longName,
      };

      (prisma.taskTemplate.create as any).mockResolvedValue(templateData);

      const result = await taskTemplateService.createTemplate({
        ...templateData,
        createdBy: 1,
      });

      expect(result.name).toBe(longName);
    });

    it('应该处理特殊字符', async () => {
      const specialContent = 'Special: <>&"\' 你好 🎉';
      const templateData = {
        ...mockTemplate,
        name: specialContent,
        description: specialContent,
      };

      (prisma.taskTemplate.create as any).mockResolvedValue(templateData);

      const result = await taskTemplateService.createTemplate({
        ...templateData,
        createdBy: 1,
      });

      expect(result.name).toBe(specialContent);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内获取大量模板', async () => {
      const mockTemplates = Array(100).fill(mockTemplate);
      (prisma.taskTemplate.findMany as any).mockResolvedValue(mockTemplates);

      const start = Date.now();
      await taskTemplateService.getPublicTemplates();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // 应该在 500ms 内完成
    });
  });
});
