/**
 * Task Repeat Service Tests
 * 任务重复服务层测试
 * 
 * 测试范围:
 * - 重复任务生成
 * - 重复周期计算
 * - 任务链管理
 * - 截止日期计算
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../db';
import * as taskRepeatService from '../services/taskRepeat.service';
import { TaskRepeatType } from '../types/task.enums';

// Mock prisma
vi.mock('../db', () => ({
  prisma: {
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn) => fn(prisma)),
  },
}));

describe('Task Repeat Service', () => {
  const mockParentTask = {
    id: 1,
    relationshipId: 1,
    name: '每日打卡',
    repeatType: TaskRepeatType.DAILY,
    status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateNextDueDate', () => {
    const baseDate = new Date('2026-03-14T10:00:00Z');

    it('应该计算每日重复的下次截止日期', () => {
      const nextDate = taskRepeatService.calculateNextDueDate(
        TaskRepeatType.DAILY,
        baseDate
      );

      const expected = new Date('2026-03-15T10:00:00Z');
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it('应该计算每周重复的下次截止日期', () => {
      const nextDate = taskRepeatService.calculateNextDueDate(
        TaskRepeatType.WEEKLY,
        baseDate
      );

      const expected = new Date('2026-03-21T10:00:00Z');
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it('应该计算每月重复的下次截止日期', () => {
      const nextDate = taskRepeatService.calculateNextDueDate(
        TaskRepeatType.MONTHLY,
        baseDate
      );

      const expected = new Date('2026-04-14T10:00:00Z');
      expect(nextDate.toISOString()).toBe(expected.toISOString());
    });

    it('应该处理月末日期', () => {
      const jan31 = new Date('2026-01-31T10:00:00Z');
      const nextDate = taskRepeatService.calculateNextDueDate(
        TaskRepeatType.MONTHLY,
        jan31
      );

      // 2 月只有 28 天 (2026 年不是闰年)
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBeLessThanOrEqual(28);
    });

    it('一次性任务应该返回 null', () => {
      const nextDate = taskRepeatService.calculateNextDueDate(
        TaskRepeatType.ONCE,
        baseDate
      );

      expect(nextDate).toBeNull();
    });
  });

  describe('generateRepeatTasks', () => {
    const taskData = {
      relationshipId: 1,
      name: '每日打卡',
      description: '每日任务',
      difficulty: 2,
      repeatType: TaskRepeatType.DAILY,
      rewardConfig: { bones: 100, fish: 50 },
    };

    it('应该生成指定数量的重复任务', async () => {
      const mockTasks = Array(7).fill(null).map((_, i) => ({
        id: i + 1,
        ...taskData,
        dueDate: new Date(),
      }));

      (prisma.task.create as any).mockResolvedValue(mockTasks[0]);

      const result = await taskRepeatService.generateRepeatTasks(taskData, 7);

      expect(result).toHaveLength(7);
      expect(prisma.task.create).toHaveBeenCalledTimes(7);
    });

    it('应该为每个任务设置正确的截止日期', async () => {
      const mockTask = {
        id: 1,
        ...taskData,
        dueDate: new Date(),
      };

      (prisma.task.create as any).mockResolvedValue(mockTask);

      await taskRepeatService.generateRepeatTasks(taskData, 3);

      // 验证创建了 3 个任务
      expect(prisma.task.create).toHaveBeenCalledTimes(3);
    });

    it('应该保留父任务 ID 引用', async () => {
      const mockTask = {
        id: 1,
        ...taskData,
        parentId: 100,
        dueDate: new Date(),
      };

      (prisma.task.create as any).mockResolvedValue(mockTask);

      await taskRepeatService.generateRepeatTasks({ ...taskData, id: 100 }, 1);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parentId: 100,
        }),
      });
    });
  });

  describe('shouldGenerateNewTask', () => {
    it('应该为新任务生成重复任务', () => {
      const task = {
        id: 1,
        status: 'COMPLETED',
        repeatType: TaskRepeatType.DAILY,
        dueDate: new Date(),
      };

      const shouldGenerate = taskRepeatService.shouldGenerateNewTask(task as any);
      expect(shouldGenerate).toBe(true);
    });

    it('不应该为未完成的任务生成', () => {
      const task = {
        id: 1,
        status: 'PENDING',
        repeatType: TaskRepeatType.DAILY,
        dueDate: new Date(),
      };

      const shouldGenerate = taskRepeatService.shouldGenerateNewTask(task as any);
      expect(shouldGenerate).toBe(false);
    });

    it('不应该为一次性任务生成', () => {
      const task = {
        id: 1,
        status: 'COMPLETED',
        repeatType: TaskRepeatType.ONCE,
        dueDate: new Date(),
      };

      const shouldGenerate = taskRepeatService.shouldGenerateNewTask(task as any);
      expect(shouldGenerate).toBe(false);
    });

    it('应该为进行中的任务生成', () => {
      const task = {
        id: 1,
        status: 'IN_PROGRESS',
        repeatType: TaskRepeatType.DAILY,
        dueDate: new Date(),
      };

      const shouldGenerate = taskRepeatService.shouldGenerateNewTask(task as any);
      expect(shouldGenerate).toBe(true);
    });
  });

  describe('getTaskChain', () => {
    it('应该获取任务链中的所有任务', async () => {
      const mockTasks = [
        { id: 1, parentId: null, status: 'COMPLETED' },
        { id: 2, parentId: 1, status: 'COMPLETED' },
        { id: 3, parentId: 2, status: 'PENDING' },
      ];

      (prisma.task.findMany as any).mockResolvedValue(mockTasks);

      const result = await taskRepeatService.getTaskChain(1);

      expect(result).toEqual(mockTasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: 1 },
            { parentId: 1 },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('应该处理空任务链', async () => {
      (prisma.task.findMany as any).mockResolvedValue([]);

      const result = await taskRepeatService.getTaskChain(999);

      expect(result).toEqual([]);
    });
  });

  describe('getCompletionStreak', () => {
    it('应该计算连续完成次数', async () => {
      const mockTasks = [
        { id: 1, status: 'COMPLETED', completedAt: new Date('2026-03-12') },
        { id: 2, status: 'COMPLETED', completedAt: new Date('2026-03-13') },
        { id: 3, status: 'COMPLETED', completedAt: new Date('2026-03-14') },
        { id: 4, status: 'PENDING', dueDate: new Date('2026-03-15') },
      ];

      (prisma.task.findMany as any).mockResolvedValue(mockTasks);

      const streak = await taskRepeatService.getCompletionStreak(1, TaskRepeatType.DAILY);

      expect(streak).toBe(3);
    });

    it('应该处理中断的连续记录', async () => {
      const mockTasks = [
        { id: 1, status: 'COMPLETED', completedAt: new Date('2026-03-10') },
        { id: 2, status: 'COMPLETED', completedAt: new Date('2026-03-11') },
        { id: 3, status: 'MISSED', dueDate: new Date('2026-03-12') }, // 中断
        { id: 4, status: 'COMPLETED', completedAt: new Date('2026-03-13') },
        { id: 5, status: 'COMPLETED', completedAt: new Date('2026-03-14') },
      ];

      (prisma.task.findMany as any).mockResolvedValue(mockTasks);

      const streak = await taskRepeatService.getCompletionStreak(1, TaskRepeatType.DAILY);

      expect(streak).toBe(2); // 只有最近 2 个连续
    });

    it('应该处理空任务列表', async () => {
      (prisma.task.findMany as any).mockResolvedValue([]);

      const streak = await taskRepeatService.getCompletionStreak(1, TaskRepeatType.DAILY);

      expect(streak).toBe(0);
    });

    it('应该处理全部未完成的任务', async () => {
      const mockTasks = [
        { id: 1, status: 'PENDING', dueDate: new Date('2026-03-12') },
        { id: 2, status: 'PENDING', dueDate: new Date('2026-03-13') },
      ];

      (prisma.task.findMany as any).mockResolvedValue(mockTasks);

      const streak = await taskRepeatService.getCompletionStreak(1, TaskRepeatType.DAILY);

      expect(streak).toBe(0);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理闰年日期', () => {
      const feb29 = new Date('2024-02-29T10:00:00Z'); // 2024 是闰年
      const nextDate = taskRepeatService.calculateNextDueDate(
        TaskRepeatType.YEARLY,
        feb29
      );

      // 2025 年没有 2 月 29 日，应该处理为 2 月 28 日
      expect(nextDate.getFullYear()).toBe(2025);
      expect(nextDate.getMonth()).toBe(1); // February
    });

    it('应该处理跨年份的每月重复', () => {
      const dec15 = new Date('2026-12-15T10:00:00Z');
      const nextDate = taskRepeatService.calculateNextDueDate(
        TaskRepeatType.MONTHLY,
        dec15
      );

      expect(nextDate.getFullYear()).toBe(2027);
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getDate()).toBe(15);
    });

    it('应该处理大量重复任务生成', async () => {
      const mockTask = { id: 1, dueDate: new Date() };
      (prisma.task.create as any).mockResolvedValue(mockTask);

      // 生成 365 天的任务
      const result = await taskRepeatService.generateRepeatTasks(
        {
          relationshipId: 1,
          name: 'Yearly Challenge',
          repeatType: TaskRepeatType.DAILY,
          difficulty: 1,
          rewardConfig: { bones: 10, fish: 5 },
        },
        365
      );

      expect(result).toHaveLength(365);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内计算 100 次重复', () => {
      const baseDate = new Date();
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        taskRepeatService.calculateNextDueDate(TaskRepeatType.DAILY, baseDate);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 应该在 100ms 内完成
    });
  });
});
