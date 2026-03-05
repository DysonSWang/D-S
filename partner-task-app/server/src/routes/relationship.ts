import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ConflictError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/relationships/invite
 * 发送关系邀请
 */
router.post('/invite', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { growerUsername, mode = 'PARTNER', agreementContent } = req.body;
    const guideId = req.user!.id;

    // 验证：引导者才能发送邀请
    if (req.user!.role !== 'GUIDE' && req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('Only guides can send invitations');
    }

    // 查找成长者
    const grower = await prisma.user.findFirst({
      where: { username: growerUsername, role: 'GROWER' },
    });

    if (!grower) {
      throw new NotFoundError('User not found or is not a grower');
    }

    // 检查是否已存在关系
    const existing = await prisma.relationship.findFirst({
      where: {
        OR: [
          { guideId, growerId: grower.id },
          { guideId: grower.id, growerId: guideId },
        ],
      },
    });

    if (existing) {
      throw new ConflictError('Relationship already exists');
    }

    // 创建关系（待确认状态）
    const relationship = await prisma.relationship.create({
      data: {
        guideId,
        growerId: grower.id,
        mode: mode.toUpperCase(),
        status: 'PENDING',
        agreementContent: agreementContent || null,
        guideSign: null,
        growerSign: null,
      },
      include: {
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
      },
    });

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: grower.id,
        type: 'RELATIONSHIP',
        title: '收到关系邀请',
        content: `${req.user!.nickname} 邀请你建立伙伴关系`,
        link: `/relationships/${relationship.id}`,
      },
    });

    res.status(201).json({
      message: 'Invitation sent successfully',
      relationship,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/relationships/accept
 * 接受关系邀请
 */
router.post('/accept', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { relationshipId, growerSign } = req.body;
    const growerId = req.user!.id;

    // 查找关系
    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        guide: { select: { id: true, username: true, nickname: true } },
        grower: { select: { id: true, username: true, nickname: true } },
      },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    // 验证：只有成长者才能接受
    if (relationship.growerId !== growerId) {
      throw new ForbiddenError('You are not the grower in this relationship');
    }

    // 检查状态
    if (relationship.status !== 'PENDING') {
      throw new ConflictError('Relationship is not in pending status');
    }

    // 更新关系状态
    const updated = await prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: 'ACTIVE',
        growerSign: growerSign || null,
        startDate: new Date(),
      },
      include: {
        guide: { select: { id: true, username: true, nickname: true } },
        grower: { select: { id: true, username: true, nickname: true } },
      },
    });

    // 为成长者创建初始奖励账户
    await prisma.reward.create({
      data: {
        growerId,
        bones: 100, // 初始奖励
        fish: 10,
        gems: 5,
      },
    });

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: relationship.guideId,
        type: 'RELATIONSHIP',
        title: '关系已建立',
        content: `${req.user!.nickname} 接受了你的邀请`,
        link: `/relationships/${relationshipId}`,
      },
    });

    res.json({
      message: 'Relationship accepted successfully',
      relationship: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/relationships/reject
 * 拒绝关系邀请
 */
router.post('/reject', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { relationshipId } = req.body;
    const growerId = req.user!.id;

    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    if (relationship.growerId !== growerId) {
      throw new ForbiddenError('You are not the grower in this relationship');
    }

    if (relationship.status !== 'PENDING') {
      throw new ConflictError('Relationship is not in pending status');
    }

    // 删除关系
    await prisma.relationship.delete({
      where: { id: relationshipId },
    });

    res.json({
      message: 'Invitation rejected',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/relationships/dissolve
 * 解除关系（进入冷静期）
 */
router.post('/dissolve', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { relationshipId } = req.body;
    const userId = req.user!.id;

    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        guide: { select: { id: true } },
        grower: { select: { id: true } },
      },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    // 验证：双方都可以发起解除
    if (relationship.guideId !== userId && relationship.growerId !== userId) {
      throw new ForbiddenError('You are not part of this relationship');
    }

    if (relationship.status !== 'ACTIVE') {
      throw new ConflictError('Relationship is not active');
    }

    // 设置冷静期（7 天）
    const coolingOffDeadline = new Date();
    coolingOffDeadline.setDate(coolingOffDeadline.getDate() + 7);

    const updated = await prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: 'DISSOLVING',
        coolingOffDeadline,
        endDate: coolingOffDeadline,
      },
    });

    // 通知对方
    const otherUserId = relationship.guideId === userId ? relationship.growerId : relationship.guideId;
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'RELATIONSHIP',
        title: '关系解除通知',
        content: '您的伙伴关系已进入 7 天冷静期，可随时撤销',
        link: `/relationships/${relationshipId}`,
      },
    });

    res.json({
      message: 'Relationship dissolution initiated (7-day cooling-off period)',
      relationship: updated,
      coolingOffDeadline,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/relationships/cancel-dissolution
 * 撤销解除（冷静期内）
 */
router.post('/cancel-dissolution', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { relationshipId } = req.body;
    const userId = req.user!.id;

    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    if (relationship.guideId !== userId && relationship.growerId !== userId) {
      throw new ForbiddenError('You are not part of this relationship');
    }

    if (relationship.status !== 'DISSOLVING') {
      throw new ConflictError('Relationship is not in cooling-off period');
    }

    // 检查是否过期
    if (relationship.coolingOffDeadline && new Date() > relationship.coolingOffDeadline) {
      // 已过期，正式解除
      await prisma.relationship.update({
        where: { id: relationshipId },
        data: { status: 'DISSOLVED' },
      });
      throw new ConflictError('Cooling-off period expired, relationship dissolved');
    }

    // 撤销解除
    const updated = await prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: 'ACTIVE',
        coolingOffDeadline: null,
        endDate: null,
      },
    });

    res.json({
      message: 'Dissolution cancelled, relationship restored',
      relationship: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/relationships/my
 * 获取我的关系列表
 */
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const where = {
      OR: [
        { guideId: userId },
        { growerId: userId },
      ],
    };

    if (status) {
      Object.assign(where, { status: status as string });
    }

    const relationships = await prisma.relationship.findMany({
      where,
      include: {
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        tasks: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      relationships,
      total: relationships.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/relationships/:id
 * 获取关系详情
 */
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const relationship = await prisma.relationship.findUnique({
      where: { id: parseInt(id) },
      include: {
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true, timezone: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true, timezone: true },
        },
        tasks: {
          include: {
            guide: { select: { username: true, nickname: true } },
            grower: { select: { username: true, nickname: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    // 验证权限
    if (relationship.guideId !== userId && relationship.growerId !== userId) {
      throw new ForbiddenError('You are not part of this relationship');
    }

    res.json({
      relationship,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
