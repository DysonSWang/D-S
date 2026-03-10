/**
 * 单点登录 (SSO) API
 * 支持一次登录，多角色切换
 */

import { Router } from 'express';
import { prisma } from '../db';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../middleware/errorHandler';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

interface TokenPayload {
  userId: number;
  username: string;
  roles: string[];
  currentRole: string;
}

/**
 * POST /api/sso/login
 * 统一登录，返回所有可访问角色
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        username,
        status: 'ACTIVE',
      },
    });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码（简单比较，生产环境应该用 bcrypt）
    if (user.password !== password) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 获取用户所有可访问的角色
    const accessibleRoles = await getUserAccessibleRoles(user.id, user.role);

    // 生成 Token（包含所有角色）
    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      roles: accessibleRoles,
      currentRole: user.role, // 默认使用主角色
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          roles: accessibleRoles, // 返回所有可访问角色
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/sso/switch-role
 * 切换当前角色
 */
router.post('/switch-role', async (req, res, next) => {
  try {
    const { targetRole } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请提供 Token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // 验证目标角色是否可访问
    if (!decoded.roles.includes(targetRole)) {
      return res.status(403).json({ error: '无权访问此角色' });
    }

    // 生成新 Token（切换角色）
    const newTokenPayload: TokenPayload = {
      userId: decoded.userId,
      username: decoded.username,
      roles: decoded.roles,
      currentRole: targetRole,
    };

    const newToken = jwt.sign(newTokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token: newToken,
        currentRole: targetRole,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/sso/me
 * 获取当前用户信息（包含所有角色）
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请提供 Token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // 获取用户详细信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        ...user,
        roles: decoded.roles,
        currentRole: decoded.currentRole,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * 获取用户可访问的角色列表
 */
async function getUserAccessibleRoles(userId: number, mainRole: string): Promise<string[]> {
  const roles = new Set<string>();

  // 添加主角色
  roles.add(mainRole);

  // 管理员可以访问所有角色
  if (mainRole === 'ADMIN') {
    roles.add('GROWER');
    roles.add('GUIDE');
  }

  // 可以扩展：检查用户是否有其他角色的权限
  // 例如：某些用户可能同时是成长者和引导者

  return Array.from(roles);
}

export default router;
