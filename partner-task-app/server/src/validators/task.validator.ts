/**
 * Task Request Validators
 * 使用 Zod 进行请求体验证
 */

import { z } from 'zod';

// 任务难度枚举
export const DifficultySchema = z.number().min(1).max(5).default(1);

// 证明类型枚举
export const ProofTypeSchema = z.enum(['TEXT', 'IMAGE', 'BOTH']).default('TEXT');

// 重复类型枚举
export const RepeatTypeSchema = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).default('NONE');

// 奖励配置
export const RewardConfigSchema = z.object({
  bones: z.number().int().min(0).optional(),
  fish: z.number().int().min(0).optional(),
  gems: z.number().int().min(0).optional(),
}).optional();

// 重复配置
export const RepeatConfigSchema = z.object({
  interval: z.number().int().min(1).optional(),
  maxOccurrences: z.number().int().min(1).optional(),
}).optional();

// 创建任务
export const CreateTaskSchema = z.object({
  relationshipId: z.number().int().positive('关系 ID 必须大于 0'),
  name: z.string().min(1, '任务名称不能为空').max(100, '任务名称不能超过 100 个字符'),
  description: z.string().min(1, '任务描述不能为空').max(1000, '任务描述不能超过 1000 个字符'),
  difficulty: DifficultySchema,
  proofType: ProofTypeSchema,
  rewardConfig: RewardConfigSchema,
  deadline: z.string().datetime().optional(),
  repeatType: RepeatTypeSchema,
  repeatConfig: RepeatConfigSchema,
});

// 开始任务 - 使用 URL 参数验证
export const TaskIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

// 提交任务
export const SubmitTaskSchema = z.object({
  proofText: z.string().min(1, '证明内容不能为空').optional(),
  proofImages: z.array(z.string().url()).max(5, '最多上传 5 张图片').optional(),
});

// 审核任务
export const ReviewTaskSchema = z.object({
  approved: z.boolean(),
  feedback: z.string().max(500, '反馈不能超过 500 个字符').optional(),
});

// 获取任务列表查询参数
export const GetTasksQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED', 'CANCELLED']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// 导出类型
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type SubmitTaskInput = z.infer<typeof SubmitTaskSchema>;
export type ReviewTaskInput = z.infer<typeof ReviewTaskSchema>;
export type GetTasksQuery = z.infer<typeof GetTasksQuerySchema>;
