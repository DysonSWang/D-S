import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/rewards/my
 * 获取我的奖励资产
 */
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // 成长者才有奖励账户
    if (req.user!.role !== 'GROWER') {
      throw new ForbiddenError('Only growers have reward accounts');
    }

    let reward = await prisma.reward.findUnique({
      where: { growerId: userId },
    });

    // 如果没有奖励账户，创建一个
    if (!reward) {
      reward = await prisma.reward.create({
        data: {
          growerId: userId,
          bones: 100,
          fish: 10,
          gems: 5,
        },
      });
    }

    res.json({
      reward,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rewards/transactions
 * 获取奖励流水
 */
router.get('/transactions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0 } = req.query;

    const reward = await prisma.reward.findUnique({
      where: { growerId: userId },
    });

    if (!reward) {
      throw new NotFoundError('Reward account not found');
    }

    const transactions = await prisma.rewardTransaction.findMany({
      where: { rewardId: reward.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      transactions,
      total: transactions.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rewards/give
 * 发放奖励（引导者给成长者）
 */
router.post('/give', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { growerId, bones = 0, fish = 0, gems = 0, hearts = 0, stars = 0, reason } = req.body;
    const guideId = req.user!.id;

    if (req.user!.role !== 'GUIDE' && req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Only guides can give rewards');
    }

    // 验证关系
    const relationship = await prisma.relationship.findFirst({
      where: {
        guideId,
        growerId,
        status: 'ACTIVE',
      },
    });

    if (!relationship) {
      throw new ForbiddenError('No active relationship with this grower');
    }

    // 更新或创建奖励账户
    const reward = await prisma.reward.upsert({
      where: { growerId },
      update: {
        bones: { increment: bones },
        fish: { increment: fish },
        gems: { increment: gems },
        hearts: { increment: hearts },
        stars: { increment: stars },
      },
      create: {
        growerId,
        bones,
        fish,
        gems,
        hearts,
        stars,
      },
    });

    // 创建流水
    const entries = Object.entries({ bones, fish, gems, hearts, stars })
      .filter(([_, v]) => v > 0);

    for (const [type, amount] of entries) {
      await prisma.rewardTransaction.create({
        data: {
          rewardId: reward.id,
          type: 'GIFT',
          amount: amount as number,
          balance: (reward as any)[type] || 0,
          reason: reason || 'Gift from guide',
        },
      });
    }

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: growerId,
        type: 'REWARD',
        title: '收到奖励',
        content: `${req.user!.nickname} 给你发放了奖励`,
        link: '/rewards',
      },
    });

    res.json({
      message: 'Rewards given successfully',
      reward,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rewards/redeem
 * 兑换道具
 */
router.post('/redeem', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { decorationId, quantity = 1 } = req.body;
    const growerId = req.user!.id;

    if (req.user!.role !== 'GROWER') {
      throw new ForbiddenError('Only growers can redeem items');
    }

    // 查找装饰物品
    const decoration = await prisma.decoration.findUnique({
      where: { id: decorationId },
    });

    if (!decoration) {
      throw new NotFoundError('Decoration not found');
    }

    if (!decoration.isAvailable) {
      throw new ConflictError('Decoration is not available');
    }

    // 获取奖励账户
    let reward = await prisma.reward.findUnique({
      where: { growerId },
    });

    if (!reward) {
      throw new NotFoundError('Reward account not found');
    }

    // 检查余额
    const priceType = decoration.priceType.toLowerCase() as 'bones' | 'fish' | 'gems';
    const currentBalance = (reward as any)[priceType] || 0;
    const totalCost = decoration.price * quantity;

    if (currentBalance < totalCost) {
      throw new BadRequestError(`Insufficient ${priceType}. Need ${totalCost}, have ${currentBalance}`);
    }

    // 扣除货币
    reward = await prisma.reward.update({
      where: { growerId },
      data: {
        [priceType]: { decrement: totalCost },
      },
    });

    // 创建流水
    await prisma.rewardTransaction.create({
      data: {
        rewardId: reward.id,
        type: 'SPEND',
        amount: totalCost,
        balance: (reward as any)[priceType] || 0,
        reason: `Redeemed: ${decoration.name} x${quantity}`,
      },
    });

    // 添加装饰到用户库存
    await prisma.userDecoration.upsert({
      where: {
        userId_decorationId: {
          userId: growerId,
          decorationId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: growerId,
        decorationId,
        quantity,
        isEquipped: false,
      },
    });

    res.json({
      message: 'Redemption successful',
      reward,
      decoration: {
        id: decoration.id,
        name: decoration.name,
        quantity,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rewards/decorations
 * 获取装饰物品列表
 */
router.get('/decorations', async (req, res, next) => {
  try {
    const { category, rarity, available } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (rarity) {
      where.rarity = parseInt(rarity as string);
    }

    if (available !== undefined) {
      where.isAvailable = available === 'true';
    }

    const decorations = await prisma.decoration.findMany({
      where,
      orderBy: [{ rarity: 'asc' }, { price: 'asc' }],
    });

    res.json({
      decorations,
      total: decorations.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
