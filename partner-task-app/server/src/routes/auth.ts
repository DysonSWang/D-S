import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authLimiter } from '../middleware/rateLimiter';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { BadRequestError, ConflictError, UnauthorizedError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { username, password, email, role = 'GROWER' } = req.body;

    // Validation
    if (!username || !password) {
      throw new BadRequestError('Username and password are required');
    }

    if (password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    // Check if username exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      throw new ConflictError('Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email,
        role: role.toUpperCase(),
        nickname: username,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.status(201).json({
      message: 'Registration successful',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      throw new BadRequestError('Username and password are required');
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Check status
    if (user.status !== 1) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Return user info (without password)
    const userInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };

    res.json({
      message: 'Login successful',
      user: userInfo,
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        timezone: true,
        safetyWordYellow: true,
        safetyWordRed: true,
        ageVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/password
 * Change password
 */
router.put('/password', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters');
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash },
    });

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
