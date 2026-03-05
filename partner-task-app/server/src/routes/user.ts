import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 用户管理 API
 */
import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/users
 * 获取用户列表（管理员）
 */
router.get('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { role, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = parseInt(status as string);
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id
 * 获取用户详情（管理员）
 */
router.get('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        ageVerified: true,
        timezone: true,
        safetyWordYellow: true,
        safetyWordRed: true,
        createdAt: true,
        updatedAt: true,
        guideRelationships: {
          select: {
            id: true,
            status: true,
            grower: {
              select: {
                id: true,
                username: true,
                nickname: true,
              },
            },
          },
        },
        growerRelationships: {
          select: {
            id: true,
            status: true,
            guide: {
              select: {
                id: true,
                username: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:id/status
 * 更新用户状态（管理员）
 */
router.put('/:id/status', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== 'number' || ![0, 1].includes(status)) {
      throw new ForbiddenError('Invalid status value');
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
      select: {
        id: true,
        username: true,
        status: true,
      },
    });

    res.json({
      message: 'User status updated',
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:id
 * 删除用户（管理员）
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
