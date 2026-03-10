/**
 * 成就系统服务
 * 功能：成就条件检查/自动解锁/进度追踪
 */

import { prisma } from '../db';

/**
 * 成就条件类型
 */
export type AchievementCondition = {
  type: 'task_completed' | 'task_streak' | 'relationship_days' | 'relationship_established' | 'warmth_level' | 'decoration_count' | 'decoration_equipped' | 'cottage_upgraded';
  target: number;
  metric?: string;
};

/**
 * 检查并解锁用户成就
 */
export async function checkAndUnlockAchievements(userId: number, eventType: string, eventData: any) {
  try {
    // 获取所有成就
    const achievements = await prisma.achievement.findMany();
    
    // 获取用户已解锁的成就
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

    // 检查每个未解锁的成就
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const condition = JSON.parse(achievement.condition) as AchievementCondition;
      const isUnlocked = await checkCondition(userId, condition, eventType, eventData);

      if (isUnlocked) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            unlockedAt: new Date(),
            isClaimed: false,
          },
        });
        console.log(`用户 ${userId} 解锁成就：${achievement.name}`);
      }
    }
  } catch (error) {
    console.error('检查成就解锁失败:', error);
  }
}

/**
 * 检查单个成就条件
 */
async function checkCondition(
  userId: number,
  condition: AchievementCondition,
  eventType: string,
  eventData: any
): Promise<boolean> {
  switch (condition.type) {
    case 'task_completed': {
      // 完成任务数量
      const count = await prisma.task.count({
        where: {
          growerId: userId,
          status: 'COMPLETED',
        },
      });
      return count >= condition.target;
    }

    case 'task_streak': {
      // 连续打卡天数（需要更复杂的逻辑）
      // 简化版本：检查最近连续完成的任务
      const recentTasks = await prisma.task.findMany({
        where: {
          growerId: userId,
          status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
        take: condition.target,
      });
      return recentTasks.length >= condition.target;
    }

    case 'relationship_days': {
      // 关系维持天数
      const relationships = await prisma.relationship.findMany({
        where: {
          OR: [{ guideId: userId }, { growerId: userId }],
          status: 'ACTIVE',
        },
      });
      const now = new Date();
      for (const rel of relationships) {
        if (rel.startDate) {
          const days = Math.floor((now.getTime() - new Date(rel.startDate).getTime()) / (1000 * 60 * 60 * 24));
          if (days >= condition.target) return true;
        }
      }
      return false;
    }

    case 'warmth_level': {
      // 小屋温暖度等级
      const cottage = await prisma.cottage.findUnique({
        where: { growerId: userId },
      });
      return cottage ? cottage.warmth >= condition.target : false;
    }

    case 'decoration_count': {
      // 装饰物品数量
      const count = await prisma.userDecoration.count({
        where: {
          userId,
          isEquipped: true,
        },
      });
      return count >= condition.target;
    }

    case 'relationship_established': {
      // 建立关系数量
      const count = await prisma.relationship.count({
        where: {
          OR: [{ guideId: userId }, { growerId: userId }],
          status: 'ACTIVE',
        },
      });
      return count >= condition.target;
    }

    case 'decoration_equipped': {
      // 累计装备装饰次数（需要额外字段追踪，简化为检查当前装备数量）
      const count = await prisma.userDecoration.count({
        where: {
          userId,
          isEquipped: true,
        },
      });
      return count >= condition.target;
    }

    case 'cottage_upgraded': {
      // 小屋等级
      const cottage = await prisma.cottage.findUnique({
        where: { growerId: userId },
      });
      return cottage ? cottage.level >= condition.target : false;
    }

    default:
      return false;
  }
}

/**
 * 获取用户成就进度
 */
export async function getUserAchievementProgress(userId: number) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: { unlockedAt: 'desc' },
  });

  const totalAchievements = await prisma.achievement.count();
  const unlockedCount = userAchievements.length;

  return {
    total: totalAchievements,
    unlocked: unlockedCount,
    achievements: userAchievements.map(ua => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      iconUrl: ua.achievement.iconUrl,
      category: ua.achievement.category,
      points: ua.achievement.points,
      unlockedAt: ua.unlockedAt,
      isClaimed: ua.isClaimed,
      progress: ua.progress,
    })),
  };
}

export default {
  checkAndUnlockAchievements,
  getUserAchievementProgress,
};
