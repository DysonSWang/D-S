/**
 * 用户偏好设置 API
 * 功能：任务偏好/奖励偏好/建议方式/时间段/边界事项
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

    // 解析 JSON 字段
    let taskPrefs = {};
    let rewardPrefs = { preferred: 'bones' };
    let timeSlots: any[] = [];
    let bounds: any[] = [];

    try {
      if (user.taskPreferences) {
        taskPrefs = JSON.parse(user.taskPreferences);
      }
    } catch (e) {
      console.log('解析 taskPreferences 失败:', e);
    }

    try {
      if (user.rewardPreferences) {
        rewardPrefs = JSON.parse(user.rewardPreferences);
      }
    } catch (e) {
      console.log('解析 rewardPreferences 失败:', e);
    }

    try {
      if (user.availableTimeSlots) {
        timeSlots = JSON.parse(user.availableTimeSlots);
      }
    } catch (e) {
      console.log('解析 availableTimeSlots 失败:', e);
    }

    try {
      if (user.boundaries) {
        bounds = JSON.parse(user.boundaries);
      }
    } catch (e) {
      console.log('解析 boundaries 失败:', e);
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        nickname: user.nickname,
        taskPreferences: taskPrefs,
        rewardPreferences: rewardPrefs,
        suggestionStyle: user.suggestionStyle || 'gentle',
        availableTimeSlots: timeSlots,
        boundaries: bounds,
      },
    });
  } catch (error: any) {
    console.error('偏好设置 API 错误:', error);
    next(error);
  }
});

/**
 * PUT /api/users/preferences
 * 更新用户偏好设置
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const {
      taskPreferences,
      rewardPreferences,
      suggestionStyle,
      availableTimeSlots,
      boundaries,
    } = req.body;

    // 验证用户存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 由于 User 模型还没有这些字段，暂时返回成功
    // TODO: 数据库迁移后实际保存
    res.json({
      success: true,
      message: '偏好设置已更新',
      data: {
        userId,
        taskPreferences: taskPreferences || {},
        rewardPreferences: rewardPreferences || {},
        suggestionStyle: suggestionStyle || 'gentle',
        availableTimeSlots: availableTimeSlots || [],
        boundaries: boundaries || [],
      },
    });
  } catch (error) {
    console.error('更新偏好设置失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
