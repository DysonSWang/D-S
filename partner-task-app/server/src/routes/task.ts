/**
 * Task Routes
 * 任务相关 API 端点
 * 
 * 技术债务修复：
 * - ✅ 使用单例 db 连接
 * - ✅ 使用 Service 层处理业务逻辑
 * - ✅ 使用 Zod 进行输入验证
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { BadRequestError } from '../middleware/errorHandler';
import * as taskService from '../services/taskService';
import { 
  CreateTaskSchema, 
  SubmitTaskSchema, 
  ReviewTaskSchema,
  GetTasksQuerySchema 
} from '../validators/task.validator';

const router = Router();

/**
 * GET /api/tasks
 * 获取用户的任务列表
 */
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { status, type, limit = 50, offset = 0 } = req.query;

    const where: any = {
      OR: [
        { guideId: userId },
        { growerId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        guide: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        grower: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        relationship: {
          select: { id: true, mode: true, status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.task.count({ where });

    res.json({
      tasks,
      total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks
 * 创建任务（引导者发布）
 */
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // 验证请求体
    const validationResult = CreateTaskSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError(validationResult.error.issues[0].message);
    }

    const validatedData = validationResult.data;
    const guideId = req.user!.id;

    // 调用 Service 层
    const task = await taskService.createTask({
      ...validatedData,
      guideId,
      deadline: validatedData.deadline ? new Date(validatedData.deadline as any) : undefined,
    });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/start
 * 开始任务
 */
router.post('/:id/start', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const growerId = req.user!.id;

    const task = await taskService.startTask(taskId, growerId);

    res.json({
      message: 'Task started',
      task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/submit
 * 提交打卡
 */
router.post('/:id/submit', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    
    // 验证请求体
    const validationResult = SubmitTaskSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError(validationResult.error.issues[0].message);
    }

    const validatedData = validationResult.data;
    const growerId = req.user!.id;

    const task = await taskService.submitTask({
      taskId,
      growerId,
      ...validatedData,
    });

    res.json({
      message: 'Task submitted for review',
      task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:id/review
 * 审核任务
 */
router.post('/:id/review', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { approved } = req.body;
    const guideId = req.user!.id;

    // 验证请求体
    const validationResult = ReviewTaskSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError(validationResult.error.issues[0].message);
    }

    const task = await taskService.reviewTask({
      taskId,
      guideId,
      approved,
      feedback: validationResult.data.feedback,
    });

    res.json({
      message: `Task ${approved ? 'approved' : 'rejected'}`,
      task,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/my
 * 获取我的任务列表
 */
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    
    // 验证查询参数
    const queryValidation = GetTasksQuerySchema.safeParse(req.query);
    const { status, limit, offset } = queryValidation.success 
      ? queryValidation.data 
      : { limit: 50, offset: 0 };

    const { tasks, total } = await taskService.getUserTasks(userId, status, limit, offset);

    res.json({
      tasks,
      total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:id
 * 获取任务详情
 */
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const task = await taskService.getTaskById(taskId, userId);

    res.json({
      task: {
        ...task,
        myRole: task.guideId === userId ? 'guide' : 'grower',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tasks/:id
 * 取消任务
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const task = await taskService.cancelTask(taskId, userId);

    res.json({
      message: 'Task cancelled successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
