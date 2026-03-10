/**
 * 关系证书 API
 * 功能：生成/下载伙伴关系证书（图片/PDF）
 */

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';

const router = Router();

// 注册中文字体（如果系统有的话）
try {
  registerFont(path.join(process.cwd(), '../fonts/simhei.ttf'), { family: 'SimHei' });
} catch (e) {
  console.log('未找到中文字体，使用默认字体');
}

/**
 * GET /api/certificates/:relationshipId
 * 获取关系证书信息
 */
router.get('/:relationshipId', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { relationshipId } = req.params;

    const relationship = await prisma.relationship.findFirst({
      where: {
        id: parseInt(relationshipId),
        OR: [
          { guideId: userId },
          { growerId: userId },
        ],
      },
      include: {
        guide: {
          select: {
            id: true,
            nickname: true,
            username: true,
            avatarUrl: true,
          },
        },
        grower: {
          select: {
            id: true,
            nickname: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!relationship) {
      return res.status(404).json({ error: '关系不存在' });
    }

    // 计算关系天数
    const startDate = relationship.startDate ? new Date(relationship.startDate) : new Date(relationship.createdAt);
    const daysTogether = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // 计算共同完成的任务数
    const completedTasks = await prisma.task.count({
      where: {
        relationshipId: relationship.id,
        status: 'COMPLETED',
      },
    });

    res.json({
      success: true,
      data: {
        relationship: {
          id: relationship.id,
          mode: relationship.mode,
          status: relationship.status,
          startDate: relationship.startDate,
          createdAt: relationship.createdAt,
          guide: {
            name: relationship.guide.nickname || relationship.guide.username,
            avatarUrl: relationship.guide.avatarUrl,
          },
          grower: {
            name: relationship.grower.nickname || relationship.grower.username,
            avatarUrl: relationship.grower.avatarUrl,
          },
        },
        stats: {
          daysTogether,
          completedTasks,
        },
      },
    });
  } catch (error) {
    console.error('获取证书信息失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/certificates/:relationshipId/image
 * 生成证书图片
 */
router.get('/:relationshipId/image', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { relationshipId } = req.params;

    // 获取关系信息
    const relationship = await prisma.relationship.findFirst({
      where: {
        id: parseInt(relationshipId),
        OR: [
          { guideId: userId },
          { growerId: userId },
        ],
      },
      include: {
        guide: {
          select: { nickname: true, username: true },
        },
        grower: {
          select: { nickname: true, username: true },
        },
      },
    });

    if (!relationship) {
      return res.status(404).json({ error: '关系不存在' });
    }

    // 计算关系天数
    const startDate = relationship.startDate ? new Date(relationship.startDate) : new Date(relationship.createdAt);
    const daysTogether = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // 计算共同完成的任务数
    const completedTasks = await prisma.task.count({
      where: {
        relationshipId: relationship.id,
        status: 'COMPLETED',
      },
    });

    // 创建画布
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制星星装饰
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 标题
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 48px SimHei, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('星契 · 伙伴关系证书', width / 2, 80);

    // 副标题
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '24px SimHei, Arial';
    ctx.fillText('以星为契，以心为诺', width / 2, 120);

    // 分隔线
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 140);
    ctx.lineTo(600, 140);
    ctx.stroke();

    // 关系信息
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '20px SimHei, Arial';
    
    const guideName = relationship.guide.nickname || relationship.guide.username;
    const growerName = relationship.grower.nickname || relationship.grower.username;
    
    ctx.fillText(`${guideName} ⇄ ${growerName}`, width / 2, 200);
    ctx.fillText(`伙伴关系 · ${relationship.mode === 'PARTNER' ? '平等伙伴' : '指导成长'}`, width / 2, 240);

    // 统计数据
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 36px SimHei, Arial';
    ctx.fillText(`${daysTogether}`, width / 2 - 100, 320);
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '18px SimHei, Arial';
    ctx.fillText('相伴天数', width / 2 - 100, 350);

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 36px SimHei, Arial';
    ctx.fillText(`${completedTasks}`, width / 2 + 100, 320);
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '18px SimHei, Arial';
    ctx.fillText('共同任务', width / 2 + 100, 350);

    // 证书编号
    ctx.fillStyle = '#95a5a6';
    ctx.font = '14px SimHei, Arial';
    ctx.textAlign = 'right';
    const certId = `SC-${relationship.id.toString().padStart(6, '0')}-${startDate.getFullYear()}`;
    ctx.fillText(`证书编号：${certId}`, width - 40, height - 40);

    // 生成日期
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    ctx.fillText(`生成日期：${dateStr}`, width - 40, height - 20);

    // 导出图片
    const buffer = canvas.toBuffer('image/png');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${relationshipId}.png"`);
    res.send(buffer);
  } catch (error) {
    console.error('生成证书图片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/certificates/:relationshipId/share
 * 分享证书（生成分享链接/二维码数据）
 */
router.post('/:relationshipId/share', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { relationshipId } = req.params;

    // 验证关系
    const relationship = await prisma.relationship.findFirst({
      where: {
        id: parseInt(relationshipId),
        OR: [
          { guideId: userId },
          { growerId: userId },
        ],
      },
    });

    if (!relationship) {
      return res.status(404).json({ error: '关系不存在' });
    }

    // 生成分享数据（实际可以生成短链接或二维码）
    const shareData = {
      relationshipId: relationship.id,
      shareToken: Buffer.from(`${relationship.id}-${Date.now()}`).toString('base64'),
      shareUrl: `https://starpact.app/certificates/${relationship.id}/share`,
    };

    res.json({
      success: true,
      data: shareData,
    });
  } catch (error) {
    console.error('分享证书失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
