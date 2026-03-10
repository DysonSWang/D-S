/**
 * 成就系统 API
 * 功能：成就列表/用户成就/领取奖励
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';
import { getUserAchievementProgress } from '../services/achievementService';

const router = Router();

/**
 * GET /api/achievements
 * 获取所有成就列表
 */
router.get('/', async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { id: 'asc' },
    });

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('获取成就列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/achievements/my
 * 获取当前用户的成就进度
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const progress = await getUserAchievementProgress(userId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('获取用户成就失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/achievements/:id/claim
 * 领取成就奖励
 */
router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const achievementId = parseInt(req.params.id);

    // 检查成就是否已解锁
    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (!userAchievement) {
      return res.status(404).json({ error: '成就未解锁' });
    }

    if (userAchievement.isClaimed) {
      return res.status(400).json({ error: '奖励已领取' });
    }

    // 获取成就信息
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      return res.status(404).json({ error: '成就存在' });
    }

    // 更新为已领取
    await prisma.userAchievement.update({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
      data: {
        isClaimed: true,
      },
    });

    // TODO: 发放成就点数或奖励
    // await rewardService.addPoints(userId, achievement.points);

    res.json({
      success: true,
      message: '成就奖励已领取',
      data: {
        achievementId,
        points: achievement.points,
      },
    });
  } catch (error) {
    console.error('领取成就奖励失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
