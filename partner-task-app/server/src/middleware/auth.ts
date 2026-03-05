import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Please provide authentication token');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      role: string;
    };

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true, status: true },
    });

    if (!user || user.status !== 1) {
      throw new UnauthorizedError('User not found or disabled');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

/**
 * Check if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Check if user is the owner of a resource
 */
export const isOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const userId = req.params.userId || req.body.userId;
  if (!userId) {
    return next(new ForbiddenError('User ID required'));
  }

  if (req.user.id !== parseInt(userId) && req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Not authorized to access this resource'));
  }

  next();
};

/**
 * Generate JWT token
 */
export function generateToken(payload: { userId: number; username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify token (utility function)
 */
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
