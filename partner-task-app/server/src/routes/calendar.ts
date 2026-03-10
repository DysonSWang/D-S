/**
 * 任务日历 API
 * 功能：获取日历视图数据、任务分布统计
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/calendar/tasks
 * 获取指定月份的任务日历数据
 */
router.get('/tasks', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { year, month, view } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: '请提供年份和月份' });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    // 计算月份起止时间
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    // 获取用户的关系
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { guideId: userId },
          { growerId: userId },
        ],
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const relationshipIds = relationships.map(r => r.id);

    if (relationshipIds.length === 0) {
      return res.json({
        success: true,
        data: {
          days: [],
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            inProgress: 0,
          },
        },
      });
    }

    // 获取该月份的所有任务
    const tasks = await prisma.task.findMany({
      where: {
        relationshipId: { in: relationshipIds },
        OR: [
          { growerId: userId },
          { guideId: userId },
        ],
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 按日期分组
    const daysData: Record<string, any[]> = {};
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      pending: tasks.filter(t => t.status === 'PENDING').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    };

    tasks.forEach(task => {
      const dateKey = new Date(task.createdAt).toISOString().split('T')[0];
      if (!daysData[dateKey]) {
        daysData[dateKey] = [];
      }
      daysData[dateKey].push({
        id: task.id,
        name: task.name,
        status: task.status,
        type: task.type,
        difficulty: task.difficulty,
        completedAt: task.completedAt,
      });
    });

    // 生成完整的日历天数数据
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      days.push({
        date: dateKey,
        day,
        dayOfWeek,
        isToday: dateKey === new Date().toISOString().split('T')[0],
        tasks: daysData[dateKey] || [],
        hasTasks: (daysData[dateKey] || []).length > 0,
        completedCount: (daysData[dateKey] || []).filter((t: any) => t.status === 'COMPLETED').length,
      });
    }

    res.json({
      success: true,
      data: {
        year: yearNum,
        month: monthNum,
        days,
        stats,
      },
    });
  } catch (error) {
    console.error('获取日历任务失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/calendar/stats
 * 获取任务统计概览
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // 获取用户的关系
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { guideId: userId },
          { growerId: userId },
        ],
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const relationshipIds = relationships.map(r => r.id);

    if (relationshipIds.length === 0) {
      return res.json({
        success: true,
        data: {
          weekStats: [],
          monthTrend: [],
        },
      });
    }

    // 获取最近 7 天的任务统计
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekTasks = await prisma.task.findMany({
      where: {
        relationshipId: { in: relationshipIds },
        OR: [
          { growerId: userId },
          { guideId: userId },
        ],
        createdAt: { gte: weekAgo },
      },
    });

    // 按日期分组统计
    const weekStats: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayTasks = weekTasks.filter(t => 
        new Date(t.createdAt).toISOString().split('T')[0] === dateKey
      );

      weekStats.push({
        date: dateKey,
        day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        total: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'COMPLETED').length,
      });
    }

    // 获取最近 6 个月的趋势
    const monthTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      const monthTasks = await prisma.task.count({
        where: {
          relationshipId: { in: relationshipIds },
          OR: [
            { growerId: userId },
            { guideId: userId },
          ],
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const monthCompleted = await prisma.task.count({
        where: {
          relationshipId: { in: relationshipIds },
          OR: [
            { growerId: userId },
            { guideId: userId },
          ],
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthTrend.push({
        year,
        month: month + 1,
        label: `${year}年${month + 1}月`,
        total: monthTasks,
        completed: monthCompleted,
      });
    }

    res.json({
      success: true,
      data: {
        weekStats,
        monthTrend,
      },
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
