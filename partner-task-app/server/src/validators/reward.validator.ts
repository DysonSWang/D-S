/**
 * Reward Request Validators
 * 使用 Zod 进行请求体验证
 */

import { z } from 'zod';

// 发放奖励
export const GiveRewardSchema = z.object({
  growerId: z.number().positive('成长者 ID 必须大于 0'),
  bones: z.number().int().min(0).optional(),
  fish: z.number().int().min(0).optional(),
  gems: z.number().int().min(0).optional(),
  reason: z.string()
    .min(1, '原因不能为空')
    .max(200, '原因不能超过 200 个字符'),
}).refine(
  data => data.bones || data.fish || data.gems,
  { message: '至少指定一种奖励类型' }
);

// 兑换奖励
export const RedeemRewardSchema = z.object({
  itemId: z.number().positive('商品 ID 必须大于 0'),
  itemName: z.string()
    .min(1, '商品名称不能为空')
    .max(100, '商品名称不能超过 100 个字符'),
  cost: z.object({
    bones: z.number().int().min(0).optional(),
    fish: z.number().int().min(0).optional(),
    gems: z.number().int().min(0).optional(),
  }).refine(
    cost => cost.bones || cost.fish || cost.gems,
    { message: '至少指定一种支付方式' }
  ),
});

// 获取奖励流水查询参数
export const GetTransactionsQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).catch(50),
  offset: z.string().transform(val => parseInt(val, 10)).catch(0),
});

// 导出类型
export type GiveRewardInput = z.infer<typeof GiveRewardSchema>;
export type RedeemRewardInput = z.infer<typeof RedeemRewardSchema>;
export type GetTransactionsQuery = z.infer<typeof GetTransactionsQuerySchema>;
