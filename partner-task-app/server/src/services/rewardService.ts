/**
 * Reward Service Layer
 * 奖励业务逻辑层，处理所有奖励相关的核心业务
 */

import { prisma } from '../db';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler';

export interface GiveRewardInput {
  growerId: number;
  guideId: number;
  bones?: number;
  fish?: number;
  gems?: number;
  reason: string;
}

/**
 * 获取或创建奖励账户
 */
export async function getOrCreateReward(growerId: number) {
  let reward = await prisma.reward.findUnique({
    where: { growerId },
  });

  if (!reward) {
    reward = await prisma.reward.create({
      data: {
        growerId,
        bones: 100,
        fish: 10,
        gems: 5,
      },
    });
  }

  return reward;
}

/**
 * 获取奖励资产
 */
export async function getReward(growerId: number) {
  const reward = await prisma.reward.findUnique({
    where: { growerId },
  });

  if (!reward) {
    throw new NotFoundError('Reward account not found');
  }

  return reward;
}

/**
 * 获取奖励流水
 */
export async function getRewardTransactions(rewardId: number, limit = 50, offset = 0) {
  const [transactions, total] = await Promise.all([
    prisma.rewardTransaction.findMany({
      where: { rewardId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.rewardTransaction.count({ where: { rewardId } }),
  ]);

  return { transactions, total };
}

/**
 * 发放奖励
 */
export async function giveReward(input: GiveRewardInput) {
  const { growerId, guideId, bones = 0, fish = 0, gems = 0, reason } = input;

  // 验证成长者
  const grower = await prisma.user.findUnique({
    where: { id: growerId },
  });

  if (!grower) {
    throw new NotFoundError('Grower not found');
  }

  if (grower.role !== 'GROWER') {
    throw new ForbiddenError('User is not a grower');
  }

  // 验证引导者
  const guide = await prisma.user.findUnique({
    where: { id: guideId },
  });

  if (!guide) {
    throw new NotFoundError('Guide not found');
  }

  if (guide.role !== 'GUIDE' && guide.role !== 'ADMIN') {
    throw new ForbiddenError('Only guides can give rewards');
  }

  // 验证至少有一种奖励
  if (bones <= 0 && fish <= 0 && gems <= 0) {
    throw new BadRequestError('At least one reward type must be specified');
  }

  // 获取或创建奖励账户
  const reward = await getOrCreateReward(growerId);

  // 更新奖励账户
  const updatedReward = await prisma.reward.update({
    where: { id: reward.id },
    data: {
      bones: { increment: bones },
      fish: { increment: fish },
      gems: { increment: gems },
    },
  });

  // 创建奖励流水
  await prisma.rewardTransaction.create({
    data: {
      rewardId: reward.id,
      type: 'GIFT',
      amount: bones + fish * 10 + gems * 100,
      balance: updatedReward.bones,
      reason: reason,
    },
  });

  // 创建通知
  await prisma.notification.create({
    data: {
      userId: growerId,
      type: 'REWARD',
      title: '收到奖励',
      content: `${guide.nickname} 给你发放了奖励`,
      link: '/rewards',
    },
  });

  return updatedReward;
}

/**
 * 批量发放奖励（用于任务完成等场景）
 */
export async function batchGiveReward(
  growerId: number,
  rewards: { bones?: number; fish?: number; gems?: number; reason?: string }
) {
  const reward = await getOrCreateReward(growerId);

  const { bones = 0, fish = 0, gems = 0, reason = '奖励发放' } = rewards;

  // 更新奖励账户
  const updatedReward = await prisma.reward.update({
    where: { id: reward.id },
    data: {
      bones: { increment: bones },
      fish: { increment: fish },
      gems: { increment: gems },
    },
  });

  // 创建奖励流水
  await prisma.rewardTransaction.create({
    data: {
      rewardId: reward.id,
      type: 'EARN',
      amount: bones + fish * 10 + gems * 100,
      balance: updatedReward.bones,
      reason: reason,
    },
  });

  return updatedReward;
}
