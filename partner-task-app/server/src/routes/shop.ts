/**
 * 奖励商店 API
 * 功能：商品列表、兑换、订单历史、管理员商城管理
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

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

// ==================== 管理员商城管理 ====================

/**
 * GET /api/shop/admin/items
 * 管理员 - 获取所有商品（包括未上架）
 */
router.get('/admin/items', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { category, isActive, limit = 100, offset = 0 } = req.query;

    const where: any = {};
    if (category) {
      where.category = category as string;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.shopItem.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.shopItem.count({ where }),
    ]);

    // 分类统计
    const categoryStats = await prisma.shopItem.groupBy({
      by: ['category'],
      _count: true,
    });

    res.json({
      success: true,
      data: {
        items,
        total,
        stats: {
          byCategory: categoryStats,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/shop/admin/items
 * 管理员 - 创建商品
 */
router.post('/admin/items', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const {
      name,
      description,
      category,
      priceType,
      priceAmount,
      rewardType,
      rewardAmount,
      imageUrl,
      stock,
      isActive,
      startDate,
      endDate,
      sort,
    } = req.body;

    // 验证必填字段
    if (!name || !category || !priceType || !priceAmount) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const item = await prisma.shopItem.create({
      data: {
        name,
        description: description || '',
        category,
        priceType,
        priceAmount: parseInt(priceAmount),
        rewardType: rewardType || null,
        rewardAmount: rewardAmount ? parseInt(rewardAmount) : null,
        imageUrl: imageUrl || null,
        stock: stock ? parseInt(stock) : null,
        isActive: isActive !== false, // 默认上架
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        sort: sort ? parseInt(sort) : 0,
      },
    });

    res.json({
      success: true,
      message: '商品创建成功',
      data: item,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * PUT /api/shop/admin/items/:id
 * 管理员 - 更新商品
 */
router.put('/admin/items/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData: any = {};

    const allowedFields = [
      'name', 'description', 'category', 'priceType', 'priceAmount',
      'rewardType', 'rewardAmount', 'imageUrl', 'stock', 'isActive',
      'startDate', 'endDate', 'sort',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field.includes('Date')) {
          updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (field.includes('Amount') || field === 'stock' || field === 'sort') {
          updateData[field] = req.body[field] ? parseInt(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const item = await prisma.shopItem.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: '商品更新成功',
      data: item,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/shop/admin/items/:id
 * 管理员 - 删除商品
 */
router.delete('/admin/items/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.shopItem.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: '商品删除成功',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/shop/admin/orders
 * 管理员 - 获取所有订单
 */
router.get('/admin/orders', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }

    const [orders, total] = await Promise.all([
      prisma.shopOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              role: true,
            },
          },
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              priceType: true,
              priceAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.shopOrder.count({ where }),
    ]);

    // 状态统计
    const statusStats = await prisma.shopOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    // 分类统计
    const categoryStats = await prisma.shopOrder.groupBy({
      by: ['category'],
      _count: true,
    });

    res.json({
      success: true,
      data: {
        orders,
        total,
        stats: {
          byStatus: statusStats,
          byCategory: categoryStats,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/shop/admin/stats
 * 管理员 - 商城统计（含销售情况）
 */
router.get('/admin/stats', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // 时间范围过滤
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // 商品统计
    const itemStats = await prisma.shopItem.groupBy({
      by: ['category'],
      _count: true,
    });

    const activeItems = await prisma.shopItem.count({ where: { isActive: true } });
    const totalItems = await prisma.shopItem.count();

    // 订单统计
    const orderStats = await prisma.shopOrder.groupBy({
      by: ['status'],
      _count: true,
    }).catch(() => []);

    const totalOrders = await prisma.shopOrder.count({ where });

    // 销售统计 - 按商品
    const salesByItem = await prisma.shopOrder.groupBy({
      by: ['itemId'],
      _count: true,
      _sum: {
        bonesSpent: true,
        fishSpent: true,
        gemsSpent: true,
        heartsSpent: true,
        starsSpent: true,
      },
      where,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    }).catch(() => []) as any[];

    // 获取商品信息
    const itemIds = salesByItem.map(s => s.itemId);
    const items = await prisma.shopItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, category: true },
    });
    const itemMap = Object.fromEntries(items.map(i => [i.id, i]));

    // 销售统计 - 按货币类型
    const revenue = await prisma.shopOrder.aggregate({
      _sum: {
        bonesSpent: true,
        fishSpent: true,
        gemsSpent: true,
        heartsSpent: true,
        starsSpent: true,
      },
      where,
    });

    // 销售统计 - 按用户
    const salesByUser = await prisma.shopOrder.groupBy({
      by: ['userId'],
      _count: true,
      _sum: {
        bonesSpent: true,
        fishSpent: true,
        gemsSpent: true,
        heartsSpent: true,
        starsSpent: true,
      },
      where,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    }).catch(() => []) as any[];

    // 获取用户信息
    const userIds = salesByUser.map(s => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, nickname: true, role: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // 今日销售
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await prisma.shopOrder.count({
      where: { createdAt: { gte: today } },
    });

    const todayRevenue = await prisma.shopOrder.aggregate({
      _sum: {
        bonesSpent: true,
        fishSpent: true,
        gemsSpent: true,
        heartsSpent: true,
        starsSpent: true,
      },
      where: { createdAt: { gte: today } },
    });

    // 热销商品 Top 10
    const topItems = salesByItem.map(s => ({
      item: itemMap[s.itemId] || { name: '未知商品', category: 'unknown' },
      count: s._count,
      revenue: {
        bones: s._sum.bonesSpent || 0,
        fish: s._sum.fishSpent || 0,
        gems: s._sum.gemsSpent || 0,
        hearts: s._sum.heartsSpent || 0,
        stars: s._sum.starsSpent || 0,
      },
    }));

    // 消费达人 Top 10
    const topUsers = salesByUser.map(s => ({
      user: userMap[s.userId] || { username: '未知用户', role: 'unknown' },
      count: s._count,
      revenue: {
        bones: s._sum.bonesSpent || 0,
        fish: s._sum.fishSpent || 0,
        gems: s._sum.gemsSpent || 0,
        hearts: s._sum.heartsSpent || 0,
        stars: s._sum.starsSpent || 0,
      },
    }));

    res.json({
      success: true,
      data: {
        items: {
          total: totalItems,
          active: activeItems,
          byCategory: itemStats,
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          byStatus: orderStats || [],
        },
        revenue: {
          total: revenue._sum,
          today: todayRevenue._sum,
        },
        topItems,
        topUsers,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
