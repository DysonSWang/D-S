/**
 * 用户偏好设置 API (修复版)
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/users/preferences
 * 获取当前用户偏好设置
 */
router.get('/preferences', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 安全解析 JSON 字段
    const safeJsonParse = (str: string | null, defaultValue: any) => {
      if (!str) return defaultValue;
      try {
        return JSON.parse(str);
      } catch (e) {
        return defaultValue;
      }
    };

    res.json({
      success: true,
      data: {
        userId: user.id,
        nickname: user.nickname,
        taskPreferences: safeJsonParse(user.taskPreferences, {}),
        rewardPreferences: safeJsonParse(user.rewardPreferences, { preferred: 'bones' }),
        suggestionStyle: user.suggestionStyle || 'gentle',
        availableTimeSlots: safeJsonParse(user.availableTimeSlots, []),
        boundaries: safeJsonParse(user.boundaries, []),
      },
    });
  } catch (error: any) {
    console.error('偏好设置 API 错误:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: error.message || '服务器内部错误',
    });
  }
});

export default router;
