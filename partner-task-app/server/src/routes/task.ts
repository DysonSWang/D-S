import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/tasks
 * 创建任务（引导者发布）
 */
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      relationshipId,
      name,
      description,
      difficulty = 1,
      proofType = 'TEXT',
      rewardConfig,
      deadline,
      repeatType = 'NONE',
      repeatConfig,
    } = req.body;

    const guideId = req.user!.id;

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
        name,
        description,
        difficulty,
        proofType: proofType.toUpperCase(),
        rewardConfig: rewardConfig ? JSON.stringify(rewardConfig) : null,
        deadline: deadline ? new Date(deadline) : null,
        repeatType: repeatType.toUpperCase(),
        repeatConfig: repeatConfig ? JSON.stringify(repeatConfig) : null,
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
        content: `${req.user!.nickname} 给你发布了新任务：${name}`,
        link: `/tasks/${task.id}`,
      },
    });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/start
 * 开始任务
 */
router.post('/:id/start', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const growerId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.growerId !== growerId) {
      throw new ForbiddenError('You are not the grower for this task');
    }

    if (task.status !== 'PENDING') {
      throw new ConflictError('Task is not in pending status');
    }

    const updated = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    res.json({
      message: 'Task started',
      task: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/submit
 * 提交打卡
 */
router.post('/:id/submit', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { proofContent } = req.body;
    const growerId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.growerId !== growerId) {
      throw new ForbiddenError('You are not the grower for this task');
    }

    if (task.status !== 'IN_PROGRESS') {
      throw new ConflictError('Task is not in progress');
    }

    const updated = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PENDING_REVIEW',
        proofContent,
        completedAt: new Date(),
      },
    });

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: task.guideId,
        type: 'TASK',
        title: '任务待审核',
        content: `${req.user!.nickname} 提交了任务：${task.name}`,
        link: `/tasks/${id}/review`,
      },
    });

    res.json({
      message: 'Task submitted for review',
      task: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/approve
 * 审核通过
 */
router.post('/:id/approve', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { auditComment, rewardOverride } = req.body;
    const guideId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        relationship: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.guideId !== guideId) {
      throw new ForbiddenError('Only the guide can approve tasks');
    }

    if (task.status !== 'PENDING_REVIEW') {
      throw new ConflictError('Task is not pending review');
    }

    // 更新任务状态
    const updated = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        status: 'COMPLETED',
        auditedAt: new Date(),
        auditedBy: guideId,
        auditComment,
      },
    });

    // 发放奖励
    if (task.rewardConfig) {
      const rewardConfig = JSON.parse(task.rewardConfig);
      const rewardOverrideParsed = rewardOverride ? JSON.parse(rewardOverride) : null;

      const rewardData = rewardOverrideParsed || rewardConfig;

      await prisma.reward.upsert({
        where: { growerId: task.growerId },
        update: {
          bones: { increment: rewardData.bones || 0 },
          fish: { increment: rewardData.fish || 0 },
          gems: { increment: rewardData.gems || 0 },
          hearts: { increment: rewardData.hearts || 0 },
          stars: { increment: rewardData.stars || 0 },
        },
        create: {
          growerId: task.growerId,
          bones: rewardData.bones || 10,
          fish: rewardData.fish || 1,
          gems: rewardData.gems || 0,
          hearts: rewardData.hearts || 0,
          stars: rewardData.stars || 0,
        },
      });

      // 创建奖励流水
      const reward = await prisma.reward.findUnique({
        where: { growerId: task.growerId },
      });

      if (reward) {
        const entries = Object.entries(rewardData).filter(([_, v]) => v > 0);
        for (const [type, amount] of entries) {
          await prisma.rewardTransaction.create({
            data: {
              rewardId: reward.id,
              type: 'EARN',
              amount: amount as number,
              balance: (reward as any)[type.toLowerCase()] || 0,
              reason: `Task completed: ${task.name}`,
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
        title: '任务已通过',
        content: `你的任务"${task.name}"已通过审核，奖励已发放`,
        link: `/tasks/${id}`,
      },
    });

    res.json({
      message: 'Task approved and rewards granted',
      task: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/reject
 * 审核拒绝
 */
router.post('/:id/reject', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { auditComment } = req.body;
    const guideId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.guideId !== guideId) {
      throw new ForbiddenError('Only the guide can reject tasks');
    }

    if (task.status !== 'PENDING_REVIEW') {
      throw new ConflictError('Task is not pending review');
    }

    const updated = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        status: 'IN_PROGRESS',
        auditedAt: new Date(),
        auditedBy: guideId,
        auditComment,
        completedAt: null,
        proofContent: null,
      },
    });

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: task.growerId,
        type: 'TASK',
        title: '任务被拒绝',
        content: `你的任务"${task.name}"未通过审核：${auditComment}`,
        link: `/tasks/${id}`,
      },
    });

    res.json({
      message: 'Task rejected, please resubmit',
      task: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/my
 * 获取我的任务列表
 */
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { status, type } = req.query;

    const where: any = {
      OR: [
        { guideId: userId },
        { growerId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        relationship: {
          select: {
            id: true,
            mode: true,
            status: true,
          },
        },
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 根据用户角色过滤视图
    const isGuide = req.user!.role === 'GUIDE' || req.user!.role === 'ADMIN';
    const filteredTasks = tasks.map(task => ({
      ...task,
      myRole: task.guideId === userId ? 'guide' : 'grower',
    }));

    res.json({
      tasks: filteredTasks,
      total: filteredTasks.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:id
 * 获取任务详情
 */
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        relationship: {
          select: {
            id: true,
            mode: true,
            status: true,
          },
        },
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.guideId !== userId && task.growerId !== userId) {
      throw new ForbiddenError('You are not part of this task');
    }

    res.json({
      task: {
        ...task,
        myRole: task.guideId === userId ? 'guide' : 'grower',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tasks/:id
 * 删除任务
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const guideId = req.user!.id;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.guideId !== guideId) {
      throw new ForbiddenError('Only the guide can delete tasks');
    }

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
