/**
 * 管理员统计 API
 * 提供各类数据统计功能
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/admin/relationships
 * 关系统计
 */
router.get('/relationships', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { status, mode, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (mode) {
      where.mode = mode;
    }

    const [relationships, total] = await Promise.all([
      prisma.relationship.findMany({
        where,
        include: {
          guide: {
            select: { id: true, username: true, nickname: true },
          },
          grower: {
            select: { id: true, username: true, nickname: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.relationship.count({ where }),
    ]);

    // 状态统计
    const statusStats = await prisma.relationship.groupBy({
      by: ['status'],
      _count: true,
    });

    // 模式统计
    const modeStats = await prisma.relationship.groupBy({
      by: ['mode'],
      _count: true,
    });

    res.json({
      relationships,
      total,
      stats: {
        byStatus: statusStats,
        byMode: modeStats,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/tasks
 * 任务统计
 */
router.get('/tasks', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          guide: {
            select: { id: true, username: true, nickname: true },
          },
          grower: {
            select: { id: true, username: true, nickname: true },
          },
          relationship: {
            select: { id: true, mode: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      total,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/tasks/stats
 * 任务统计详情
 */
router.get('/tasks/stats', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const total = await prisma.task.count();

    // 状态统计
    const statusStats = await prisma.task.groupBy({
      by: ['status'],
      _count: true,
    });

    // 类型统计
    const typeStats = await prisma.task.groupBy({
      by: ['type'],
      _count: true,
    });

    res.json({
      stats: {
        total,
        byStatus: statusStats,
        byType: typeStats,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/rewards
 * 奖励统计
 */
router.get('/rewards', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.rewardTransaction.findMany({
        where,
        include: {
          reward: {
            include: {
              grower: {
                select: { id: true, username: true, nickname: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.rewardTransaction.count({ where }),
    ]);

    // 类型统计
    const typeStats = await prisma.rewardTransaction.groupBy({
      by: ['type'],
      _count: true,
    });

    // 总货币统计
    const totalRewards = await prisma.reward.aggregate({
      _sum: {
        bones: true,
        fish: true,
        gems: true,
        hearts: true,
        stars: true,
      },
    });

    res.json({
      transactions,
      total,
      stats: {
        byType: typeStats,
        totalRewards,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/content-review
 * 内容审核列表
 */
router.get('/content-review', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { type, status, limit = 50, offset = 0 } = req.query;

    // 这里可以扩展为审核用户生成的内容
    // 目前先返回待审核的任务
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: {
        status: 'PENDING_REVIEW',
      },
      include: {
        guide: {
          select: { id: true, username: true, nickname: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.task.count({
      where: { status: 'PENDING_REVIEW' },
    });

    res.json({
      items: tasks,
      total,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/admin/content-review/:id/approve
 * 审核通过
 */
router.post('/content-review/:id/approve', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        status: 'COMPLETED',
        auditComment: feedback || '管理员审核通过',
        auditedAt: new Date(),
        auditedBy: req.user!.id,
      },
    });

    res.json({
      message: '审核通过',
      task,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/admin/content-review/:id/reject
 * 审核拒绝
 */
router.post('/content-review/:id/reject', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        status: 'FAILED',
        auditComment: feedback || '管理员审核拒绝',
        auditedAt: new Date(),
        auditedBy: req.user!.id,
      },
    });

    res.json({
      message: '审核拒绝',
      task,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
