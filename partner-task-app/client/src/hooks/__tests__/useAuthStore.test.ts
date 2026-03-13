/**
 * useAuthStore Hook Tests
 * 认证状态管理 Hook 测试
 * 
 * 测试范围:
 * - 初始状态
 * - 登录操作
 * - 登出操作
 * - 用户信息更新
 * - 持久化
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '../useAuthStore';

describe('useAuthStore Hook', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
    // 重置 store 状态
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('初始状态', () => {
    it('应该初始化为未登录状态', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('登录操作', () => {
    it('应该成功登录并设置用户信息', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'GROWER' as const,
        nickname: 'Test User',
      };
      const mockToken = 'test-jwt-token-12345';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('应该将 token 存储到 localStorage', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };
      const mockToken = 'test-jwt-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(localStorage.getItem('token')).toBe(mockToken);
    });

    it('应该将用户信息存储到 localStorage', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };
      const mockToken = 'test-jwt-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      const storedUser = localStorage.getItem('user');
      expect(storedUser).toBeTruthy();
      expect(JSON.parse(storedUser!)).toEqual(mockUser);
    });

    it('应该支持不同角色登录', () => {
      const guideUser = {
        id: 1,
        username: 'guide',
        role: 'GUIDE' as const,
      };
      const growerUser = {
        id: 2,
        username: 'grower',
        role: 'GROWER' as const,
      };
      const adminUser = {
        id: 3,
        username: 'admin',
        role: 'ADMIN' as const,
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      // 测试 GUIDE 角色
      act(() => {
        result.current.login(guideUser, mockToken);
      });
      expect(result.current.user?.role).toBe('GUIDE');

      // 测试 GROWER 角色
      act(() => {
        result.current.login(growerUser, mockToken);
      });
      expect(result.current.user?.role).toBe('GROWER');

      // 测试 ADMIN 角色
      act(() => {
        result.current.login(adminUser, mockToken);
      });
      expect(result.current.user?.role).toBe('ADMIN');
    });
  });

  describe('登出操作', () => {
    it('应该清除用户信息和 token', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      // 先登录
      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // 再登出
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('应该清除 localStorage 中的数据', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBeTruthy();

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('用户信息更新', () => {
    it('应该更新用户信息', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
        nickname: 'Old Nickname',
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      // 更新用户信息
      act(() => {
        result.current.updateUser({
          nickname: 'New Nickname',
          avatarUrl: '/new-avatar.png',
        });
      });

      expect(result.current.user?.nickname).toBe('New Nickname');
      expect(result.current.user?.avatarUrl).toBe('/new-avatar.png');
      expect(result.current.user?.username).toBe('testuser'); // 保持不变
    });

    it('应该更新 localStorage 中的用户信息', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      act(() => {
        result.current.updateUser({
          nickname: 'New Nickname',
        });
      });

      const storedUser = JSON.parse(localStorage.getItem('user')!);
      expect(storedUser.nickname).toBe('New Nickname');
    });

    it('在未登录状态下更新应该不生效', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({
          nickname: 'New Nickname',
        });
      });

      expect(result.current.user).toBeNull();
    });

    it('应该支持部分更新', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
        nickname: 'Test',
        avatarUrl: '/old.png',
        email: 'old@example.com',
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      // 只更新 avatarUrl
      act(() => {
        result.current.updateUser({
          avatarUrl: '/new.png',
        });
      });

      expect(result.current.user?.avatarUrl).toBe('/new.png');
      expect(result.current.user?.nickname).toBe('Test'); // 保持不变
      expect(result.current.user?.email).toBe('old@example.com'); // 保持不变
    });
  });

  describe('持久化', () => {
    it('应该从 localStorage 恢复登录状态', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };
      const mockToken = 'persisted-token';

      // 预先设置 localStorage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      // 创建新的 hook 实例
      const { result } = renderHook(() => useAuthStore());

      // 应该自动从 localStorage 恢复
      expect(result.current.token).toBe(mockToken);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('应该处理损坏的 localStorage 数据', () => {
      localStorage.setItem('user', 'invalid-json');
      localStorage.setItem('token', 'some-token');

      // 不应该抛出错误
      expect(() => {
        renderHook(() => useAuthStore());
      }).not.toThrow();
    });

    it('应该忽略过期的 token', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };

      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      // 这里可以添加 token 过期检测逻辑的测试
      // 取决于实际实现
    });
  });

  describe('状态选择器', () => {
    it('应该支持选择器获取特定状态', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockToken);
      });

      // 使用选择器获取特定字段
      const { result: tokenResult } = renderHook(() =>
        useAuthStore((state) => state.token)
      );
      expect(tokenResult.current).toBe(mockToken);

      const { result: userResult } = renderHook(() =>
        useAuthStore((state) => state.user)
      );
      expect(userResult.current).toEqual(mockUser);

      const { result: authResult } = renderHook(() =>
        useAuthStore((state) => state.isAuthenticated)
      );
      expect(authResult.current).toBe(true);
    });
  });

  describe('边界条件', () => {
    it('应该处理空 token', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'GROWER' as const,
      };

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, '');
      });

      expect(result.current.token).toBe('');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('应该处理 null 用户', () => {
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        // @ts-ignore - 测试 null 情况
        result.current.login(null, mockToken);
      });

      expect(result.current.user).toBeNull();
    });

    it('多次登出应该不报错', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
        result.current.logout();
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('重复登录应该覆盖之前的状态', () => {
      const firstUser = {
        id: 1,
        username: 'first',
        role: 'GROWER' as const,
      };
      const secondUser = {
        id: 2,
        username: 'second',
        role: 'GUIDE' as const,
      };
      const mockToken = 'test-token';

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(firstUser, mockToken);
      });

      expect(result.current.user?.username).toBe('first');

      act(() => {
        result.current.login(secondUser, mockToken);
      });

      expect(result.current.user?.username).toBe('second');
      expect(result.current.user?.role).toBe('GUIDE');
    });
  });
});
