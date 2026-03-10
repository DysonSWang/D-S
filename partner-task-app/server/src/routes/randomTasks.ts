/**
 * 随机任务 API
 * 功能：随机任务抽取/接受/放弃
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// 随机任务池（简化版，实际应该从数据库读取）
const RANDOM_TASKS = [
  {
    name: '主动联系一位老朋友',
    description: '给至少一个月没联系的朋友发消息或打电话',
    difficulty: 2,
    category: 'SOCIAL',
    reward: { bones: 50, hearts: 10 },
  },
  {
    name: '记录今天发生的三件好事',
    description: '写下今天发生的三件让你感到开心或感恩的事情',
    difficulty: 1,
    category: 'REFLECTION',
    reward: { bones: 30, hearts: 5 },
  },
  {
    name: '尝试一项新的运动',
    description: '尝试一个你从未做过的运动项目，至少 30 分钟',
    difficulty: 3,
    category: 'ACTION',
    reward: { bones: 80, fish: 20 },
  },
  {
    name: '学习一道新菜',
    description: '找一道从未做过的菜，学习并制作出来',
    difficulty: 3,
    category: 'CREATIVE',
    reward: { bones: 80, fish: 20 },
  },
  {
    name: '公开演讲练习',
    description: '在一个小组或会议上发表一次观点或演讲',
    difficulty: 4,
    category: 'SOCIAL',
    reward: { bones: 120, gems: 10 },
  },
  {
    name: '整理房间',
    description: '彻底整理你的房间或工作区域，丢弃不需要的物品',
    difficulty: 2,
    category: 'ACTION',
    reward: { bones: 50, hearts: 10 },
  },
  {
    name: '写一封感谢信',
    description: '给帮助过你的人写一封感谢信（可以不寄出）',
    difficulty: 2,
    category: 'COMMUNICATION',
    reward: { bones: 50, hearts: 15 },
  },
  {
    name: '挑战一天不抱怨',
    description: '在一整天内不抱怨任何事情，保持积极心态',
    difficulty: 4,
    category: 'REFLECTION',
    reward: { bones: 120, gems: 10 },
  },
];

/**
 * GET /api/tasks/random/draw
 * 抽取随机任务
 */
router.get('/draw', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { difficulty } = req.query;

    // 过滤任务池
    let availableTasks = RANDOM_TASKS;
    if (difficulty) {
      const diffLevel = parseInt(difficulty as string);
      availableTasks = RANDOM_TASKS.filter(t => t.difficulty === diffLevel);
    }

    if (availableTasks.length === 0) {
      return res.status(404).json({ error: '没有可用的随机任务' });
    }

    // 随机选择一个任务
    const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];

    res.json({
      success: true,
      data: {
        task: randomTask,
        drawTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('抽取随机任务失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/tasks/random/accept
 * 接受随机任务
 */
router.post('/accept', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { task } = req.body;

    // 获取用户的关系
    const relationship = await prisma.relationship.findFirst({
      where: {
        OR: [{ guideId: userId }, { growerId: userId }],
        status: 'ACTIVE',
      },
    });

    if (!relationship) {
      return res.status(400).json({ error: '没有活跃的伙伴关系' });
    }

    // 创建任务
    const newTask = await prisma.task.create({
      data: {
        relationshipId: relationship.id,
        guideId: relationship.guideId,
        growerId: relationship.growerId,
        name: task.name,
        description: task.description,
        difficulty: task.difficulty,
        type: 'RANDOM',
        status: 'PENDING',
        proofType: 'TEXT',
        rewardConfig: JSON.stringify(task.reward),
      },
    });

    res.json({
      success: true,
      message: '已接受随机任务',
      data: newTask,
    });
  } catch (error) {
    console.error('接受随机任务失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/tasks/random/decline
 * 放弃随机任务
 */
router.post('/decline', authenticate, async (req, res) => {
  try {
    // 简单返回成功，实际可以记录放弃次数
    res.json({
      success: true,
      message: '已放弃本次随机任务',
    });
  } catch (error) {
    console.error('放弃随机任务失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
