/**
 * 用户偏好设置 API
 * 功能：任务偏好/奖励偏好/建议方式/时间段/边界事项
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/users/preferences
 * 获取当前用户偏好设置
 */
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        // 偏好设置字段（需要从 User 模型扩展）
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 返回偏好设置（如果字段不存在，返回默认值）
    res.json({
      success: true,
      data: {
        userId: user.id,
        // 任务类型偏好 (1-5 星评分)
        taskPreferences: {
          communication: 0, // 沟通类
          action: 0,        // 行动类
          reflection: 0,    // 反思类
          social: 0,        // 社交类
          creative: 0,      // 创意类
        },
        // 奖励偏好
        rewardPreferences: {
          preferred: 'bones', // bones/fish/gems/hearts/stars
        },
        // 建议方式偏好
        suggestionStyle: 'gentle', // gentle/direct/humorous
        // 可支配时间段
        availableTimeSlots: [],
        // 边界事项
        boundaries: [],
      },
    });
  } catch (error) {
    console.error('获取偏好设置失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
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
