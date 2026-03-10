/**
 * Relationship Request Validators
 * 使用 Zod 进行请求体验证
 */

import { z } from 'zod';

// 关系模式枚举
export const RelationshipModeSchema = z.enum(['PARTNER', 'GUIDE_GROWER']).default('PARTNER');

// 发送关系邀请
export const InviteSchema = z.object({
  growerUsername: z.string()
    .min(1, '用户名不能为空')
    .max(50, '用户名不能超过 50 个字符'),
  mode: RelationshipModeSchema,
  agreementContent: z.string()
    .max(2000, '协议内容不能超过 2000 个字符')
    .optional(),
});

// 确认关系
export const ConfirmRelationshipSchema = z.object({
  relationshipId: z.number().positive('关系 ID 必须大于 0'),
  agreed: z.boolean(),
});

// 解除关系
export const TerminateRelationshipSchema = z.object({
  relationshipId: z.number().positive('关系 ID 必须大于 0'),
  reason: z.string()
    .min(1, '原因不能为空')
    .max(500, '原因不能超过 500 个字符'),
  immediate: z.boolean().default(false),
});

// 导出类型
export type InviteInput = z.infer<typeof InviteSchema>;
export type ConfirmRelationshipInput = z.infer<typeof ConfirmRelationshipSchema>;
export type TerminateRelationshipInput = z.infer<typeof TerminateRelationshipSchema>;
