import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/stats
 * 获取管理统计数据
 */
router.get('/stats', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const [
      userCount,
      guideCount,
      growerCount,
      relationshipCount,
      taskCount,
      pendingReviewCount,
      sensitiveWordCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'GUIDE' } }),
      prisma.user.count({ where: { role: 'GROWER' } }),
      prisma.relationship.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.sensitiveWord.count(),
    ]);

    res.json({
      stats: {
        users: {
          total: userCount,
          guides: guideCount,
          growers: growerCount,
        },
        relationships: {
          total: relationshipCount,
        },
        tasks: {
          total: taskCount,
          pendingReview: pendingReviewCount,
        },
        moderation: {
          sensitiveWords: sensitiveWordCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/sensitive-words
 * 获取敏感词列表
 */
router.get('/sensitive-words', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { category, limit = 100, offset = 0 } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    const words = await prisma.sensitiveWord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.sensitiveWord.count({ where });

    res.json({
      words,
      total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/sensitive-words
 * 添加敏感词
 */
router.post('/sensitive-words', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { word, category, level = 1 } = req.body;

    if (!word || !category) {
      throw new BadRequestError('Word and category are required');
    }

    const sensitiveWord = await prisma.sensitiveWord.create({
      data: { word, category, level },
    });

    res.status(201).json({
      message: 'Sensitive word added',
      word: sensitiveWord,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/sensitive-words/:id
 * 删除敏感词
 */
router.delete('/sensitive-words/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.sensitiveWord.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      message: 'Sensitive word deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/relationships
 * 获取所有关系列表
 */
router.get('/relationships', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const relationships = await prisma.relationship.findMany({
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
    });

    const total = await prisma.relationship.count({ where });

    res.json({
      relationships,
      total,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
