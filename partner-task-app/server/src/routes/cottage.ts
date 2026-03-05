import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// 小屋等级配置
const COTTAGE_LEVEL_CONFIG = [
  { level: 1, maxSlots: 5, expNeeded: 0 },
  { level: 2, maxSlots: 8, expNeeded: 100 },
  { level: 3, maxSlots: 12, expNeeded: 300 },
  { level: 4, maxSlots: 16, expNeeded: 600 },
  { level: 5, maxSlots: 20, expNeeded: 1000 },
  { level: 6, maxSlots: 25, expNeeded: 1500 },
  { level: 7, maxSlots: 30, expNeeded: 2200 },
  { level: 8, maxSlots: 35, expNeeded: 3000 },
  { level: 9, maxSlots: 40, expNeeded: 4000 },
  { level: 10, maxSlots: 50, expNeeded: 5000 },
];

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
          maxSlots: 5,
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

    // 计算当前等级配置
    const levelConfig = COTTAGE_LEVEL_CONFIG.find(c => c.level === cottage.level) || COTTAGE_LEVEL_CONFIG[0];
    const nextLevelConfig = COTTAGE_LEVEL_CONFIG.find(c => c.level === cottage.level + 1);

    res.json({
      cottage: {
        ...cottage,
        usedSlots: decorations.length,
        nextLevel: nextLevelConfig ? {
          level: nextLevelConfig.level,
          expNeeded: nextLevelConfig.expNeeded,
          maxSlots: nextLevelConfig.maxSlots,
        } : null,
      },
      decorations,
      levelConfig,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cottage/decorate
 * 装备/卸下装饰 (支持槽位系统)
 */
router.post('/decorate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userDecorationId, slotPosition, isEquipped } = req.body;
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

    // 获取小屋信息
    const cottage = await prisma.cottage.findUnique({
      where: { growerId: userId },
    });

    if (!cottage) {
      throw new NotFoundError('Cottage not found');
    }

    // 检查槽位类型是否匹配
    const slotType = userDecoration.decoration.slotType || 'FURNITURE';
    
    // 装备装饰时检查槽位数量
    if (isEquipped !== false) {
      // 检查槽位是否已被占用
      if (slotPosition) {
        const occupiedSlot = await prisma.userDecoration.findFirst({
          where: {
            userId,
            isEquipped: true,
            slotPosition,
            id: { not: userDecorationId },
          },
        });

        if (occupiedSlot) {
          throw new BadRequestError(`Slot ${slotPosition} is already occupied`);
        }

        // 检查是否超过最大槽位
        if (slotPosition > cottage.maxSlots) {
          throw new BadRequestError(`Max slots is ${cottage.maxSlots}, upgrade cottage to unlock more`);
        }
      } else {
        // 没有指定槽位，检查已装备数量
        const equippedCount = await prisma.userDecoration.count({
          where: {
            userId,
            isEquipped: true,
          },
        });

        if (equippedCount >= cottage.maxSlots) {
          throw new BadRequestError(`Max slots (${cottage.maxSlots}) reached. Upgrade cottage to unlock more slots.`);
        }
      }
    }

    // 更新装备状态
    const updated = await prisma.userDecoration.update({
      where: { id: userDecorationId },
      data: {
        isEquipped: isEquipped !== false,
        slotPosition: isEquipped !== false ? (slotPosition || null) : null,
        position: null, // 清空自由摆放位置 (预留功能)
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
    } else {
      // 卸下装饰，减少温暖度
      const warmthBonus = userDecoration.decoration.warmthBonus || 0;

      await prisma.cottage.update({
        where: { growerId: userId },
        data: {
          warmth: { decrement: warmthBonus },
          experience: { decrement: warmthBonus * 10 },
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

/**
 * GET /api/cottage/warmth-ranking
 * 温暖度排行榜
 */
router.get('/warmth-ranking', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const rankings = await prisma.cottage.findMany({
      where: {
        warmth: { gt: 0 },
      },
      include: {
        grower: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { warmth: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      rankings: rankings.map((c, index) => ({
        rank: index + 1 + parseInt(offset as string),
        cottage: {
          id: c.id,
          level: c.level,
          warmth: c.warmth,
          theme: c.theme,
        },
        grower: c.grower,
      })),
      total: rankings.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cottage/collections
 * 获取装饰图鉴列表
 */
router.get('/collections', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const collections = await prisma.decorationCollection.findMany({
      where: { isHidden: false },
      include: {
        decorations: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
          },
        },
      },
    });

    // 获取用户收集进度
    const userProgress = await prisma.userCollectionProgress.findMany({
      where: { userId },
      include: {
        collection: true,
      },
    });

    const progressMap = new Map(userProgress.map(p => [p.collectionId, p]));

    res.json({
      collections: collections.map(c => {
        const progress = progressMap.get(c.id);
        return {
          collection: {
            id: c.id,
            name: c.name,
            description: c.description,
            iconUrl: c.iconUrl,
            totalItems: c.decorations.length,
            bonusReward: c.bonusReward,
          },
          progress: progress ? {
            collectedCount: progress.collectedCount,
            isCompleted: progress.isCompleted,
            completedAt: progress.completedAt,
          } : {
            collectedCount: 0,
            isCompleted: false,
            completedAt: null,
          },
          decorations: c.decorations,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cottage/collections/:id
 * 获取单个图鉴详情
 */
router.get('/collections/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const collectionId = parseInt(req.params.id);

    const collection = await prisma.decorationCollection.findUnique({
      where: { id: collectionId },
      include: {
        decorations: {
          where: { isAvailable: true },
          include: {
            collection: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError('Collection not found');
    }

    // 获取用户收集进度
    let progress = await prisma.userCollectionProgress.findUnique({
      where: {
        userId_collectionId: {
          userId,
          collectionId,
        },
      },
    });

    // 获取用户拥有的装饰 ID 列表
    const userDecorationIds = await prisma.userDecoration.findMany({
      where: {
        userId,
        decoration: {
          collectionId,
        },
      },
      select: {
        decorationId: true,
        quantity: true,
      },
    });

    const ownedDecorationIds = new Set(userDecorationIds.map(ud => ud.decorationId));

    // 更新收集进度
    const collectedCount = collection.decorations.filter(d => ownedDecorationIds.has(d.id)).length;

    if (!progress) {
      progress = await prisma.userCollectionProgress.create({
        data: {
          userId,
          collectionId,
          collectedCount,
          isCompleted: collectedCount >= collection.decorations.length,
          completedAt: collectedCount >= collection.decorations.length ? new Date() : null,
        },
      });
    } else if (progress.collectedCount !== collectedCount) {
      progress = await prisma.userCollectionProgress.update({
        where: { id: progress.id },
        data: {
          collectedCount,
          isCompleted: collectedCount >= collection.decorations.length,
          completedAt: collectedCount >= collection.decorations.length ? new Date() : progress.completedAt,
        },
      });

      // 如果完成收集，发放奖励
      if (progress.isCompleted && collection.bonusReward) {
        const reward = JSON.parse(collection.bonusReward);
        
        // 更新或创建奖励账户
        await prisma.reward.upsert({
          where: { growerId: userId },
          update: {
            bones: { increment: reward.bones || 0 },
            fish: { increment: reward.fish || 0 },
            gems: { increment: reward.gems || 0 },
          },
          create: {
            growerId: userId,
            bones: reward.bones || 0,
            fish: reward.fish || 0,
            gems: reward.gems || 0,
          },
        });

        // 创建通知
        await prisma.notification.create({
          data: {
            userId,
            type: 'ACHIEVEMENT',
            title: '图鉴收集完成!',
            content: `恭喜完成"${collection.name}"收集，获得奖励!`,
            link: '/collections',
          },
        });
      }
    }

    // 标记每个装饰是否已拥有
    const decorationsWithOwnership = collection.decorations.map(d => ({
      ...d,
      isOwned: ownedDecorationIds.has(d.id),
      quantity: userDecorationIds.find(ud => ud.decorationId === d.id)?.quantity || 0,
    }));

    res.json({
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        iconUrl: collection.iconUrl,
        totalItems: collection.decorations.length,
        bonusReward: collection.bonusReward,
      },
      progress: {
        collectedCount: progress.collectedCount,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
      },
      decorations: decorationsWithOwnership,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
