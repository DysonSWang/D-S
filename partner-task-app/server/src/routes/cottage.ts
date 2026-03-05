import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/cottage/my
 * 获取我的小屋
 */
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    if (req.user!.role !== 'GROWER') {
      throw new ForbiddenError('Only growers have cottages');
    }

    let cottage = await prisma.cottage.findUnique({
      where: { growerId: userId },
    });

    // 如果没有小屋，创建一个
    if (!cottage) {
      cottage = await prisma.cottage.create({
        data: {
          growerId: userId,
          level: 1,
          experience: 0,
          warmth: 0,
        },
      });
    }

    // 获取已装备的装饰
    const decorations = await prisma.userDecoration.findMany({
      where: {
        userId,
        isEquipped: true,
      },
      include: {
        decoration: true,
      },
    });

    res.json({
      cottage,
      decorations,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cottage/decorate
 * 装备/卸下装饰
 */
router.post('/decorate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userDecorationId, position, isEquipped } = req.body;
    const userId = req.user!.id;

    if (req.user!.role !== 'GROWER') {
      throw new ForbiddenError('Only growers can decorate cottages');
    }

    const userDecoration = await prisma.userDecoration.findUnique({
      where: { id: userDecorationId },
      include: {
        decoration: true,
      },
    });

    if (!userDecoration) {
      throw new NotFoundError('Decoration not found');
    }

    if (userDecoration.userId !== userId) {
      throw new ForbiddenError('This decoration does not belong to you');
    }

    // 更新装备状态
    const updated = await prisma.userDecoration.update({
      where: { id: userDecorationId },
      data: {
        isEquipped: isEquipped !== false,
        position: position ? JSON.stringify(position) : null,
      },
    });

    // 如果装备了装饰，更新小屋温暖度
    if (isEquipped !== false) {
      const warmthBonus = userDecoration.decoration.warmthBonus || 0;

      await prisma.cottage.update({
        where: { growerId: userId },
        data: {
          warmth: { increment: warmthBonus },
          experience: { increment: warmthBonus * 10 },
        },
      });
    }

    res.json({
      message: 'Decoration updated',
      decoration: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cottage/decorations
 * 获取我的装饰列表
 */
router.get('/decorations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { equipped } = req.query;

    const where: any = { userId };

    if (equipped !== undefined) {
      where.isEquipped = equipped === 'true';
    }

    const decorations = await prisma.userDecoration.findMany({
      where,
      include: {
        decoration: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      decorations,
      total: decorations.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cottage/upgrade
 * 升级小屋
 */
router.post('/upgrade', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    if (req.user!.role !== 'GROWER') {
      throw new ForbiddenError('Only growers can upgrade cottages');
    }

    const cottage = await prisma.cottage.findUnique({
      where: { growerId: userId },
    });

    if (!cottage) {
      throw new NotFoundError('Cottage not found');
    }

    // 检查经验是否足够
    const expNeeded = cottage.level * 100;
    if (cottage.experience < expNeeded) {
      throw new ForbiddenError(`Need ${expNeeded} EXP, have ${cottage.experience}`);
    }

    // 升级
    const updated = await prisma.cottage.update({
      where: { growerId: userId },
      data: {
        level: cottage.level + 1,
        experience: cottage.experience - expNeeded,
      },
    });

    res.json({
      message: 'Cottage upgraded',
      cottage: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
