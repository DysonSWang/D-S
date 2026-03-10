/**
 * 请求体验证中间件
 * 使用 Zod 进行类型安全的请求体验证
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, z } from 'zod';
import { BadRequestError } from './errorHandler';

/**
 * 验证请求体
 * @param schema - Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const field = error.issues[0]?.path?.join('.') || 'unknown';
        const message = error.issues[0]?.message || '验证失败';
        throw new BadRequestError(`${field}: ${message}`);
      }
      next(error);
    }
  };
}

/**
 * 验证查询参数
 * @param schema - Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      Object.assign(req.query, validated);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const field = error.issues[0]?.path?.join('.') || 'unknown';
        const message = error.issues[0]?.message || '验证失败';
        throw new BadRequestError(`${field}: ${message}`);
      }
      next(error);
    }
  };
}

/**
 * 验证 URL 参数
 * @param schema - Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      Object.assign(req.params, validated);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const field = error.issues[0]?.path?.join('.') || 'unknown';
        const message = error.issues[0]?.message || '验证失败';
        throw new BadRequestError(`${field}: ${message}`);
      }
      next(error);
    }
  };
}

/**
 * ID 参数验证 schema
 */
export const idParamsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});
