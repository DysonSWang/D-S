/**
 * 奖励商店 API
 * 功能：商品列表、兑换、订单历史
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/shop/items
 * 获取商店商品列表
 */
router.get('/items', authenticate, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const where: any = {};
    if (category) {
      where.category = category as string;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      where.isActive = true; // 默认只显示活跃商品
    }

    // 时间过滤（只展示在有效期内的商品）
    const now = new Date();
    where.OR = [
      { startDate: null, endDate: null },
      { startDate: { lte: now }, endDate: null },
      { startDate: null, endDate: { gte: now } },
      { startDate: { lte: now }, endDate: { gte: now } },
    ];

    const items = await prisma.shopItem.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      data: {
        items,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('获取商店商品失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/shop/items/:id
 * 获取单个商品详情
 */
router.get('/items/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.shopItem.findUnique({
      where: { id: parseInt(id) },
    });

    if (!item) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/shop/orders
 * 兑换商品
 */
router.post('/orders', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { itemId, quantity = 1 } = req.body;

    // 获取商品信息
    const item = await prisma.shopItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: '商品不存在' });
    }

    // 检查商品是否活跃
    if (!item.isActive) {
      return res.status(400).json({ error: '商品已下架' });
    }

    // 检查库存
    if (item.stock !== -1 && item.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    // 检查用户限购
    const userOrderCount = await prisma.shopOrder.count({
      where: {
        userId,
        itemId,
        status: { not: 'CANCELLED' },
      },
    });

    if (userOrderCount >= item.limitPerUser) {
      return res.status(400).json({ error: `每人限购 ${item.limitPerUser} 件` });
    }

    // 获取用户资产
    const reward = await prisma.reward.findUnique({
      where: { growerId: userId },
    });

    if (!reward) {
      return res.status(400).json({ error: '请先完成任务获取奖励' });
    }

    // 检查余额
    const balance = reward[item.priceType.toLowerCase() as keyof typeof reward] as number;
    const totalPrice = item.price * quantity;

    if (balance < totalPrice) {
      return res.status(400).json({ error: `${item.priceType} 不足` });
    }

    // 创建订单（事务）
    const order = await prisma.$transaction(async (tx) => {
      // 扣减资产
      await tx.reward.update({
        where: { growerId: userId },
        data: {
          [item.priceType.toLowerCase()]: { decrement: totalPrice },
        },
      });

      // 记录流水
      await tx.rewardTransaction.create({
        data: {
          rewardId: reward.id,
          type: 'SPEND',
          amount: -totalPrice,
          balance: balance - totalPrice,
          reason: `商店兑换：${item.name}`,
        },
      });

      // 创建订单
      const newOrder = await tx.shopOrder.create({
        data: {
          userId,
          itemId,
          quantity,
          totalPrice,
          priceType: item.priceType,
          status: 'COMPLETED',
        },
      });

      // 如果是装饰物品，直接发放到用户背包
      if (item.itemType === 'DECORATION' && item.itemConfig) {
        try {
          const config = JSON.parse(item.itemConfig);
          if (config.decorationId) {
            await tx.userDecoration.upsert({
              where: {
                userId_decorationId: {
                  userId,
                  decorationId: config.decorationId,
                },
              },
              update: {
                quantity: { increment: quantity },
              },
              create: {
                userId,
                decorationId: config.decorationId,
                quantity,
                isEquipped: false,
              },
            });
          }
        } catch (e) {
          console.error('发放装饰物品失败:', e);
        }
      }

      // 更新库存
      if (item.stock !== -1) {
        await tx.shopItem.update({
          where: { id: itemId },
          data: {
            stock: { decrement: quantity },
          },
        });
      }

      return newOrder;
    });

    res.json({
      success: true,
      message: '兑换成功',
      data: order,
    });
  } catch (error) {
    console.error('兑换商品失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/shop/orders
 * 获取用户订单历史
 */
router.get('/orders', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { status, limit = 20 } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status as string;
    }

    const orders = await prisma.shopOrder.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length,
      },
    });
  } catch (error) {
    console.error('获取订单历史失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/shop/orders/:id
 * 获取订单详情
 */
router.get('/orders/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const order = await prisma.shopOrder.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
      include: {
        item: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
