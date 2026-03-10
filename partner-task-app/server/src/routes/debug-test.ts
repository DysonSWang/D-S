/**
 * 调试路由 - 测试基本功能
 */
import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// 测试路由 1: 简单返回
router.get('/test-simple', authenticate, (req: AuthRequest, res) => {
  res.json({ success: true, message: 'OK', userId: req.user!.id });
});

// 测试路由 2: 数据库查询
router.get('/test-db', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    res.json({ success: true, user: user ? { id: user.id, username: user.username } : null });
  } catch (error: any) {
    console.error('DB 测试错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 测试路由 3: JSON 字段解析
router.get('/test-json', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const taskPrefs = user.taskPreferences ? JSON.parse(user.taskPreferences) : {};
    
    res.json({ 
      success: true, 
      taskPreferences: taskPrefs,
      raw: user.taskPreferences 
    });
  } catch (error: any) {
    console.error('JSON 测试错误:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

export default router;
