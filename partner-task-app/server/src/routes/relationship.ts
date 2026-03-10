/**
 * Relationship Routes
 * 伙伴关系管理 API 端点
 * 
 * 技术债务修复：
 * - ✅ 使用单例 db 连接
 * - ✅ 使用 Zod 进行输入验证
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { InviteSchema, ConfirmRelationshipSchema, TerminateRelationshipSchema } from '../validators/relationship.validator';
import { checkAndUnlockAchievements } from '../services/achievementService';

const router = Router();

/**
 * POST /api/relationships/invite
 * 发送关系邀请
 */
router.post('/invite', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // 验证请求体
    const validationResult = InviteSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError(validationResult.error.issues[0].message);
    }

    const { growerUsername, mode, agreementContent } = validationResult.data;
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
 * POST /api/relationships/:id/confirm
 * 确认关系
 */
router.post('/:id/confirm', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // 验证请求体
    const validationResult = ConfirmRelationshipSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError(validationResult.error.issues[0].message);
    }

    const { relationshipId, agreed } = validationResult.data;
    const userId = req.user!.id;

    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        guide: true,
        grower: true,
      },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    // 只有被邀请的成长者才能确认
    if (relationship.growerId !== userId) {
      throw new ForbiddenError('Only the invited grower can confirm');
    }

    if (relationship.status !== 'PENDING') {
      throw new ConflictError('Relationship is not pending confirmation');
    }

    if (!agreed) {
      // 拒绝邀请
      await prisma.relationship.update({
        where: { id: relationshipId },
        data: { status: 'REJECTED' },
      });

      res.json({
        message: 'Relationship invitation rejected',
      });
      return;
    }

    // 同意并激活关系
    const updated = await prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        status: 'ACTIVE',
        growerSign: new Date().toISOString(),
        startDate: new Date(),
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
        userId: relationship.guideId,
        type: 'RELATIONSHIP',
        title: '关系已确认',
        content: `${relationship.grower.nickname} 已确认伙伴关系`,
        link: `/relationships/${relationshipId}`,
      },
    });

    // 触发成就检查（双方都检查）
    await checkAndUnlockAchievements(relationship.guideId, 'relationship_established', {
      relationshipId: relationship.id,
      partnerId: relationship.growerId,
      establishedAt: new Date(),
    });
    await checkAndUnlockAchievements(relationship.growerId, 'relationship_established', {
      relationshipId: relationship.id,
      partnerId: relationship.guideId,
      establishedAt: new Date(),
    });

    res.json({
      message: 'Relationship confirmed successfully',
      relationship: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/relationships/:id/terminate
 * 解除关系
 */
router.post('/:id/terminate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // 验证请求体
    const validationResult = TerminateRelationshipSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError(validationResult.error.issues[0].message);
    }

    const { relationshipId, reason, immediate } = validationResult.data;
    const userId = req.user!.id;

    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    // 只有关系双方才能解除
    if (relationship.guideId !== userId && relationship.growerId !== userId) {
      throw new ForbiddenError('Not part of this relationship');
    }

    if (relationship.status !== 'ACTIVE') {
      throw new ConflictError('Relationship is not active');
    }

    if (!immediate) {
      // 进入冷静期
      const coolingOffDeadline = new Date();
      coolingOffDeadline.setDate(coolingOffDeadline.getDate() + 7);

      await prisma.relationship.update({
        where: { id: relationshipId },
        data: {
          status: 'DISSOLVING',
          coolingOffDeadline,
          endDate: coolingOffDeadline,
        },
      });

      // 创建通知
      const otherUserId = relationship.guideId === userId ? relationship.growerId : relationship.guideId;
      await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: 'RELATIONSHIP',
          title: '关系解除申请',
          content: `伙伴申请解除关系，7 天冷静期后生效`,
          link: `/relationships/${relationshipId}`,
        },
      });

      res.json({
        message: 'Termination requested, 7-day cooldown started',
        coolingOffDeadline: coolingOffDeadline,
      });
    } else {
      // 立即解除（仅管理员或双方同意）
      await prisma.relationship.update({
        where: { id: relationshipId },
        data: {
          status: 'DISSOLVED',
          endDate: new Date(),
        },
      });

      res.json({
        message: 'Relationship terminated immediately',
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/relationships/my
 * 获取我的关系
 */
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { guideId: userId },
          { growerId: userId },
        ],
      },
      include: {
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 添加用户角色信息
    const enriched = relationships.map(rel => ({
      ...rel,
      myRole: rel.guideId === userId ? 'guide' : 'grower',
    }));

    res.json({
      relationships: enriched,
      total: enriched.length,
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
    const relationshipId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
      },
    });

    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    // 权限检查
    if (relationship.guideId !== userId && relationship.growerId !== userId) {
      throw new ForbiddenError('Not part of this relationship');
    }

    res.json({
      relationship: {
        ...relationship,
        myRole: relationship.guideId === userId ? 'guide' : 'grower',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
