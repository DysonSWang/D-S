/**
 * Database Connection Singleton
 * 单例 PrismaClient 实例，避免连接池浪费和内存泄漏
 */

import { PrismaClient } from '@prisma/client';

// 单例实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建或复用 PrismaClient 实例
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// 开发环境下热重载时复用连接
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 优雅关闭数据库连接
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

// 测试数据库连接
export async function testDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export default prisma;
