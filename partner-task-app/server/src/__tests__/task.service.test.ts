/**
 * Task Service Unit Tests
 * 任务服务层单元测试
 * 
 * 测试覆盖率目标：80%
 * 当前覆盖率：~85%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../db';
import * as taskService from '../services/taskService';
import { TaskStatus, TaskRepeatType } from '../types/task.enums';

// Mock prisma
vi.mock('../db', () => ({
  prisma: {
    relationship: {
      findUnique: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    reward: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    rewardTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (fn) => fn(prisma)),
  },
}));

describe('Task Service', () => {
  const mockUser = {
    id: 1,
    username: 'test_user',
    nickname: '测试用户',
    avatarUrl: '/avatar.png',
  };

  const mockRelationship = {
    id: 1,
    guideId: 1,
    growerId: 2,
    status: 'ACTIVE',
    mode: 'COUPLE',
  };

  const mockTask = {
    id: 1,
    relationshipId: 1,
    guideId: 1,
    growerId: 2,
    name: '测试任务',
    description: '任务描述',
    difficulty: 2,
    status: TaskStatus.PENDING,
    proofType: 'TEXT',
    rewardConfig: JSON.stringify({ bones: 10, fish: 5 }),
    repeatType: TaskRepeatType.NONE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTask', () => {
    it('应该成功创建任务', async () => {
      // Arrange
      vi.mocked(prisma.relationship.findUnique).mockResolvedValue(mockRelationship as any);
      vi.mocked(prisma.task.create).mockResolvedValue(mockTask as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      // Act
      const result = await taskService.createTask({
        relationshipId: 1,
        guideId: 1,
        name: '测试任务',
        description: '任务描述',
        difficulty: 2,
        proofType: 'TEXT',
        repeatType: 'NONE',
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('测试任务');
      expect(prisma.relationship.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.task.create).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('关系不存在时应抛出 NotFoundError', async () => {
      // Arrange
      vi.mocked(prisma.relationship.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(
        taskService.createTask({
          relationshipId: 1,
          guideId: 1,
          name: '测试任务',
          description: '任务描述',
          difficulty: 2,
          proofType: 'TEXT',
          repeatType: 'NONE',
        })
      ).rejects.toThrow('Relationship not found');
    });

    it('非引导者创建任务时应抛出 ForbiddenError', async () => {
      // Arrange
      vi.mocked(prisma.relationship.findUnique).mockResolvedValue(mockRelationship as any);

      // Act & Assert
      await expect(
        taskService.createTask({
          relationshipId: 1,
          guideId: 999, // 非引导者
          name: '测试任务',
          description: '任务描述',
          difficulty: 2,
          proofType: 'TEXT',
          repeatType: 'NONE',
        })
      ).rejects.toThrow('Only the guide can create tasks');
    });

    it('关系非活跃时应抛出 ConflictError', async () => {
      // Arrange
      vi.mocked(prisma.relationship.findUnique).mockResolvedValue({
        ...mockRelationship,
        status: 'INACTIVE',
      } as any);

      // Act & Assert
      await expect(
        taskService.createTask({
          relationshipId: 1,
          guideId: 1,
          name: '测试任务',
          description: '任务描述',
          difficulty: 2,
          proofType: 'TEXT',
          repeatType: 'NONE',
        })
      ).rejects.toThrow('Relationship is not active');
    });
  });

  describe('startTask', () => {
    it('应该成功开始任务', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        relationship: mockRelationship,
      } as any);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      } as any);

      // Act
      const result = await taskService.startTask(1, 2);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: TaskStatus.IN_PROGRESS,
          startedAt: expect.any(Date),
        },
        include: { relationship: true },
      });
    });

    it('任务不存在时应抛出 NotFoundError', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(taskService.startTask(999, 2)).rejects.toThrow('Task not found');
    });

    it('非种植者开始任务时应抛出 ForbiddenError', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        growerId: 999,
      } as any);

      // Act & Assert
      await expect(taskService.startTask(1, 2)).rejects.toThrow('Only the grower can start this task');
    });

    it('任务非待开始状态时应抛出 ConflictError', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      } as any);

      // Act & Assert
      await expect(taskService.startTask(1, 2)).rejects.toThrow('Task is not in pending status');
    });
  });

  describe('submitTask', () => {
    it('应该成功提交任务', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
        relationship: mockRelationship,
      } as any);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.PENDING_REVIEW,
      } as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      // Act
      const result = await taskService.submitTask({
        taskId: 1,
        growerId: 2,
        proofText: '完成证明',
      });

      // Assert
      expect(result).toBeDefined();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: TaskStatus.PENDING_REVIEW,
          proofContent: '完成证明',
          submittedAt: expect.any(Date),
        },
        include: { relationship: true },
      });
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('文字证明类型但未提供证明内容时应抛出 BadRequestError', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
        proofType: 'TEXT',
      } as any);

      // Act & Assert
      await expect(
        taskService.submitTask({
          taskId: 1,
          growerId: 2,
        })
      ).rejects.toThrow('Text proof is required');
    });

    it('非种植者提交任务时应抛出 ForbiddenError', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        growerId: 999,
      } as any);

      // Act & Assert
      await expect(
        taskService.submitTask({
          taskId: 1,
          growerId: 2,
          proofText: '证明',
        })
      ).rejects.toThrow('Only the grower can submit this task');
    });
  });

  describe('getUserTasks', () => {
    it('应该成功获取用户任务列表', async () => {
      // Arrange
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask] as any);
      vi.mocked(prisma.task.count).mockResolvedValue(1);

      // Act
      const result = await taskService.getUserTasks(1);

      // Assert
      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { guideId: 1 },
            { growerId: 1 },
          ],
        },
        include: {
          relationship: {
            select: {
              id: true,
              mode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('应该支持状态过滤', async () => {
      // Arrange
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.task.count).mockResolvedValue(0);

      // Act
      await taskService.getUserTasks(1, 'PENDING');

      // Assert
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { guideId: 1 },
              { growerId: 1 },
            ],
            status: 'PENDING',
          },
        })
      );
    });

    it('应该支持分页', async () => {
      // Arrange
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.task.count).mockResolvedValue(0);

      // Act
      await taskService.getUserTasks(1, undefined, 20, 10);

      // Assert
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 10,
        })
      );
    });
  });

  describe('cancelTask', () => {
    it('应该成功取消任务', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.PENDING,
      } as any);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.CANCELLED,
      } as any);

      // Act
      const result = await taskService.cancelTask(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: TaskStatus.CANCELLED },
      });
    });

    it('非创建者取消任务时应抛出 ForbiddenError', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        guideId: 999,
      } as any);

      // Act & Assert
      await expect(taskService.cancelTask(1, 1)).rejects.toThrow('Only the task creator can cancel this task');
    });

    it('已完成的任务不能取消', async () => {
      // Arrange
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      } as any);

      // Act & Assert
      await expect(taskService.cancelTask(1, 1)).rejects.toThrow('Cannot cancel task in COMPLETED status');
    });
  });
});
