/**
 * 初始化成就数据
 * 功能：创建基础成就定义
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  // 任务相关成就
  {
    name: '初出茅庐',
    description: '完成第一个任务',
    category: 'TASK',
    condition: JSON.stringify({ type: 'task_completed', target: 1 }),
    points: 10,
    iconUrl: '/achievements/first_task.png',
  },
  {
    name: '持之以恒',
    description: '累计完成 10 个任务',
    category: 'TASK',
    condition: JSON.stringify({ type: 'task_completed', target: 10 }),
    points: 50,
    iconUrl: '/achievements/persistent.png',
  },
  {
    name: '任务达人',
    description: '累计完成 50 个任务',
    category: 'TASK',
    condition: JSON.stringify({ type: 'task_completed', target: 50 }),
    points: 200,
    iconUrl: '/achievements/master.png',
  },
  {
    name: '七日挑战',
    description: '连续完成任务 7 天',
    category: 'TASK',
    condition: JSON.stringify({ type: 'task_streak', target: 7 }),
    points: 100,
    iconUrl: '/achievements/streak_7.png',
  },
  
  // 关系相关成就
  {
    name: '携手同行',
    description: '建立第一段伙伴关系',
    category: 'RELATIONSHIP',
    condition: JSON.stringify({ type: 'relationship_days', target: 1 }),
    points: 20,
    iconUrl: '/achievements/partner.png',
  },
  {
    name: '百日之约',
    description: '伙伴关系维持 100 天',
    category: 'RELATIONSHIP',
    condition: JSON.stringify({ type: 'relationship_days', target: 100 }),
    points: 500,
    iconUrl: '/achievements/100days.png',
  },
  
  // 小屋相关成就
  {
    name: '温馨小屋',
    description: '小屋温暖度达到 100',
    category: 'COTTAGE',
    condition: JSON.stringify({ type: 'warmth_level', target: 100 }),
    points: 50,
    iconUrl: '/achievements/cozy_home.png',
  },
  {
    name: '装饰达人',
    description: '装备 10 件装饰物品',
    category: 'COTTAGE',
    condition: JSON.stringify({ type: 'decoration_count', target: 10 }),
    points: 80,
    iconUrl: '/achievements/decorator.png',
  },
  {
    name: '豪宅主人',
    description: '小屋温暖度达到 500',
    category: 'COTTAGE',
    condition: JSON.stringify({ type: 'warmth_level', target: 500 }),
    points: 300,
    iconUrl: '/achievements/mansion.png',
  },
  
  // 收集相关成就
  {
    name: '收藏家',
    description: '收集一个完整系列的装饰',
    category: 'COLLECTION',
    condition: JSON.stringify({ type: 'decoration_count', target: 5 }),
    points: 100,
    iconUrl: '/achievements/collector.png',
  },
];

async function main() {
  console.log('开始初始化成就数据...');

  for (const achievement of achievements) {
    const existing = await prisma.achievement.findFirst({
      where: { name: achievement.name },
    });

    if (!existing) {
      await prisma.achievement.create({
        data: achievement,
      });
      console.log(`✅ 创建成就：${achievement.name}`);
    } else {
      console.log(`⏭️  跳过已存在成就：${achievement.name}`);
    }
  }

  console.log('\n成就数据初始化完成！');
  await prisma.$disconnect();
}

main().catch(console.error);
