/**
 * 系统日志 API
 * 提供系统日志和错误报告功能
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * GET /api/admin/logs
 * 查看系统日志
 */
router.get('/logs', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { level, limit = 100 } = req.query;
    
    // 读取日志文件
    const logFile = path.join(process.cwd(), '../logs/app.log');
    
    let logs: string[] = [];
    
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8');
      logs = content.split('\n').filter(line => line.trim());
      
      // 按级别过滤
      if (level) {
        logs = logs.filter(line => line.includes(level as string));
      }
      
      // 限制数量
      logs = logs.slice(-parseInt(limit as string));
    }

    res.json({
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/errors
 * 查看错误报告
 */
router.get('/errors', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    // 从日志文件中提取错误
    const logFile = path.join(process.cwd(), '../logs/error.log');
    
    let errors: string[] = [];
    
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8');
      errors = content.split('\n').filter(line => line.trim());
      
      // 限制数量
      errors = errors.slice(-parseInt(limit as string));
    }

    // 统计错误类型
    const errorStats: Record<string, number> = {};
    errors.forEach(error => {
      const match = error.match(/Error:\s*(\w+)/);
      if (match) {
        const errorType = match[1];
        errorStats[errorType] = (errorStats[errorType] || 0) + 1;
      }
    });

    res.json({
      errors,
      stats: errorStats,
      total: errors.length,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/config
 * 获取系统配置
 */
router.get('/config', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    const configMap: Record<string, any> = {};
    configs.forEach(config => {
      configMap[config.key] = config.value;
    });

    res.json({
      config: configMap,
      total: configs.length,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * PUT /api/admin/config
 * 更新系统配置
 */
router.put('/config', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: '配置数据格式错误' });
    }

    const updatePromises = Object.entries(updates).map(([key, value]) => {
      return prisma.systemConfig.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    });

    await Promise.all(updatePromises);

    res.json({
      message: '配置更新成功',
      updated: Object.keys(updates).length,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/grower-progress/:id
 * 查看成长者进度
 */
router.get('/grower-progress/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // 用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        status: true,
        ageVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 任务统计
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { growerId: userId },
      _count: true,
    });

    // 成就统计
    const achievementCount = await prisma.userAchievement.count({
      where: { userId },
    });

    // 小屋信息
    const cottage = await prisma.cottage.findUnique({
      where: { growerId: userId },
    });

    // 奖励信息
    const reward = await prisma.reward.findUnique({
      where: { growerId: userId },
    });

    res.json({
      user,
      stats: {
        tasks: taskStats,
        achievements: achievementCount,
      },
      cottage,
      reward,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/admin/guide-stats/:id
 * 查看引导者统计
 */
router.get('/guide-stats/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const guideId = parseInt(id);

    // 用户信息
    const user = await prisma.user.findUnique({
      where: { id: guideId },
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 关系统计
    const relationshipStats = await prisma.relationship.groupBy({
      by: ['status'],
      where: { guideId },
      _count: true,
    });

    // 任务统计
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { guideId },
      _count: true,
    });

    res.json({
      user,
      stats: {
        relationships: relationshipStats,
        tasks: taskStats,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
