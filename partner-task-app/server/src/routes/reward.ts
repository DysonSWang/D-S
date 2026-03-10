/**
 * Reward Routes
 * 奖励相关 API 端点
 * 
 * 技术债务修复：
 * - ✅ 使用单例 db 连接
 * - ✅ 使用 Service 层处理业务逻辑
 * - ✅ 使用 Zod 进行输入验证
 */

import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ForbiddenError, BadRequestError } from '../middleware/errorHandler';
import * as rewardService from '../services/rewardService';
import { GiveRewardSchema, GetTransactionsQuerySchema } from '../validators/reward.validator';

const router = Router();

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

    const reward = await rewardService.getOrCreateReward(userId);

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

    // 验证查询参数
    const queryValidation = GetTransactionsQuerySchema.safeParse(req.query);
    const { limit, offset } = queryValidation.success 
      ? queryValidation.data 
      : { limit: 50, offset: 0 };

    // 获取奖励账户
    const reward = await rewardService.getOrCreateReward(userId);

    // 获取流水
    const { transactions, total } = await rewardService.getRewardTransactions(
      reward.id, 
      Number(limit), 
      Number(offset)
    );

    res.json({
      transactions,
      total,
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
    // 验证请求体
    const validationResult = GiveRewardSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError(validationResult.error.issues[0].message);
    }

    const validatedData = validationResult.data;
    const guideId = req.user!.id;

    // 调用 Service 层
    const updatedReward = await rewardService.giveReward({
      ...validatedData,
      guideId: Number(guideId),
    });

    res.json({
      message: 'Rewards given successfully',
      reward: updatedReward,
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

    // 使用 prisma 查询（这个端点不需要 Service 层）
    const { prisma } = await import('../db');
    
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
