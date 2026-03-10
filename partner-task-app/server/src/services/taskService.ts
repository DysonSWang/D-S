/**
 * Task Service Layer
 * 任务业务逻辑层，处理所有任务相关的核心业务
 */

import { prisma } from '../db';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { checkAndUnlockAchievements } from './achievementService';

export interface CreateTaskInput {
  relationshipId: number;
  guideId: number;
  name: string;
  description: string;
  difficulty: number;
  proofType: string;
  rewardConfig?: any;
  deadline?: Date;
  repeatType: string;
  repeatConfig?: any;
}

export interface SubmitTaskInput {
  taskId: number;
  growerId: number;
  proofText?: string;
  proofImages?: string[];
}

export interface ReviewTaskInput {
  taskId: number;
  guideId: number;
  approved: boolean;
  feedback?: string;
}

/**
 * 创建任务
 */
export async function createTask(input: CreateTaskInput) {
  const { relationshipId, guideId, ...taskData } = input;

  // 验证关系
  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
  });

  if (!relationship) {
    throw new NotFoundError('Relationship not found');
  }

  if (relationship.guideId !== guideId) {
    throw new ForbiddenError('Only the guide can create tasks');
  }

  if (relationship.status !== 'ACTIVE') {
    throw new ConflictError('Relationship is not active');
  }

  // 创建任务
  const task = await prisma.task.create({
    data: {
      relationshipId,
      guideId,
      growerId: relationship.growerId,
      ...taskData,
      proofType: taskData.proofType.toUpperCase(),
      rewardConfig: taskData.rewardConfig ? JSON.stringify(taskData.rewardConfig) : null,
      repeatType: taskData.repeatType.toUpperCase(),
      repeatConfig: taskData.repeatConfig ? JSON.stringify(taskData.repeatConfig) : null,
      deadline: taskData.deadline ? new Date(taskData.deadline) : null,
      status: 'PENDING',
    },
    include: {
      relationship: {
        select: {
          id: true,
          mode: true,
        },
      },
    },
  });

  // 创建通知
  await prisma.notification.create({
    data: {
      userId: relationship.growerId,
      type: 'TASK',
      title: '新任务',
      content: `你有新任务：${task.name}`,
      link: `/tasks/${task.id}`,
    },
  });

  return task;
}

/**
 * 开始任务
 */
export async function startTask(taskId: number, growerId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { relationship: true },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  if (task.growerId !== growerId) {
    throw new ForbiddenError('Only the grower can start this task');
  }

  if (task.status !== 'PENDING') {
    throw new ConflictError(`Task is not in pending status (current: ${task.status})`);
  }

  const relationship = task.relationship;
  if (relationship.status !== 'ACTIVE') {
    throw new ConflictError('Relationship is not active');
  }

  return await prisma.task.update({
    where: { id: taskId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
    include: { relationship: true },
  });
}

/**
 * 提交任务打卡
 */
export async function submitTask(input: SubmitTaskInput) {
  const { taskId, growerId, proofText, proofImages } = input;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { relationship: true },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  if (task.growerId !== growerId) {
    throw new ForbiddenError('Only the grower can submit this task');
  }

  if (task.status !== 'IN_PROGRESS') {
    throw new ConflictError(`Task is not in progress (current: ${task.status})`);
  }

  // 验证打卡证明
  if (task.proofType === 'TEXT' && !proofText) {
    throw new BadRequestError('Text proof is required');
  }

  if (task.proofType === 'IMAGE' && (!proofImages || proofImages.length === 0)) {
    throw new BadRequestError('Image proof is required');
  }

  // 更新任务状态
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'PENDING_REVIEW',
      proofContent: proofText || (proofImages ? JSON.stringify(proofImages) : null),
      completedAt: new Date(),
    },
    include: { relationship: true },
  });

  // 创建通知
  await prisma.notification.create({
    data: {
      userId: task.relationship.guideId,
      type: 'TASK',
      title: '任务待审核',
      content: `任务已完成：${task.name}`,
      link: `/tasks/${taskId}`,
    },
  });

  return updatedTask;
}

