/**
 * Partner Task App - Server Entry Point
 * 伙伴任务打卡系统 - Node.js 后端入口
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import routes
import authRoutes from './routes/auth';
// TODO: import userRoutes from './routes/user';
// TODO: import relationshipRoutes from './routes/relationship';
// TODO: import taskRoutes from './routes/task';
// TODO: import rewardRoutes from './routes/reward';
// TODO: import cottageRoutes from './routes/cottage';
// TODO: import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { sensitiveWordFilter } from './middleware/sensitiveWordFilter';

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== Middleware ====================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Sensitive word filter (compliance requirement)
app.use(sensitiveWordFilter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'partner-task-server',
    version: '1.0.0',
  });
});

// ==================== API Routes ====================

// Root
app.get('/api', (req, res) => {
  res.json({
    name: 'Partner Task API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      relationships: '/api/relationships',
      tasks: '/api/tasks',
      rewards: '/api/rewards',
      cottage: '/api/cottage',
      admin: '/api/admin',
    },
  });
});

// Register routes
app.use('/api/auth', authRoutes);
// TODO: app.use('/api/users', userRoutes);
// TODO: app.use('/api/relationships', relationshipRoutes);
// TODO: app.use('/api/tasks', taskRoutes);
// TODO: app.use('/api/rewards', rewardRoutes);
// TODO: app.use('/api/cottage', cottageRoutes);
// TODO: app.use('/api/admin', adminRoutes);

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use(errorHandler);

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 Partner Task Server - 伙伴任务打卡系统                ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Port: ${PORT}
║   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
║                                                           ║
║   Status: Running ✅                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