/**
 * 审核任务
 */
export async function reviewTask(input: ReviewTaskInput) {
  const { taskId, guideId, approved, feedback } = input;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { relationship: true },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  if (task.guideId !== guideId) {
    throw new ForbiddenError('Only the guide can review this task');
  }

  if (task.status !== 'SUBMITTED') {
    throw new ConflictError(`Task is not submitted (current: ${task.status})`);
  }

  // 更新任务状态
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: approved ? 'COMPLETED' : 'PENDING',
      auditComment: feedback || null,
      auditedAt: new Date(),
      auditedBy: guideId,
    },
    include: { relationship: true },
  });

  // 如果通过，发放奖励
  if (approved && task.rewardConfig) {
    const rewardConfig = typeof task.rewardConfig === 'string' 
      ? JSON.parse(task.rewardConfig) 
      : task.rewardConfig;

    if (rewardConfig) {
      await prisma.reward.upsert({
        where: { growerId: task.growerId },
        create: {
          growerId: task.growerId,
          bones: rewardConfig.bones || 0,
          fish: rewardConfig.fish || 0,
          gems: rewardConfig.gems || 0,
        },
        update: {
          bones: { increment: rewardConfig.bones || 0 },
          fish: { increment: rewardConfig.fish || 0 },
          gems: { increment: rewardConfig.gems || 0 },
        },
      });

      // 创建奖励流水
      const reward = await prisma.reward.findUnique({
        where: { growerId: task.growerId },
      });

      if (reward) {
        await prisma.rewardTransaction.create({
          data: {
            rewardId: reward.id,
            type: 'EARN',
            amount: (rewardConfig.bones || 0) + (rewardConfig.fish || 0) * 10 + (rewardConfig.gems || 0) * 100,
            balance: reward.bones,
            reason: `任务奖励：${task.name}`,
            taskId: task.id,
          },
        });
      }
    }
  }

  // 创建通知
  await prisma.notification.create({
    data: {
      userId: task.growerId,
      type: 'TASK',
      title: approved ? '任务通过' : '任务被拒绝',
      content: feedback || (approved ? '任务已完成，奖励已发放' : '任务未通过审核'),
      link: `/tasks/${taskId}`,
    },
  });

  // 如果通过，触发成就检查
  if (approved) {
    await checkAndUnlockAchievements(task.growerId, 'task_completed', {
      taskId: task.id,
      taskName: task.name,
      completedAt: new Date(),
    });
  }

  return updatedTask;
}

/**
 * 获取任务详情
 */
export async function getTaskById(taskId: number, userId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      relationship: {
        select: {
          id: true,
          mode: true,
          guide: { select: { id: true, username: true, nickname: true, avatarUrl: true } },
          grower: { select: { id: true, username: true, nickname: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  // 权限检查
  if (task.guideId !== userId && task.growerId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return task;
}

/**
 * 获取用户任务列表
 */
export async function getUserTasks(userId: number, status?: string, limit = 50, offset = 0) {
  const where: any = {
    OR: [
      { guideId: userId },
      { growerId: userId },
    ],
  };

  if (status) {
    where.status = status.toUpperCase();
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        relationship: {
          select: {
            id: true,
            mode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total };
}

/**
 * 取消任务
 */
export async function cancelTask(taskId: number, userId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  // 只有创建者可以取消
  if (task.guideId !== userId) {
    throw new ForbiddenError('Only the task creator can cancel this task');
  }

  if (!['PENDING', 'IN_PROGRESS'].includes(task.status)) {
    throw new ConflictError(`Cannot cancel task in ${task.status} status`);
  }

  return await prisma.task.update({
    where: { id: taskId },
    data: { status: 'CANCELLED' },
  });
}
